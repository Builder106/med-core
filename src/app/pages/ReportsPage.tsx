import { Download, Printer } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dailyStats, facilities } from '../data/mock-data';
import { downloadCsv } from '../lib/csv';

function exportReport() {
  downloadCsv('ministry-report', [
    ['Section', 'Name', 'Value'],
    ...dailyStats.topDiagnoses.map(d => ['Top diagnoses', d.name, d.count]),
    ...facilities.map(f => [
      'Bed occupancy',
      f.name,
      `${Math.round((f.bedsOccupied / f.beds) * 100)}%`,
    ]),
  ]);
}

export function ReportsPage() {
  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-muted-foreground">
          Daily figures for the Ministry of Health submission.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportReport}
            className="af-press af-focus flex items-center gap-2 px-3 py-2 bg-card border border-border text-foreground rounded-md hover:bg-muted text-[14px]"
          >
            <Download className="w-4 h-4" aria-hidden /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="af-press af-focus flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-strong text-[14px]"
          >
            <Printer className="w-4 h-4" aria-hidden /> Print or save as PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-card rounded-lg border border-border p-5">
          <h2 className="text-[15px] font-semibold text-foreground mb-4">Top diagnoses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyStats.topDiagnoses} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={110} />
              <Tooltip trigger="click" wrapperStyle={{ pointerEvents: 'auto' }} />
              <Bar dataKey="count" fill="#214838" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="bg-card rounded-lg border border-border p-5">
          <h2 className="text-[15px] font-semibold text-foreground mb-4">
            Bed occupancy by facility
          </h2>
          <ul className="divide-y divide-border">
            {facilities.map(f => {
              const occ = Math.round((f.bedsOccupied / f.beds) * 100);
              return (
                <li key={f.id} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[14px] text-foreground">{f.name}</p>
                    <span
                      className={`text-[13px] tabular-nums ${occ > 90 ? 'font-semibold text-destructive' : 'text-foreground'}`}
                    >
                      {occ}% occupied
                    </span>
                  </div>
                  <p className="text-[13px] text-muted-foreground">
                    {f.location}, {f.level}
                  </p>
                  <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${occ > 90 ? 'bg-destructive' : 'bg-primary'}`}
                      style={{ width: `${occ}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
