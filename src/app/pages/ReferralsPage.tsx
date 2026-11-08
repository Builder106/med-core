import { ArrowRightLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { referrals as mockReferrals, patients } from '../data/mock-data';
import { listReferrals, type Referral } from '../services/api';

interface ReferralRow {
  id: string;
  patientId: string;
  date: string;
  urgency: string;
  status: string;
  reason: string;
  fromDoctor: string;
  fromFacility: string;
  toDoctor: string;
  toFacility: string;
}

function apiToRow(r: Referral): ReferralRow {
  return {
    id: r.id,
    patientId: r.patientId,
    date: new Date(r.createdAt).toISOString().slice(0, 10),
    urgency: r.urgency,
    status: r.status,
    reason: r.reason,
    fromDoctor: r.fromDoctorId,
    fromFacility: 'MedCore Clinic',
    toDoctor: r.toDoctorId ?? r.specialty ?? 'Specialist',
    toFacility: r.toFacility ?? '—',
  };
}

export function ReferralsPage() {
  const { role, currentUserId, currentPatientId } = useApp();
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [apiOk, setApiOk] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params =
          role === 'patient'
            ? { patientId: currentPatientId }
            : role === 'doctor'
              ? { doctorId: currentUserId }
              : {};
        const res = await listReferrals(params);
        if (cancelled) return;
        setRows(res.referrals.map(apiToRow));
        setApiOk(true);
      } catch {
        if (cancelled) return;
        setApiOk(false);
        setRows(
          mockReferrals.map(ref => ({
            id: ref.id,
            patientId: ref.patientId,
            date: ref.date,
            urgency: ref.urgency,
            status: ref.status,
            reason: ref.reason,
            fromDoctor: ref.fromDoctor,
            fromFacility: ref.fromFacility,
            toDoctor: ref.toDoctor,
            toFacility: ref.toFacility,
          }))
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, currentUserId, currentPatientId]);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-foreground">Referrals</h1>
      </div>
      {!apiOk && (
        <div
          role="status"
          className="text-[13px] text-amber-950 bg-amber-50 border border-amber-300 rounded-md px-3 py-2"
        >
          The server is unreachable, so this page shows sample data.
        </div>
      )}
      <div className="space-y-4">
        {loading && <p className="text-[13px] text-muted-foreground">Loading referrals…</p>}
        {!loading && rows.length === 0 && (
          <p className="text-[13px] text-muted-foreground">No referrals.</p>
        )}
        {rows.map(ref => {
          const patient = patients.find(p => p.id === ref.patientId);
          return (
            <div key={ref.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`text-[12px] px-2 py-0.5 rounded ${ref.urgency === 'emergency' ? 'bg-red-100 text-red-700' : ref.urgency === 'urgent' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'}`}
                >
                  {ref.urgency}
                </span>
                <span
                  className={`text-[12px] px-2 py-0.5 rounded ${ref.status === 'accepted' ? 'bg-green-100 text-green-700' : ref.status === 'completed' ? 'bg-muted text-muted-foreground' : 'bg-yellow-100 text-yellow-700'}`}
                >
                  {ref.status}
                </span>
                <span className="text-[12px] text-muted-foreground">{ref.date}</span>
              </div>
              <p className="text-[14px] mb-2">
                {patient ? `${patient.firstName} ${patient.lastName}` : ref.patientId} (
                {ref.patientId})
              </p>
              <p className="text-[13px] text-muted-foreground mb-3">{ref.reason}</p>
              <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
                <div className="flex-1 p-2 bg-muted rounded-lg">
                  <p className="text-[12px] text-muted-foreground">From</p>
                  <p>{ref.fromDoctor}</p>
                  <p className="text-[12px] text-muted-foreground">{ref.fromFacility}</p>
                </div>
                <ArrowRightLeft className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 p-2 bg-muted rounded-lg">
                  <p className="text-[12px] text-muted-foreground">To</p>
                  <p>{ref.toDoctor}</p>
                  <p className="text-[12px] text-muted-foreground">{ref.toFacility}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
