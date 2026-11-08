import { AlertTriangle, ArrowRight, KeyRound, QrCode, Smartphone, WifiOff } from 'lucide-react';
import { Link } from 'react-router';
import { useApp } from '../../context/AppContext';
import {
  appointments,
  auditLog,
  consentRecords,
  encounters,
  patients,
  prescriptions,
  vaccinations,
} from '../../data/mock-data';

export function PatientDashboard() {
  const { currentPatientId, lowBandwidth, lang } = useApp();
  const patient = patients.find(p => p.id === currentPatientId)!;
  const upcoming = appointments.filter(
    a => a.patientId === currentPatientId && a.status === 'scheduled'
  );
  const activeRx = prescriptions.filter(
    p => p.patientId === currentPatientId && p.status === 'active'
  );
  const recentVisits = encounters.filter(e => e.patientId === currentPatientId).slice(0, 3);
  const overdueVax = vaccinations.filter(
    v => v.patientId === currentPatientId && v.nextDue && new Date(v.nextDue) < new Date()
  );
  const consents = consentRecords.filter(c => c.patientId === currentPatientId);
  const accessLog = auditLog.filter(a => a.patientId === currentPatientId).slice(0, 3);
  const approvedConsents = consents.filter(c => c.granted).length;
  const revokedConsents = consents.filter(c => !c.granted).length;

  const nextAppt = upcoming[0];
  const activeMeds = activeRx.flatMap(rx =>
    rx.medications.map((med, i) => ({ ...med, key: `${rx.id}-${i}` }))
  );

  return (
    <div className="space-y-5 max-w-6xl">
      <section className="bg-card rounded-lg border border-border p-5">
        <h2 className="text-[20px] font-semibold text-foreground">
          {patient.firstName} {patient.lastName}
        </h2>
        <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-[14px]">
          <div>
            <dt className="text-[13px] text-muted-foreground">Patient ID</dt>
            <dd className="text-foreground">{patient.id}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-muted-foreground">Blood type</dt>
            <dd className="text-foreground">{patient.bloodType}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-muted-foreground">Insurance</dt>
            <dd className="text-foreground">{patient.insuranceScheme}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-muted-foreground">Allergies</dt>
            <dd
              className={
                patient.allergies.length > 0 ? 'font-medium text-red-800' : 'text-foreground'
              }
            >
              {patient.allergies.length > 0 ? patient.allergies.join(', ') : 'None recorded'}
            </dd>
          </div>
        </dl>
      </section>

      {overdueVax.length > 0 && (
        <div
          role="status"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-800 mt-0.5 shrink-0" aria-hidden />
          <div className="flex-1">
            <p className="text-[14px] font-medium text-amber-950">
              {overdueVax.length === 1
                ? 'A vaccination is overdue'
                : `${overdueVax.length} vaccinations are overdue`}
            </p>
            <p className="text-[13px] text-amber-900 mt-0.5">
              {overdueVax.map(v => `${v.vaccine} (due ${v.nextDue})`).join(', ')}
            </p>
          </div>
          <Link
            to="/vaccinations"
            className="af-focus text-[13px] font-medium text-amber-950 underline whitespace-nowrap shrink-0"
          >
            View vaccinations
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-foreground">Next appointment</h2>
            <Link
              to="/appointments"
              className="af-focus text-primary text-[13px] inline-flex items-center gap-1 hover:underline"
            >
              All appointments <ArrowRight className="w-3.5 h-3.5" aria-hidden />
            </Link>
          </div>
          {nextAppt ? (
            <div className="flex items-start gap-4">
              <div className="w-14 shrink-0 rounded-md border border-border py-1.5 text-center">
                <p className="text-[18px] font-semibold leading-tight text-foreground">
                  {nextAppt.date.split('-')[2]}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {new Date(nextAppt.date).toLocaleString(lang, { month: 'short' })}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-foreground">{nextAppt.type}</p>
                <p className="text-[14px] text-foreground mt-0.5">{nextAppt.doctorName}</p>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  {nextAppt.facilityName}, {nextAppt.time}
                </p>
                {nextAppt.estimatedWait ? (
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    Expected wait about {nextAppt.estimatedWait} min
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-[14px] text-muted-foreground">No upcoming appointments.</p>
          )}
          {upcoming.length > 1 && (
            <ul className="mt-4 pt-3 border-t border-border space-y-1.5">
              {upcoming.slice(1).map(apt => (
                <li key={apt.id} className="flex items-center gap-3 text-[13px]">
                  <span className="text-muted-foreground w-16 shrink-0 tabular-nums">
                    {apt.date.slice(5)}
                  </span>
                  <span className="text-foreground truncate">{apt.type}</span>
                  <span className="text-muted-foreground ml-auto shrink-0">{apt.time}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-card rounded-lg border border-border p-5">
          <h2 className="text-[15px] font-semibold text-foreground">Your Health ID</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Show this code at any MedCore clinic so staff can find your record.
          </p>
          <Link
            to="/health-id"
            className="af-press af-focus mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-[14px] text-primary-foreground hover:bg-primary-strong"
          >
            <QrCode className="w-4 h-4" aria-hidden />
            Open Health ID
          </Link>
        </section>
      </div>

      <section className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-foreground">Active medications</h2>
          <Link
            to="/prescriptions"
            className="af-focus text-primary text-[13px] inline-flex items-center gap-1 hover:underline"
          >
            All prescriptions <ArrowRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
        </div>
        {activeMeds.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeMeds.map(med => (
              <li key={med.key} className="p-3 rounded-md border border-border">
                <p className="text-[14px] font-medium text-foreground">{med.name}</p>
                <p className="text-[13px] text-muted-foreground">
                  {med.dosage}, {med.frequency}
                </p>
                {med.duration && (
                  <p className="text-[13px] text-muted-foreground">{med.duration}</p>
                )}
                {med.interactions && med.interactions.length > 0 && (
                  <p className="text-[13px] text-amber-900 mt-2 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden />
                    {med.interactions[0]}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-muted-foreground">No active medications.</p>
        )}
      </section>

      <section className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[15px] font-semibold text-foreground">Recent visits</h2>
          <Link
            to="/records"
            className="af-focus text-primary text-[13px] inline-flex items-center gap-1 hover:underline"
          >
            Full history <ArrowRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {recentVisits.map(enc => (
            <li key={enc.id} className="flex gap-4 py-3">
              <span className="w-20 shrink-0 text-[13px] tabular-nums text-muted-foreground">
                {enc.date}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <p className="text-[14px] text-foreground">{enc.diagnosis}</p>
                  <span
                    className={`text-[12px] capitalize ${enc.type === 'emergency' ? 'font-medium text-red-800' : 'text-muted-foreground'}`}
                  >
                    {enc.type}
                  </span>
                </div>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  {enc.doctorName}, {enc.facilityName}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[15px] font-semibold text-foreground">Who can see your record</h2>
            <Link to="/consent" className="af-focus text-primary text-[13px] hover:underline">
              Manage permissions
            </Link>
          </div>
          <p className="text-[14px] text-foreground">
            {approvedConsents} permission{approvedConsents === 1 ? '' : 's'} granted,{' '}
            {revokedConsents} revoked.
          </p>
          {accessLog.length > 0 && (
            <>
              <h3 className="text-[13px] font-medium text-muted-foreground mt-4">Recent access</h3>
              <ul className="mt-1 divide-y divide-border">
                {accessLog.map(entry => (
                  <li key={entry.id} className="py-2">
                    <p className="text-[14px] text-foreground">{entry.accessedBy}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {entry.action}, {new Date(entry.timestamp).toLocaleString(lang)}
                    </p>
                  </li>
                ))}
              </ul>
              <Link
                to="/audit-log"
                className="af-focus inline-block mt-2 text-primary text-[13px] hover:underline"
              >
                Full access log
              </Link>
            </>
          )}
        </section>

        <section className="bg-card rounded-lg border border-border p-5">
          <h2 className="text-[15px] font-semibold text-foreground">Ways to reach MedCore</h2>
          <ul className="mt-2 space-y-2 text-[14px] text-foreground">
            <li className="flex items-start gap-2">
              <Smartphone className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
              The MedCore app on Android, or this website on any phone.
            </li>
            <li className="flex items-start gap-2">
              <WifiOff className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
              Without internet: your record stays on this phone and syncs when you are back online.
              {lowBandwidth && ' Low-bandwidth mode is on.'}
            </li>
            <li className="flex items-start gap-2">
              <KeyRound className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
              On a basic phone: dial *123# for appointments and reminders.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
