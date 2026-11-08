import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ResponsiveTable, type TableColumn } from '../components/ui/responsive-table';
import { auditLog as mockAudit } from '../data/mock-data';
import { downloadCsv } from '../lib/csv';
import { listAudit, type AuditEntry } from '../services/api';

interface AuditRow {
  id: string;
  timestamp: number;
  patientId: string;
  accessedBy: string;
  role: string;
  action: string;
  section: string;
  facility: string;
}

function apiToRow(entry: AuditEntry): AuditRow {
  return {
    id: entry.id,
    timestamp: entry.createdAt,
    patientId: entry.patientId ?? '—',
    accessedBy: entry.userId ?? 'anonymous',
    role: entry.role ?? 'unknown',
    action: entry.action,
    section: entry.path.replace(/^\//, ''),
    facility: `${entry.method}, ${entry.status}`,
  };
}

export function AuditLogPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [apiOk, setApiOk] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await listAudit({ limit: 200 });
        if (cancelled) return;
        setRows(res.entries.map(apiToRow));
        setApiOk(true);
      } catch {
        if (cancelled) return;
        setApiOk(false);
        setRows(
          mockAudit.map(a => ({
            id: a.id,
            timestamp: new Date(a.timestamp).getTime(),
            patientId: a.patientId,
            accessedBy: a.accessedBy,
            role: a.role,
            action: a.action,
            section: a.section,
            facility: a.facility,
          }))
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const columns: TableColumn<AuditRow>[] = [
    {
      key: 'ts',
      header: 'Timestamp',
      cell: a => (
        <span className="whitespace-nowrap text-[12px] text-muted-foreground">
          {new Date(a.timestamp).toLocaleString()}
        </span>
      ),
    },
    { key: 'pid', header: 'Patient ID', cell: a => a.patientId },
    { key: 'by', header: 'Accessed by', cell: a => a.accessedBy },
    {
      key: 'role',
      header: 'Role',
      cell: a => <span className="bg-muted px-2 py-0.5 rounded text-[12px]">{a.role}</span>,
    },
    { key: 'action', header: 'Action', cell: a => a.action },
    {
      key: 'section',
      header: 'Section',
      cell: a => (
        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[12px]">
          {a.section}
        </span>
      ),
    },
    { key: 'facility', header: 'Facility', cell: a => a.facility, hideOnMobile: true },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-[22px] font-semibold text-foreground">Audit log</h1>
        <button
          type="button"
          disabled={rows.length === 0}
          onClick={() =>
            downloadCsv('audit-log', [
              ['Time', 'Patient', 'User', 'Role', 'Action', 'Section', 'Request'],
              ...rows.map(r => [
                new Date(r.timestamp).toISOString(),
                r.patientId,
                r.accessedBy,
                r.role,
                r.action,
                r.section,
                r.facility,
              ]),
            ])
          }
          className="af-tap af-press af-focus inline-flex items-center gap-2 px-3 py-2 bg-card border border-border text-foreground rounded-md hover:bg-muted text-[14px] disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>
      {!apiOk && (
        <div
          role="status"
          className="text-[13px] text-amber-950 bg-amber-50 border border-amber-300 rounded-md px-3 py-2"
        >
          The server is unreachable, so this page shows sample data. Audit endpoint is admin-only.
        </div>
      )}
      <ResponsiveTable
        columns={columns}
        rows={rows}
        rowKey={a => a.id}
        emptyLabel={loading ? 'Loading audit log…' : 'No audit entries'}
        mobileTitle={a => `${a.action}, ${a.section}`}
        mobileSubtitle={a => `${a.accessedBy} — ${new Date(a.timestamp).toLocaleString()}`}
      />
    </div>
  );
}
