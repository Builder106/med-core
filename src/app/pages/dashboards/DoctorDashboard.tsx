import { ArrowRight, Bot, Search, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  appointments as mockAppointments,
  encounters as mockEncounters,
  labResults as mockLabResults,
  patients as mockPatients,
  referrals as mockReferrals,
  vaccinations as mockVaccinations,
} from '../../data/mock-data';
import {
  listAppointments,
  listCriticalLabs,
  listOverdueVaccinations,
  listPatients,
  listRecentEncounters,
  listReferrals,
  type Appointment,
  type Encounter,
  type Patient,
  type Referral,
} from '../../services/api';

interface DisplayAppt {
  id: string;
  patientId: string;
  time: string;
  type: string;
  estimatedWait: number;
}
interface DisplayRef {
  id: string;
  patientId: string;
  reason: string;
  urgency: string;
  status: string;
  toFacility: string;
}

function apptToDisplay(a: Appointment): DisplayAppt {
  const d = new Date(a.scheduledFor);
  return {
    id: a.id,
    patientId: a.patientId,
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: a.reason ?? 'Consultation',
    estimatedWait: 0,
  };
}

function refToDisplay(r: Referral): DisplayRef {
  return {
    id: r.id,
    patientId: r.patientId,
    reason: r.reason,
    urgency: r.urgency,
    status: r.status,
    toFacility: r.toFacility ?? '—',
  };
}

export function DoctorDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appts, setAppts] = useState<DisplayAppt[]>([]);
  const [refs, setRefs] = useState<DisplayRef[]>([]);
  const [criticalLabCount, setCriticalLabCount] = useState(0);
  const [overdueVaxCount, setOverdueVaxCount] = useState(0);
  const [timeline, setTimeline] = useState<Encounter[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pl, al, rl, cl, ov, tl] = await Promise.all([
          listPatients(),
          listAppointments(),
          listReferrals(),
          listCriticalLabs(),
          listOverdueVaccinations(),
          listRecentEncounters(5),
        ]);
        if (cancelled) return;
        setPatients(pl.patients);
        setAppts(al.appointments.filter(a => a.status === 'scheduled').map(apptToDisplay));
        setRefs(rl.referrals.map(refToDisplay));
        setCriticalLabCount(cl.labs.length);
        setOverdueVaxCount(ov.vaccinations.length);
        setTimeline(tl.encounters);
      } catch {
        if (cancelled) return;
        setPatients(
          mockPatients.map(p => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            dob: p.dob,
            phone: p.phone,
            nationalId: p.nationalId,
            bloodType: p.bloodType,
            allergies: p.allergies,
            insuranceScheme: p.insuranceScheme,
            createdAt: 0,
          }))
        );
        setAppts(
          mockAppointments
            .filter(a => a.status === 'scheduled')
            .map(a => ({
              id: a.id,
              patientId: a.patientId,
              time: a.time,
              type: a.type,
              estimatedWait: a.estimatedWait ?? 0,
            }))
        );
        setRefs(
          mockReferrals
            .filter(r => r.status === 'pending')
            .map(r => ({
              id: r.id,
              patientId: r.patientId,
              reason: r.reason,
              urgency: r.urgency,
              status: r.status,
              toFacility: r.toFacility,
            }))
        );
        setCriticalLabCount(mockLabResults.filter(r => r.status === 'critical').length);
        setOverdueVaxCount(
          mockVaccinations.filter(v => v.nextDue && new Date(v.nextDue) < new Date()).length
        );
        setTimeline(
          mockEncounters
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 5)
            .map(e => ({
              id: e.id,
              patientId: e.patientId,
              doctorId: '',
              encounterDate: new Date(e.date).getTime(),
              type: e.type as Encounter['type'],
              diagnosis: e.diagnosis,
              notes: e.notes,
              createdAt: 0,
            }))
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingRefs = refs.filter(r => r.status === 'pending');
  const followUps = [
    {
      count: criticalLabCount,
      label: `critical lab result${criticalLabCount === 1 ? '' : 's'} to call back`,
      to: '/lab-results',
    },
    {
      count: pendingRefs.length,
      label: `referral${pendingRefs.length === 1 ? '' : 's'} awaiting acceptance`,
      to: '/referrals',
    },
    {
      count: overdueVaxCount,
      label: `overdue vaccination${overdueVaxCount === 1 ? '' : 's'}`,
      to: '/vaccinations',
    },
  ].filter(item => item.count > 0);

  const stats = [
    { label: 'Waiting', value: appts.length, alert: false },
    { label: 'Critical labs', value: criticalLabCount, alert: criticalLabCount > 0 },
    { label: 'Pending referrals', value: pendingRefs.length, alert: false },
    { label: 'Overdue vaccinations', value: overdueVaxCount, alert: false },
  ];

  const searchResults =
    searchQuery.length > 1
      ? patients.filter(p =>
          `${p.firstName} ${p.lastName} ${p.phone} ${p.nationalId} ${p.id}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      : [];

  return (
    <div className="space-y-5 max-w-7xl">
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-lg bg-card border border-border px-4 py-3">
            <dt className="text-[13px] text-muted-foreground">{stat.label}</dt>
            <dd
              className={`text-[24px] font-semibold leading-tight ${stat.alert ? 'text-destructive' : 'text-foreground'}`}
            >
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <section className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-[15px] font-semibold text-foreground">
                <label htmlFor="doctor-patient-search">Find a patient</label>
              </h2>
              <Link
                to="/ai-assistant"
                className="af-press af-focus inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-[13px] text-foreground hover:bg-muted"
              >
                <Bot className="w-4 h-4" aria-hidden />
                AI assistant
              </Link>
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 bg-card border border-input rounded-md px-3 py-2.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
                <Search className="w-4 h-4 text-muted-foreground" aria-hidden />
                <input
                  id="doctor-patient-search"
                  type="search"
                  placeholder="Name, phone, national ID or patient ID"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[14px]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="af-focus text-[13px] text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-20 overflow-hidden">
                  {searchResults.map(p => (
                    <Link
                      key={p.id}
                      to={`/patients/${p.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted border-b border-border last:border-0"
                    >
                      <div className="flex-1">
                        <p className="text-[14px] text-foreground">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-[12px] text-muted-foreground">
                          {p.id}, {p.phone}
                        </p>
                      </div>
                      {p.allergies.length > 0 && (
                        <span className="text-[12px] bg-red-50 text-red-800 px-2 py-0.5 rounded border border-red-200">
                          Allergy: {p.allergies[0]}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="bg-card rounded-lg border border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-[15px] font-semibold text-foreground">Appointment queue</h2>
              <Link
                to="/appointments"
                className="af-focus text-primary text-[13px] inline-flex items-center gap-1 hover:underline"
              >
                Full schedule <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              </Link>
            </div>
            <ol className="divide-y divide-border">
              {appts.slice(0, 6).map((apt, i) => {
                const patient = patients.find(p => p.id === apt.patientId);
                const isNext = i === 0;
                return (
                  <li
                    key={apt.id}
                    className={`flex items-center gap-4 px-4 py-3 ${isNext ? 'bg-accent' : ''}`}
                  >
                    <span className="w-16 text-[13px] tabular-nums text-muted-foreground shrink-0">
                      {apt.time}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/patients/${apt.patientId}`}
                        className="af-focus text-[14px] font-medium text-foreground hover:underline"
                      >
                        {patient ? `${patient.firstName} ${patient.lastName}` : apt.patientId}
                      </Link>
                      <p className="text-[13px] text-muted-foreground">{apt.type}</p>
                    </div>
                    {apt.estimatedWait > 0 && (
                      <span className="text-[13px] text-muted-foreground shrink-0">
                        About {apt.estimatedWait} min
                      </span>
                    )}
                    {isNext && (
                      <span className="text-[12px] font-medium text-primary shrink-0">Next</span>
                    )}
                  </li>
                );
              })}
              {appts.length === 0 && (
                <li className="px-4 py-4 text-[13px] text-muted-foreground">
                  No appointments scheduled.
                </li>
              )}
            </ol>
          </section>

          <section className="bg-card rounded-lg border border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-[15px] font-semibold text-foreground">Unified timeline</h2>
              <Link to="/records" className="af-focus text-primary text-[13px] hover:underline">
                Open full timeline
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {timeline.map(item => (
                <li key={item.id} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[14px] text-foreground">
                      {item.diagnosis ?? item.chiefComplaint ?? '—'}
                    </p>
                    <span className="text-[12px] text-muted-foreground capitalize shrink-0">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {item.patientId}, {new Date(item.encounterDate).toISOString().slice(0, 10)}
                  </p>
                </li>
              ))}
              {timeline.length === 0 && (
                <li className="px-4 py-4 text-[13px] text-muted-foreground">
                  No recent encounters.
                </li>
              )}
            </ul>
          </section>
        </div>

        <div className="space-y-5">
          <section className="bg-card rounded-lg border border-border p-4">
            <h2 className="text-[15px] font-semibold text-foreground">Needs follow-up</h2>
            {followUps.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {followUps.map(item => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="af-focus flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-950 hover:bg-amber-100"
                    >
                      <TriangleAlert className="w-4 h-4 shrink-0 text-amber-800" aria-hidden />
                      <span className="flex-1">
                        <span className="font-semibold">{item.count}</span> {item.label}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[13px] text-muted-foreground">
                Nothing needs follow-up right now.
              </p>
            )}
          </section>

          <section className="bg-card rounded-lg border border-border p-4">
            <h2 className="text-[15px] font-semibold text-foreground">Referral tracker</h2>
            <ul className="mt-3 space-y-2">
              {pendingRefs.slice(0, 4).map(ref => {
                const p = patients.find(pt => pt.id === ref.patientId);
                return (
                  <li key={ref.id} className="rounded-md border border-border p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[14px] font-medium text-foreground">
                        {p ? `${p.firstName} ${p.lastName}` : ref.patientId}
                      </p>
                      <span
                        className={`text-[12px] capitalize ${ref.urgency === 'routine' ? 'text-muted-foreground' : 'font-medium text-red-800'}`}
                      >
                        {ref.urgency}
                      </span>
                    </div>
                    <p className="text-[13px] text-muted-foreground mt-0.5">{ref.reason}</p>
                    <p className="text-[12px] text-muted-foreground mt-1">To {ref.toFacility}</p>
                  </li>
                );
              })}
              {pendingRefs.length === 0 && (
                <li className="text-[13px] text-muted-foreground">
                  No referrals awaiting acceptance.
                </li>
              )}
            </ul>
          </section>

          <section className="bg-card rounded-lg border border-border p-4">
            <h2 className="text-[15px] font-semibold text-foreground">Before you prescribe</h2>
            <ul className="mt-2 space-y-1.5 text-[13px] text-foreground list-disc pl-5 marker:text-muted-foreground">
              <li>Check allergies on the patient record.</li>
              <li>Review the latest critical lab results.</li>
              <li>Check overdue screenings and vaccinations.</li>
              <li>Confirm the urgency of any open referral.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
