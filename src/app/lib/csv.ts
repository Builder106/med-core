export type CsvValue = string | number;

export function toCsv(rows: CsvValue[][]): string {
  return rows
    .map(row =>
      row
        .map(value => {
          const text = String(value);
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(',')
    )
    .join('\n');
}

export function downloadCsv(filenamePrefix: string, rows: CsvValue[][]): void {
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
