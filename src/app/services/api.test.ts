import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportFhirBundle } from './api';

describe('exportFhirBundle', () => {
  afterEach(() => vi.restoreAllMocks());

  it('serializes a successful FHIR bundle response', async () => {
    const bundle = {
      resourceType: 'Bundle',
      id: 'bundle-1',
      type: 'collection',
      timestamp: '2026-09-14T12:00:00.000Z',
      total: 1,
      entry: [
        {
          fullUrl: 'urn:uuid:patient-1',
          resource: {
            resourceType: 'Patient',
            id: 'patient-1',
            name: [{ text: 'Example' }],
          },
        },
      ],
    };
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(bundle), { status: 200 }));

    await expect(exportFhirBundle('patient/1')).resolves.toBe(JSON.stringify(bundle, null, 2));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/fhir/Patient/patient%2F1/$everything',
      expect.objectContaining({ credentials: 'include' })
    );
  });
});
