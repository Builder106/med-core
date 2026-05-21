CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  pin_hash TEXT,
  pin_rotated_at INTEGER,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob TEXT NOT NULL,
  phone TEXT NOT NULL,
  national_id TEXT NOT NULL,
  blood_type TEXT,
  allergies TEXT NOT NULL DEFAULT '[]',
  insurance_scheme TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  drug_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS medication_reminders (
  id TEXT PRIMARY KEY,
  prescription_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  scheduled_time INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  response TEXT,
  channel TEXT NOT NULL DEFAULT 'sms',
  created_at INTEGER NOT NULL,
  responded_at INTEGER
);

CREATE TABLE IF NOT EXISTS adherence_events (
  id TEXT PRIMARY KEY,
  prescription_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  dose_date TEXT NOT NULL,
  status TEXT NOT NULL,
  recorded_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sms_messages (
  id TEXT PRIMARY KEY,
  direction TEXT NOT NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT NOT NULL,
  command TEXT,
  patient_id TEXT,
  doctor_id TEXT,
  response_snippet TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  expires_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS interaction_events (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  drug_a TEXT NOT NULL,
  drug_b TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'fallback',
  overridden INTEGER NOT NULL DEFAULT 0,
  override_reason TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS voice_recordings (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT,
  source TEXT NOT NULL,
  audio_path TEXT,
  audio_mime TEXT,
  duration_sec REAL,
  transcript TEXT NOT NULL DEFAULT '',
  audio_expires_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS consultation_notes (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  recording_id TEXT,
  chief_complaint TEXT NOT NULL DEFAULT '',
  history TEXT NOT NULL DEFAULT '',
  assessment TEXT NOT NULL DEFAULT '',
  plan TEXT NOT NULL DEFAULT '',
  follow_up TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS video_consultations (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  room_url TEXT NOT NULL,
  room_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  started_at INTEGER,
  ended_at INTEGER,
  duration_sec REAL,
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  facility_id TEXT,
  scheduled_for INTEGER NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 20,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS lab_results (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT,
  test_name TEXT NOT NULL,
  value TEXT NOT NULL,
  unit TEXT,
  reference_range TEXT,
  status TEXT NOT NULL DEFAULT 'normal',
  collected_at INTEGER NOT NULL,
  reviewed_by_doctor INTEGER NOT NULL DEFAULT 0,
  plain_english TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS vaccinations (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  vaccine_name TEXT NOT NULL,
  dose_number INTEGER NOT NULL DEFAULT 1,
  batch TEXT,
  site TEXT,
  administered_at INTEGER NOT NULL,
  next_due_at INTEGER,
  administered_by TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  from_doctor_id TEXT NOT NULL,
  to_doctor_id TEXT,
  to_facility TEXT,
  specialty TEXT,
  urgency TEXT NOT NULL DEFAULT 'routine',
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  responded_at INTEGER
);

CREATE TABLE IF NOT EXISTS consent_grants (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  granted_to TEXT NOT NULL,
  granted_to_type TEXT NOT NULL DEFAULT 'doctor',
  sections TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  granted_at INTEGER NOT NULL,
  revoked_at INTEGER,
  expires_at INTEGER
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  role TEXT,
  patient_id TEXT,
  action TEXT NOT NULL,
  path TEXT NOT NULL,
  method TEXT NOT NULL,
  status INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  ip TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  specialty TEXT,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  facility_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  item_name TEXT NOT NULL,
  category TEXT,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  unit TEXT DEFAULT 'each',
  location TEXT,
  expires_at INTEGER,
  updated_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS encounters (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  encounter_date INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'consultation',
  chief_complaint TEXT,
  diagnosis TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_patient ON medication_reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON medication_reminders(status);
CREATE INDEX IF NOT EXISTS idx_adherence_patient ON adherence_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_sms_doctor ON sms_messages(doctor_id);
CREATE INDEX IF NOT EXISTS idx_interaction_patient ON interaction_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_voice_patient ON voice_recordings(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_labs_patient ON lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_patient ON vaccinations(patient_id);
CREATE INDEX IF NOT EXISTS idx_referrals_patient ON referrals(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_patient ON consent_grants(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_patient ON audit_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_encounters_patient ON encounters(patient_id);
