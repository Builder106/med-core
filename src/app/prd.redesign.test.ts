// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

describe('PRD-aligned surfaces', () => {
  it('exposes low-bandwidth, offline sync, and language controls in the app shell', () => {
    const layout = readProjectFile('src/app/components/Layout.tsx');
    const i18nSetup = readProjectFile('src/app/i18n.ts');
    const enResources = readProjectFile('src/locales/en/translation.json');
    expect(layout).toContain("t('common.lowBandwidth')");
    expect(layout).toContain("t('common.offlineSync')");
    expect(layout).toContain('SUPPORTED_LANGUAGES');
    expect(i18nSetup).toContain('Swahili');
    expect(i18nSetup).toContain('العربية');
    expect(i18nSetup).toContain('Hausa');
    expect(enResources).toContain('"lowBandwidth"');
  });

  it('organises the doctor dashboard around the queue, timeline, follow-ups, and referrals', () => {
    const doctorDashboard = readProjectFile('src/app/pages/dashboards/DoctorDashboard.tsx');
    expect(doctorDashboard).toContain('Appointment queue');
    expect(doctorDashboard).toContain('Unified timeline');
    expect(doctorDashboard).toContain('Needs follow-up');
    expect(doctorDashboard).toContain('Referral tracker');
  });

  it('counts only real follow-ups on the doctor dashboard', () => {
    const doctorDashboard = readProjectFile('src/app/pages/dashboards/DoctorDashboard.tsx');
    expect(doctorDashboard).toContain('.filter(item => item.count > 0)');
    expect(doctorDashboard).toContain("refs.filter(r => r.status === 'pending')");
    expect(doctorDashboard).not.toContain('Wanjiku');
  });

  it('shows the patient their Health ID, consent, and offline access channels', () => {
    const patientDashboard = readProjectFile('src/app/pages/dashboards/PatientDashboard.tsx');
    expect(patientDashboard).toContain('Your Health ID');
    expect(patientDashboard).toContain('Who can see your record');
    expect(patientDashboard).toContain('Ways to reach MedCore');
    expect(patientDashboard).toContain('*123#');
  });

  it('gives the admin dashboard facility load, stock, and ministry reporting', () => {
    const adminDashboard = readProjectFile('src/app/pages/dashboards/AdminDashboard.tsx');
    expect(adminDashboard).toContain('Bed occupancy');
    expect(adminDashboard).toContain('Low stock');
    expect(adminDashboard).toContain('Ministry reports');
  });

  it('keeps press and focus feedback with a reduced-motion fallback', () => {
    const themeCss = readProjectFile('src/styles/theme.css');
    const layout = readProjectFile('src/app/components/Layout.tsx');
    expect(themeCss).toContain('.af-press');
    expect(themeCss).toContain('.af-focus');
    expect(themeCss).toContain('prefers-reduced-motion');
    expect(layout).toContain('af-press');
  });
});
