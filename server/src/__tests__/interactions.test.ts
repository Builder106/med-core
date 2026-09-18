import { describe, expect, it, vi } from 'vitest';
import {
  checkInteractionViaOpenFDA,
  lookupFallback,
  resolveInteraction,
} from '../lib/interactions.js';
import { mockFetchJson } from './helpers.js';

describe('interactions lib', () => {
  it('looks up fallback interactions both forward and reversed', () => {
    const res1 = lookupFallback('Metformin', 'Ibuprofen');
    expect(res1.level).toBe('warning');
    expect(res1.source).toBe('fallback');

    const res2 = lookupFallback('Ibuprofen', 'Metformin');
    expect(res2.level).toBe('warning');
    expect(res2.source).toBe('fallback');

    const res3 = lookupFallback('Warfarin', 'Aspirin');
    expect(res3.level).toBe('critical');

    const resNone = lookupFallback('Amoxicillin', 'Paracetamol');
    expect(resNone.level).toBe('none');
    expect(resNone.source).toBe('none');
  });

  it('checks interactions via OpenFDA with different severity levels', async () => {
    // Critical match
    const mockFetchCritical = mockFetchJson({ results: [{ drug_interactions: ['Severe contraindicated reaction leading to fatal risk.'] }] });

    const resCrit = await checkInteractionViaOpenFDA(
      'DrugA',
      'DrugB',
      mockFetchCritical
    );
    expect(resCrit?.level).toBe('critical');
    expect(resCrit?.source).toBe('openfda');

    // Warning match
    const mockFetchWarning = mockFetchJson({ results: [{ drug_interactions: ['Monitor patient closely for increased risk.'] }] });

    const resWarn = await checkInteractionViaOpenFDA(
      'DrugA',
      'DrugB',
      mockFetchWarning
    );
    expect(resWarn?.level).toBe('warning');

    // Info match (default when no critical/warning keywords match)
    const mockFetchInfo = mockFetchJson({ results: [{ drug_interactions: ['Concurrent administration studied in pharmacokinetic trials.'] }] });

    const resInfo = await checkInteractionViaOpenFDA(
      'DrugA',
      'DrugB',
      mockFetchInfo
    );
    expect(resInfo?.level).toBe('info');

    // Missing or empty drug_interactions in results
    const mockFetchUndefinedInteractions = mockFetchJson({ results: [{}] });
    expect(
      await checkInteractionViaOpenFDA(
        'DrugA',
        'DrugB',
        mockFetchUndefinedInteractions
      )
    ).toBeNull();

    // Empty results array
    const mockFetchEmptyResults = mockFetchJson({ results: [] });
    expect(
      await checkInteractionViaOpenFDA(
        'DrugA',
        'DrugB',
        mockFetchEmptyResults
      )
    ).toBeNull();

    // Missing results property
    const mockFetchNoResults = mockFetchJson({});
    expect(
      await checkInteractionViaOpenFDA(
        'DrugA',
        'DrugB',
        mockFetchNoResults
      )
    ).toBeNull();

    // HTTP error response
    const mockFetchError = mockFetchJson(null, { status: 500 });
    expect(
      await checkInteractionViaOpenFDA('DrugA', 'DrugB', mockFetchError)
    ).toBeNull();

    // Exception thrown by fetch
    const mockFetchThrows: typeof fetch = async () => { throw new Error('Network offline'); };
    expect(
      await checkInteractionViaOpenFDA('DrugA', 'DrugB', mockFetchThrows)
    ).toBeNull();
  });

  it('resolves interactions with priority on fallback before remote API', async () => {
    const fallbackRes = await resolveInteraction('Warfarin', 'Aspirin');
    expect(fallbackRes.level).toBe('critical');
    expect(fallbackRes.source).toBe('fallback');

    // Non-fallback drug with FDA mock returns remote interaction
    const origFetch = globalThis.fetch;
    try {
      globalThis.fetch = mockFetchJson({ results: [{ drug_interactions: ['Avoid coadministration due to toxicity.'] }] });

      const remoteRes = await resolveInteraction('DrugAlpha', 'DrugBeta');
      expect(remoteRes.level).toBe('warning');
      expect(remoteRes.source).toBe('openfda');
    } finally {
      globalThis.fetch = origFetch;
    }

    // Non-fallback drug with no FDA response returns none
    const unknownRes = await resolveInteraction('NonExistentDrugX', 'NonExistentDrugY');
    expect(unknownRes.level).toBe('none');
  });
});
