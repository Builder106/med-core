import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadCsv, toCsv } from './csv';

describe('toCsv', () => {
  it('joins plain values with commas and rows with newlines', () => {
    expect(
      toCsv([
        ['a', 1],
        ['b', 2],
      ])
    ).toBe('a,1\nb,2');
  });

  it('quotes values that contain commas, quotes or newlines', () => {
    expect(toCsv([['Ward 3, east', 'say "hi"', 'two\nlines']])).toBe(
      '"Ward 3, east","say ""hi""","two\nlines"'
    );
  });
});

describe('downloadCsv', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads a dated CSV file and releases the object URL', () => {
    const createObjectURL = vi.fn(() => 'blob:report');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const downloads: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      downloads.push(this.download);
    });

    downloadCsv('audit-log', [['a', 1]]);

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledTimes(1);
    expect(downloads[0]).toMatch(/^audit-log-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:report');
  });
});
