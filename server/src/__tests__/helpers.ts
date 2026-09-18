import { vi } from 'vitest';

export function mockFetchJson(body: unknown, init: ResponseInit = {}): typeof fetch {
  return vi.fn(async () => new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  }));
}
