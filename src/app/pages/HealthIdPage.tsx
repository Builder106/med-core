import { Check, Download, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { patients } from '../data/mock-data';
import { isLikelyUnreachableForQrScan, resolvePublicOrigin } from '../lib/publicOrigin';
import { exportFhirBundle } from '../services/api';

export function healthIdChartUrl(patientId: string, origin: string) {
  const path = `/patients/${encodeURIComponent(patientId)}?from=health-id`;
  try {
    return new URL(path, origin).href;
  } catch {
    return `${origin}${path}`;
  }
}

export function HealthIdPage() {
  const { currentPatientId } = useApp();
  const patient = patients.find(p => p.id === currentPatientId)!;
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const publicOrigin = useMemo(
    () =>
      resolvePublicOrigin(
        import.meta.env.VITE_PUBLIC_APP_ORIGIN as string | undefined,
        typeof window !== 'undefined' ? window.location.origin : ''
      ),
    []
  );
  const chartUrl = useMemo(
    () => healthIdChartUrl(patient.id, publicOrigin),
    [patient.id, publicOrigin]
  );

  async function handleDownload() {
    setDownloading(true);
    try {
      const json = await exportFhirBundle(patient.id);
      const blob = new Blob([json], { type: 'application/fhir+json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medcore-${patient.id}-fhir.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    await navigator.clipboard.writeText(chartUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  const qrWarn = typeof window !== 'undefined' && isLikelyUnreachableForQrScan(publicOrigin);

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="text-center">
        <h1 className="text-[22px] font-semibold text-foreground">Your Health ID</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Staff at any MedCore clinic can scan this code to open your record.
        </p>
        {qrWarn && (
          <p className="text-left mt-3 mx-auto max-w-sm rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-950">
            Other phones cannot open localhost or LAN URLs. Open the app via your tunnel URL, or set{' '}
            <code className="font-mono text-[12px]">VITE_PUBLIC_APP_ORIGIN</code> to that URL and
            rebuild—the QR encodes that origin.
          </p>
        )}
        <p className="text-[12px] text-muted-foreground mt-2 font-mono break-all max-w-sm mx-auto">
          {chartUrl}
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <h2 className="text-[18px] font-semibold text-foreground">
            {patient.firstName} {patient.lastName}
          </h2>
          <p className="text-muted-foreground text-[13px] mt-0.5 font-mono">{patient.id}</p>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="bg-white p-3 rounded-md border border-border">
            <QRCodeSVG value={chartUrl} size={180} level="H" marginSize={4} />
          </div>

          <div className="w-full mt-6 space-y-0 divide-y divide-border">
            {[
              ['National ID', patient.nationalId],
              ['Date of birth', patient.dob],
              ['Blood type', patient.bloodType],
              ['Phone', patient.phone],
              ['Insurance', patient.insuranceScheme],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-[13px] py-2.5">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground">{value}</span>
              </div>
            ))}
            <div className="flex justify-between text-[13px] py-2.5">
              <span className="text-muted-foreground">Allergies</span>
              <span
                className={
                  patient.allergies.length ? 'font-medium text-red-800' : 'text-muted-foreground'
                }
              >
                {patient.allergies.length ? patient.allergies.join(', ') : 'None recorded'}
              </span>
            </div>
          </div>

          <div className="flex gap-3 mt-6 w-full">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="af-focus flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary-strong disabled:opacity-60 transition-colors text-[13px]"
            >
              <Download className="w-4 h-4" />{' '}
              {downloading ? 'Preparing file…' : 'Download record (FHIR)'}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="af-focus flex-1 flex items-center justify-center gap-2 py-2.5 bg-card border border-border text-foreground rounded-md hover:bg-muted transition-colors text-[13px]"
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
              {copied ? 'Link copied' : 'Copy link'}
            </button>
          </div>
        </div>
      </div>

      <p className="text-[13px] text-muted-foreground">
        Only providers you have given consent to can open your record. You can withdraw access at
        any time from Consent and privacy.
      </p>
    </div>
  );
}
