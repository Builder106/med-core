#!/bin/bash
# Startup script for the medcore-api VM (set as metadata key `startup-script`).
# Runs on EVERY boot.
#
# COS resets both /etc/fstab and /etc/systemd/system on reboot — only
# /var/lib/* is on the stateful overlay. So this script reapplies the disk
# mount and reinstalls the systemd unit each time the VM comes up. Caddy +
# medcore containers themselves come back via Docker's --restart unless-stopped
# policy, but they're recreated here to honour the persistent disk mount.
#
# To update: edit this file, then push to the VM with
#   gcloud compute instances add-metadata medcore-api \
#     --project=medcore-health-platform --zone=us-west1-a \
#     --metadata-from-file=startup-script=scripts/medcore-vm-startup.sh
# It takes effect on the next boot (or run manually with sudo google_metadata_script_runner).

set -eu
exec > >(logger -t medcore-startup -s 2>/dev/console) 2>&1

DISK_BYID=/dev/disk/by-id/google-medcore-data
MOUNT=/mnt/disks/data
DBDIR="${MOUNT}/medcore-db"

echo "[startup] opening iptables for 80/443 (COS default INPUT policy is DROP)"
# COS resets iptables to DROP on every reboot. Caddy uses host networking and
# binds 80/443 directly, but COS's default INPUT chain drops them unless we
# explicitly ACCEPT. GCP-native firewall rules don't help here — those gate
# traffic before it reaches the VM, but the VM's local iptables is a separate
# layer that's also wiped at boot.
iptables -C INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || iptables -I INPUT -p tcp --dport 80 -j ACCEPT
iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || iptables -I INPUT -p tcp --dport 443 -j ACCEPT

echo "[startup] mounting data disk"
mkdir -p "$MOUNT"
if ! mountpoint -q "$MOUNT"; then
  mount -o discard,defaults "$DISK_BYID" "$MOUNT"
fi
mkdir -p "$DBDIR"
chown -R 1001:1001 "$DBDIR"

echo "[startup] stopping any pre-boot-restored containers (they bind-mounted to tmpfs)"
docker stop medcore caddy 2>/dev/null || true
docker rm medcore caddy 2>/dev/null || true

echo "[startup] installing systemd unit (also wiped by reboot)"
cat > /etc/systemd/system/medcore.service <<'UNIT'
[Unit]
Description=MedCore stack (medcore API + Caddy reverse proxy)
After=docker.service network-online.target
Requires=docker.service
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/var/lib/medcore
ExecStartPre=-/bin/bash /var/lib/medcore/down.sh
ExecStart=/bin/bash /var/lib/medcore/up.sh
ExecStop=/bin/bash /var/lib/medcore/down.sh
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable medcore.service
systemctl start medcore.service
echo "[startup] done"
