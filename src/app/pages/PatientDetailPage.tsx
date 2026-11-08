import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bot,
  Clock,
  FlaskConical,
  Loader2,
  Pill,
  ShieldCheck,
  Syringe,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ResponsiveTable, type TableColumn } from '../components/ui/responsive-table';
import {
  encounters as mockEncounters,
  labResults as mockLabs,
  patients as mockPatients,
  prescriptions as mockPrescriptions,
  vaccinations as mockVax,
} from '../data/mock-data';
import {
  checkInsuranceEligibility,
  getPatient,
  listEncounters,
  listLabs,
  listPrescriptions,
  listVaccinations,
  verifyNationalId,
  type InsuranceEligibilityResult,
  type RegistryVerifyResult,
} from '../services/api';

type Tab = 'timeline' | 'prescriptions' | 'labs' | 'vaccinations';

interface DisplayPatient {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  nationalId: string;
  bloodType?: string | null;
  allergies: string[];
  insuranceScheme?: string | null;
  gender?: string;
}
interface DisplayEncounter {
  id: string;
  type: string;
  date: string;
  facilityName: string;
  diagnosis: string;
  notes: string;
  doctorName: string;
  vitals?: Record<string, string>;
}
interface DisplayRx {
  id: string;
  status: string;
  date: string;
  doctorName: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    interactions?: string[];
  }[];
}
interface DisplayLab {
  id: string;
  date: string;
  testName: string;
  result: string;
  referenceRange?: string;
  status: string;
  labName?: string;
}
interface DisplayVax {
  id: string;
  vaccine: string;
  dose: string;
  date: string;
  site?: string;
  batchNumber?: string;
  nextDue?: string;
}

export function PatientDetailPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState<DisplayPatient | null>(null);
  const [encounters, setEncounters] = useState<DisplayEncounter[]>([]);
  const [prescriptions, setPrescriptions] = useState<DisplayRx[]>([]);
  const [labs, setLabs] = useState<DisplayLab[]>([]);
  const [vaccinations, setVaccinations] = useState<DisplayVax[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('timeline');
  const [registry, setRegistry] = useState<RegistryVerifyResult | null>(null);
  const [insurance, setInsurance] = useState<InsuranceEligibilityResult | null>(null);
  const [verifyingRegistry, setVerifyingRegistry] = useState(false);
  const [verifyingInsurance, setVerifyingInsurance] = useState(false);

  async function handleVerifyRegistry() {
    if (!id) return;
    setVerifyingRegistry(true);
    try {
      setRegistry(await verifyNationalId({ patientId: id }));
    } finally {
      setVerifyingRegistry(false);
    }
  }

  async function handleCheckInsurance() {
    if (!id) return;
    setVerifyingInsurance(true);
    try {
      setInsurance(await checkInsuranceEligibility({ patientId: id }));
    } finally {
      setVerifyingInsurance(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [p, enc, rx, lb, vx] = await Promise.all([
          getPatient(id),
          listEncounters(id),
          listPrescriptions(id),
          listLabs(id),
          listVaccinations(id),
        ]);
        if (cancelled) return;
        setPatient(p.patient);
        setEncounters(
          enc.encounters
            .map(e => ({
              id: e.id,
              type: e.type,
              date: new Date(e.encounterDate).toISOString().slice(0, 10),
              facilityName: 'MedCore Clinic',
              diagnosis: e.diagnosis ?? e.chiefComplaint ?? '—',
              notes: e.notes ?? '',
              doctorName: e.doctorId,
            }))
            .sort((a, b) => b.date.localeCompare(a.date))
        );
        setPrescriptions(
          rx.prescriptions.map(r => ({
            id: r.id,
            status: r.status,
            date: new Date(r.createdAt).toISOString().slice(0, 10),
            doctorName: r.doctorId,
            medications: [
              {
                name: r.drugName,
                dosage: r.dosage,
                frequency: r.frequency,
                duration: r.duration ?? '',
              },
            ],
          }))
        );
        setLabs(
          lb.labs.map(l => ({
            id: l.id,
            date: new Date(l.collectedAt).toISOString().slice(0, 10),
            testName: l.testName,
            result: `${l.value}${l.unit ? ' ' + l.unit : ''}`,
            referenceRange: l.referenceRange ?? undefined,
            status: l.status,
          }))
        );
        setVaccinations(
          vx.vaccinations.map(v => ({
            id: v.id,
            vaccine: v.vaccineName,
            dose: `Dose ${v.doseNumber}`,
            date: new Date(v.administeredAt).toISOString().slice(0, 10),
            site: v.site ?? undefined,
            batchNumber: v.batch ?? undefined,
            nextDue: v.nextDueAt ? new Date(v.nextDueAt).toISOString().slice(0, 10) : undefined,
          }))
        );
      } catch {
        if (cancelled) return;
        const mp = mockPatients.find(p => p.id === id);
        if (!mp) return;
        setPatient(mp);
        setEncounters(
          mockEncounters
            .filter(e => e.patientId === id)
            .sort((a, b) => b.date.localeCompare(a.date))
        );
        setPrescriptions(
          mockPrescriptions
            .filter(r => r.patientId === id)
            .map(r => ({
              id: r.id,
              status: r.status,
              date: r.date,
              doctorName: r.doctorName,
              medications: r.medications,
            }))
        );
        setLabs(
          mockLabs
            .filter(l => l.patientId === id)
            .map(l => ({
              id: l.id,
              date: l.date,
              testName: l.testName,
              result: l.result,
              referenceRange: l.referenceRange,
              status: l.status,
              labName: l.labName,
            }))
        );
        setVaccinations(
          mockVax
            .filter(v => v.patientId === id)
            .map(v => ({
              id: v.id,
              vaccine: v.vaccine,
              dose: v.dose,
              date: v.date,
              site: v.site,
              batchNumber: v.batchNumber,
              nextDue: v.nextDue,
            }))
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading)
    return <div className="text-center py-12 text-muted-foreground">Loading patient…</div>;
  if (!patient)
    return <div className="text-center py-12 text-muted-foreground">Patient not found</div>;

  const tabs: {
    key: Tab;
    label: string;
    icon: ComponentType<{ className?: string }>;
    count: number;
  }[] = [
    { key: 'timeline', label: 'Timeline', icon: Clock, count: encounters.length },
    { key: 'prescriptions', label: 'Prescriptions', icon: Pill, count: prescriptions.length },
    { key: 'labs', label: 'Lab results', icon: FlaskConical, count: labs.length },
    { key: 'vaccinations', label: 'Vaccinations', icon: Syringe, count: vaccinations.length },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <Link
        to="/patients"
        className="flex items-center gap-1 text-primary text-[13px] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to patients
      </Link>

      <div className="bg-card rounded-xl border border-border p-5 flex flex-col sm:flex-row gap-5">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-white text-[20px] shrink-0">
            {patient.firstName[0]}
            {patient.lastName[0]}
          </div>
          <div>
            <h1 className="text-[22px] font-semibold text-foreground">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-[13px] text-muted-foreground">
              {patient.id}, {patient.nationalId}
              {patient.gender ? `, ${patient.gender === 'M' ? 'Male' : 'Female'}` : ''}, DOB:{' '}
              {patient.dob}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {patient.bloodType && (
                <span className="text-[12px] bg-muted text-foreground border border-border px-2 py-0.5 rounded">
                  {patient.bloodType}
                </span>
              )}
              {patient.insuranceScheme && (
                <span className="text-[12px] bg-muted text-foreground border border-border px-2 py-0.5 rounded">
                  {patient.insuranceScheme}
                </span>
              )}
              {patient.allergies.map(a => (
                <span
                  key={a}
                  className="text-[12px] bg-red-100 text-red-700 px-2 py-0.5 rounded flex items-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3" />
                  {a}
                </span>
              ))}
              {registry && (
                <span
                  className={`text-[12px] px-2 py-0.5 rounded flex items-center gap-1 ${registry.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                >
                  <BadgeCheck className="w-3 h-3" />
                  {registry.verified
                    ? `Registry verified${registry.matchedName ? `, ${registry.matchedName}` : ''}`
                    : `Registry: ${registry.status.replace('_', ' ')}`}
                </span>
              )}
              {insurance && (
                <span
                  className={`text-[12px] px-2 py-0.5 rounded flex items-center gap-1 ${insurance.eligible ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {insurance.scheme}, {insurance.status}
                  {insurance.validThrough ? `, valid thru ${insurance.validThrough}` : ''}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={handleVerifyRegistry}
                disabled={verifyingRegistry}
                className="text-[12px] px-2.5 py-1 rounded-lg border border-border hover:bg-muted disabled:opacity-60 flex items-center gap-1"
              >
                {verifyingRegistry ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <BadgeCheck className="w-3 h-3" />
                )}
                Verify with registry
              </button>
              <button
                onClick={handleCheckInsurance}
                disabled={verifyingInsurance}
                className="text-[12px] px-2.5 py-1 rounded-lg border border-border hover:bg-muted disabled:opacity-60 flex items-center gap-1"
              >
                {verifyingInsurance ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3 h-3" />
                )}
                Check insurance eligibility
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-card p-2 rounded-lg border border-border">
            <QRCodeSVG value={patient.id} size={72} />
          </div>
          <Link
            to="/ai-assistant"
            className="af-focus flex items-center gap-2 px-3 py-2 bg-card border border-border text-foreground rounded-md hover:bg-muted text-[13px]"
          >
            <Bot className="w-4 h-4" aria-hidden /> AI summary
          </Link>
        </div>
      </div>

      <div className="flex gap-1 bg-muted p-1 rounded-lg overflow-x-auto">
        {tabs.map(tb => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`af-tap af-focus inline-flex items-center gap-2 px-4 py-2 rounded-md text-[13px] transition-colors whitespace-nowrap ${tab === tb.key ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <tb.icon className="w-4 h-4" /> {tb.label}{' '}
            <span className="text-[12px] bg-border px-1.5 py-0.5 rounded">{tb.count}</span>
          </button>
        ))}
      </div>

      {tab === 'timeline' && (
        <div className="relative pl-6">
          <div className="absolute left-2.5 top-0 bottom-0 w-px bg-accent" />
          <div className="space-y-4">
            {encounters.map(enc => (
              <div key={enc.id} className="relative">
                <div className="absolute -left-[14px] top-4 w-3 h-3 rounded-full border-2 border-card bg-primary" />
                <div className="bg-card rounded-xl border border-border p-4 ml-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[12px] px-2 py-0.5 rounded ${enc.type === 'emergency' ? 'bg-red-100 text-red-700' : enc.type === 'lab' ? 'bg-blue-100 text-blue-700' : enc.type === 'vaccination' ? 'bg-green-100 text-green-700' : 'bg-accent text-primary'}`}
                      >
                        {enc.type}
                      </span>
                      <span className="text-[13px] text-muted-foreground">{enc.date}</span>
                    </div>
                    <span className="text-[12px] text-muted-foreground">{enc.facilityName}</span>
                  </div>
                  <h3 className="text-[15px]">{enc.diagnosis}</h3>
                  <p className="text-[13px] text-muted-foreground mt-1">{enc.notes}</p>
                  <p className="text-[12px] text-muted-foreground mt-2">{enc.doctorName}</p>
                  {enc.vitals && (
                    <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
                      {Object.entries(enc.vitals).map(([k, v]) => (
                        <span key={k} className="text-[12px] bg-muted px-2 py-1 rounded">
                          <strong className="uppercase">{k}:</strong> {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {encounters.length === 0 && (
              <p className="text-[13px] text-muted-foreground">No encounters recorded.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'prescriptions' && (
        <div className="space-y-4">
          {prescriptions.map(rx => (
            <div key={rx.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span
                    className={`text-[12px] px-2 py-0.5 rounded ${rx.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}
                  >
                    {rx.status}
                  </span>
                  <span className="text-[12px] text-muted-foreground ml-2">
                    {rx.date}, {rx.doctorName}
                  </span>
                </div>
                <span className="text-[12px] text-muted-foreground">{rx.id}</span>
              </div>
              <div className="space-y-2">
                {rx.medications.map((med, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 bg-muted rounded-lg">
                    <Pill className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-[14px]">
                        {med.name} {med.dosage}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {med.frequency}
                        {med.duration ? `, ${med.duration}` : ''}
                      </p>
                      {med.interactions?.map(int => (
                        <p
                          key={int}
                          className="text-[12px] text-amber-800 mt-1 flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3 h-3" /> {int}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {prescriptions.length === 0 && (
            <p className="text-[13px] text-muted-foreground">No prescriptions recorded.</p>
          )}
        </div>
      )}

      {tab === 'labs' && (
        <ResponsiveTable
          columns={
            [
              { key: 'date', header: 'Date', cell: l => l.date },
              { key: 'test', header: 'Test', cell: l => l.testName },
              { key: 'result', header: 'Result', cell: l => l.result },
              {
                key: 'ref',
                header: 'Reference',
                cell: l => l.referenceRange ?? '—',
                hideOnMobile: true,
              },
              {
                key: 'status',
                header: 'Status',
                cell: l => (
                  <span
                    className={`text-[12px] px-2 py-0.5 rounded ${l.status === 'critical' ? 'bg-red-100 text-red-700' : l.status === 'abnormal' || l.status === 'high' || l.status === 'low' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700'}`}
                  >
                    {l.status}
                  </span>
                ),
              },
              { key: 'lab', header: 'Lab', cell: l => l.labName ?? '—', hideOnMobile: true },
            ] as TableColumn<DisplayLab>[]
          }
          rows={labs}
          rowKey={l => l.id}
          emptyLabel="No lab results"
          mobileTitle={l => l.testName}
          mobileSubtitle={l => `${l.date}, ${l.result}`}
        />
      )}

      {tab === 'vaccinations' && (
        <div className="space-y-3">
          {vaccinations.map(v => (
            <div
              key={v.id}
              className="bg-card rounded-xl border border-border p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Syringe className="w-5 h-5 text-green-700" />
              </div>
              <div className="flex-1">
                <p className="text-[14px]">
                  {v.vaccine} — {v.dose}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {v.date}
                  {v.site ? `, ${v.site}` : ''}
                  {v.batchNumber ? `, Batch: ${v.batchNumber}` : ''}
                </p>
              </div>
              {v.nextDue && (
                <span
                  className={`text-[12px] px-2 py-1 rounded ${new Date(v.nextDue) < new Date() ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}
                >
                  {new Date(v.nextDue) < new Date() ? 'OVERDUE' : `Next: ${v.nextDue}`}
                </span>
              )}
            </div>
          ))}
          {vaccinations.length === 0 && (
            <p className="text-[13px] text-muted-foreground">No vaccinations recorded.</p>
          )}
        </div>
      )}
    </div>
  );
}
