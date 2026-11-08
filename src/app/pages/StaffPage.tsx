import { useEffect, useState } from 'react';
import { doctors, facilities } from '../data/mock-data';
import { listStaff, type StaffMember } from '../services/api';

interface StaffRow {
  id: string;
  name: string;
  role: string;
  specialty?: string | null;
  facilityName: string;
  status: string;
}

export function StaffPage() {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [apiOk, setApiOk] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await listStaff();
        if (cancelled) return;
        setRows(
          res.staff.map((s: StaffMember) => ({
            id: s.id,
            name: s.name,
            role: s.role,
            specialty: s.specialty,
            facilityName: s.facilityId ?? 'MedCore Clinic',
            status: s.status,
          }))
        );
        setApiOk(true);
      } catch {
        if (cancelled) return;
        setApiOk(false);
        setRows(
          doctors.map(doc => ({
            id: doc.id,
            name: doc.name,
            role: 'Physician',
            specialty: doc.specialty,
            facilityName: facilities.find(f => f.id === doc.facilityId)?.name ?? 'Unknown',
            status: 'active',
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

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-foreground">Staff</h1>
      </div>
      {!apiOk && (
        <div
          role="status"
          className="text-[13px] text-amber-950 bg-amber-50 border border-amber-300 rounded-md px-3 py-2"
        >
          The server is unreachable, so this page shows sample data.
        </div>
      )}
      {loading && <p className="text-[13px] text-muted-foreground">Loading staff…</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map(member => (
          <div key={member.id} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 text-[14px]">
                {member.name
                  .split(' ')
                  .slice(-2)
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div>
                <p className="text-[14px]">{member.name}</p>
                <p className="text-[12px] text-muted-foreground">
                  {member.specialty ?? member.role}
                </p>
              </div>
            </div>
            <p className="text-[12px] text-muted-foreground">{member.facilityName}</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[12px] text-muted-foreground">{member.id}</p>
              <span
                className={`text-[12px] px-2 py-0.5 rounded ${member.status === 'active' ? 'bg-green-100 text-green-700' : member.status === 'on_leave' ? 'bg-amber-100 text-amber-800' : 'bg-muted text-muted-foreground'}`}
              >
                {member.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
