import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadPrefs, PREFS_STORAGE_KEY, savePrefs } from './AppContext';
import { createMemoryStorage } from '../../test/helpers';

beforeEach(() => {
  vi.stubGlobal('window', { localStorage: createMemoryStorage() });
});

describe('AppContext preference persistence', () => {
  it('returns empty object when nothing is stored', () => {
    expect(loadPrefs()).toEqual({});
  });

  it('round-trips lang and currentPatientId through localStorage', () => {
    savePrefs({ lang: 'fr', currentPatientId: 'PAT-042' });
    expect(loadPrefs()).toEqual({ lang: 'fr', currentPatientId: 'PAT-042' });
  });

  it('uses the versioned storage key', () => {
    savePrefs({ lang: 'ar' });
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toEqual({ lang: 'ar' });
  });

  it('ignores unknown languages when loading', () => {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify({ lang: 'xx', currentPatientId: 'PAT-1' }));
    expect(loadPrefs()).toEqual({ currentPatientId: 'PAT-1' });
  });

  it('returns empty object for malformed JSON', () => {
    window.localStorage.setItem(PREFS_STORAGE_KEY, '{not json');
    expect(loadPrefs()).toEqual({});
  });

  it('returns empty object when stored JSON is not a non-null object', () => {
    for (const val of ['null', '123', '"string"', 'true', '[]']) {
      window.localStorage.setItem(PREFS_STORAGE_KEY, val);
      expect(loadPrefs()).toEqual({});
    }
  });

  it('accepts all five supported languages', () => {
    for (const lang of ['en', 'fr', 'ar', 'sw', 'ha'] as const) {
      savePrefs({ lang });
      expect(loadPrefs().lang).toBe(lang);
    }
  });
});
