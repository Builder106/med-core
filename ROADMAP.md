# MedCore Roadmap

High-level feature roadmap and technical milestones for MedCore.

MedCore is a centralised digital health records platform tailored for African healthcare systems, pairing FHIR R4 clinical data models with doctor-first clinical intelligence, patient self-service, offline resilience, and strict cryptographic safeguards.

---

## v1.1 — Core Clinical Workflows & Interoperability

- **Workflow Forms & Actions**: Re-introduce essential actions stripped during the UI cleanup with complete form validation and API persistence:
  - *Patient Registration*: Demographics intake, national/facility ID assignment, and Health ID card generation.
  - *Appointment Booking*: Scheduling modal with doctor availability, specialty routing, and visit classification.
  - *Referral Routing*: Provider-to-specialist referrals with clinical notes, status tracking, and triage priority.
  - *Staff Onboarding*: Role-based access provisioning (Doctor, Nurse, Pharmacist, Lab Tech, Admin).
  - *Health ID Scanner*: Camera-based QR scanning to quickly pull verified patient charts.
- **Healthcare Record Parser & Normalization**: Normalization pipeline converting incoming clinical records and synthetic datasets into standardized FHIR R4 resources (`Patient`, `Encounter`, `Condition`, `Observation`, `MedicationRequest`).
- **Data Privacy & De-Identification**: Deterministic HIPAA- and regional privacy-compliant anonymization pipeline for aggregated reporting and research exports.

## v1.2 — Clinical Intelligence & Risk Stratification

- **Dynamic Risk Stratification Engine**: Rule-based and statistical clinical health index calculations (e.g., cardiovascular risk score, diabetic progression, maternal triage) replacing static flags with real observation-derived metrics.
- **Medical Ontology & Validation Harness**: Validation test suites mapping observations and diagnoses against standardized ontologies (ICD-10, SNOMED-CT, LOINC).
- **Ambient Voice Scribing**: Real-time consultation transcription and structured SOAP-note draft generation via Groq and Gemini fallbacks.

## v1.3 — Offline-First Architecture & Sync

- **Service Worker & SQLite Sync**: Local IndexedDB / SQLite caching for low-connectivity clinics with conflict-free replicated data types (CRDTs) or timestamp-ordered resolution upon reconnect.
- **Offline Health ID Verification**: Local cryptographic verification of patient QR tokens without requiring live server access.
- **SMS & USSD Micro-Services**: Twilio and Africa's Talking integrations for SMS appointment reminders and USSD health records lookup for non-smartphone patients.

## v1.4 — Regional Interoperability & Telehealth

- **National Registry & Insurance Adapters**: Integration connectors for national health databases (NHIF, SHA) and regional health information exchanges (HIEs).
- **WebRTC Teleconsultations**: In-app encrypted video/audio consultations with live clinical chart side-by-side view.
- **Inventory & Supply Chain Forecasting**: Predictive medication stockout alerts based on seasonal prescription trends and consumption rates.

---

## Out of Scope

- Direct autonomous clinical diagnosis or treatment prescription without licensed physician sign-off.
- Unencrypted storage of Protected Health Information (PHI) at rest or in transit.
- Commercial advertising, patient data monetization, or third-party behavioral tracking.

---
For technical specifications, see [`docs/`](docs/).
