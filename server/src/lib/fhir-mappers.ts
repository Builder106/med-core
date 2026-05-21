// Maps MedCore DB rows to FHIR R4 resource objects (read-only export).

export interface FhirResource { resourceType: string; id: string; [key: string]: unknown }

export interface FhirBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'collection';
  timestamp: string;
  total: number;
  entry: { fullUrl: string; resource: FhirResource }[];
}

type PatientRow = {
  id: string; firstName: string; lastName: string; dob: string;
  phone: string; nationalId: string; bloodType: string | null;
  allergies: string; createdAt: number;
};
type PrescriptionRow = {
  id: string; patientId: string; drugName: string; dosage: string;
  frequency: string; duration: string | null; status: string; notes: string | null; createdAt: number;
};
type LabRow = {
  id: string; patientId: string; testName: string; value: string;
  unit: string | null; referenceRange: string | null; status: string;
  collectedAt: number; reviewedByDoctor: number;
};
type VaxRow = {
  id: string; patientId: string; vaccineName: string; doseNumber: number;
  batch: string | null; site: string | null; administeredAt: number; administeredBy: string | null;
};
type EncounterRow = {
  id: string; patientId: string; encounterDate: number; type: string;
  chiefComplaint: string | null; diagnosis: string | null;
};

export function toFhirPatient(p: PatientRow): FhirResource {
  const allergies = (() => { try { return JSON.parse(p.allergies) as string[]; } catch { return []; } })();
  return {
    resourceType: 'Patient',
    id: p.id,
    meta: { lastUpdated: new Date(p.createdAt).toISOString() },
    identifier: [
      { system: 'urn:medcore:patient-id', value: p.id },
      { system: 'urn:medcore:national-id', value: p.nationalId },
    ],
    name: [{ use: 'official', family: p.lastName, given: [p.firstName] }],
    telecom: [{ system: 'phone', value: p.phone, use: 'mobile' }],
    birthDate: p.dob,
    ...(p.bloodType ? { extension: [{ url: 'urn:medcore:blood-type', valueString: p.bloodType }] } : {}),
    ...(allergies.length ? {
      allergyIntolerance: allergies.map((a, i) => ({
        resourceType: 'AllergyIntolerance',
        id: `allergy-${p.id}-${i}`,
        patient: { reference: `Patient/${p.id}` },
        code: { text: a },
        clinicalStatus: { coding: [{ code: 'active' }] },
      })),
    } : {}),
  };
}

export function toFhirMedicationRequest(rx: PrescriptionRow): FhirResource {
  const statusMap: Record<string, string> = { active: 'active', completed: 'completed', discontinued: 'stopped' };
  return {
    resourceType: 'MedicationRequest',
    id: rx.id,
    status: statusMap[rx.status] ?? 'unknown',
    intent: 'order',
    medicationCodeableConcept: { text: rx.drugName },
    subject: { reference: `Patient/${rx.patientId}` },
    authoredOn: new Date(rx.createdAt).toISOString().slice(0, 10),
    dosageInstruction: [{
      text: [rx.dosage, rx.frequency, rx.duration ? `for ${rx.duration}` : ''].filter(Boolean).join(' '),
    }],
    ...(rx.notes ? { note: [{ text: rx.notes }] } : {}),
  };
}

export function toFhirObservation(lab: LabRow): FhirResource {
  const interpCode: Record<string, string> = { high: 'H', low: 'L', critical: 'AA', normal: 'N' };
  return {
    resourceType: 'Observation',
    id: lab.id,
    status: lab.reviewedByDoctor ? 'final' : 'preliminary',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }] }],
    code: { text: lab.testName },
    subject: { reference: `Patient/${lab.patientId}` },
    effectiveDateTime: new Date(lab.collectedAt).toISOString(),
    valueString: lab.unit ? `${lab.value} ${lab.unit}` : lab.value,
    ...(lab.referenceRange ? { referenceRange: [{ text: lab.referenceRange }] } : {}),
    ...(lab.status !== 'normal' ? {
      interpretation: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: interpCode[lab.status] ?? 'U', display: lab.status }] }],
    } : {}),
  };
}

export function toFhirImmunization(vax: VaxRow): FhirResource {
  return {
    resourceType: 'Immunization',
    id: vax.id,
    status: 'completed',
    vaccineCode: { text: vax.vaccineName },
    patient: { reference: `Patient/${vax.patientId}` },
    occurrenceDateTime: new Date(vax.administeredAt).toISOString(),
    ...(vax.doseNumber > 1 ? { protocolApplied: [{ doseNumberPositiveInt: vax.doseNumber }] } : {}),
    ...(vax.batch ? { lotNumber: vax.batch } : {}),
    ...(vax.site ? { site: { text: vax.site } } : {}),
    ...(vax.administeredBy ? { performer: [{ actor: { display: vax.administeredBy } }] } : {}),
  };
}

export function toFhirEncounter(enc: EncounterRow): FhirResource {
  const classCode: Record<string, { code: string; display: string }> = {
    consultation: { code: 'AMB', display: 'ambulatory' },
    follow_up: { code: 'AMB', display: 'ambulatory' },
    emergency: { code: 'EMER', display: 'emergency' },
    telemedicine: { code: 'VR', display: 'virtual' },
  };
  const cls = classCode[enc.type] ?? { code: 'AMB', display: 'ambulatory' };
  return {
    resourceType: 'Encounter',
    id: enc.id,
    status: 'finished',
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', ...cls },
    type: [{ text: enc.type.replace('_', ' ') }],
    subject: { reference: `Patient/${enc.patientId}` },
    period: { start: new Date(enc.encounterDate).toISOString() },
    ...(enc.chiefComplaint ? { reasonCode: [{ text: enc.chiefComplaint }] } : {}),
    ...(enc.diagnosis ? { diagnosis: [{ condition: { display: enc.diagnosis } }] } : {}),
  };
}

export function toFhirBundle(patientId: string, resources: FhirResource[]): FhirBundle {
  return {
    resourceType: 'Bundle',
    id: `patient-${patientId}-everything`,
    type: 'collection',
    timestamp: new Date().toISOString(),
    total: resources.length,
    entry: resources.map(r => ({ fullUrl: `urn:uuid:${r.id}`, resource: r })),
  };
}
