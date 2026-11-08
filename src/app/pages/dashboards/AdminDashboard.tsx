import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  dailyStats as mockDailyStats,
  facilities as mockFacilities,
  inventory as mockInventory,
} from '../../data/mock-data';
import {
  getDailyStats,
  listFacilities,
  listInventory,
  type DailyStats,
  type Facility,
  type InventoryItem,
} from '../../services/api';

const CHART = { bar: '#214838', track: '#e3e6e4', alert: '#a63d32' };

interface LowStockItem {
  id: string;
  name: string;
  quantity: number;
  reorderLevel: number;
  unit: string;
  linkedPrescriptions: number;
}

export function AdminDashboard() {
  const [facility, setFacility] = useState<Facility>(mockFacilities[0]);
  const [stats, setStats] = useState<DailyStats>(mockDailyStats);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);

  const occupancy = Math.round((facility.bedsOccupied / facility.beds) * 100);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [inv, daily, facs] = await Promise.all([
          listInventory(),
          getDailyStats(),
          listFacilities(),
        ]);
        if (cancelled) return;
        const ls = inv.items
          .filter((i: InventoryItem) => i.quantity <= i.reorderLevel)
          .map((i: InventoryItem) => ({
            id: i.id,
            name: i.itemName,
            quantity: i.quantity,
            reorderLevel: i.reorderLevel,
            unit: i.unit ?? 'each',
            linkedPrescriptions: 0,
          }));
        setLowStock(ls);
        setStats(daily);
        if (facs.facilities.length > 0) setFacility(facs.facilities[0]);
      } catch {
        if (cancelled) return;
        const ls = mockInventory
          .filter(i => i.quantity <= i.reorderLevel)
          .map(i => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            reorderLevel: i.reorderLevel,
            unit: i.unit,
            linkedPrescriptions: i.linkedPrescriptions,
          }));
        setLowStock(ls);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tiles = [
    { label: 'Patients today', value: stats.patientsToday, alert: false },
    { label: 'Appointments today', value: stats.appointmentsToday, alert: false },
    { label: 'Emergencies today', value: stats.emergencies, alert: stats.emergencies > 0 },
    { label: 'Admissions today', value: stats.admissions, alert: false },
    { label: 'Discharges today', value: stats.discharges, alert: false },
  ];
  const maxDiagnosis = stats.topDiagnoses[0]?.count ?? 1;
  const hasWeeklyVisits = stats.weeklyTrend.some(day => day.patients > 0);

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold text-foreground">{facility.name}</h2>
          <p className="text-[14px] text-muted-foreground">
            {facility.location}, {facility.level}
          </p>
        </div>
        <Link
          to="/reports"
          className="af-press af-focus inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-strong text-[14px]"
        >
          Ministry reports <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {tiles.map(tile => (
          <div key={tile.label} className="bg-card rounded-lg border border-border px-4 py-3">
            <dt className="text-[13px] text-muted-foreground">{tile.label}</dt>
            <dd
              className={`text-[24px] font-semibold leading-tight ${tile.alert ? 'text-destructive' : 'text-foreground'}`}
            >
              {tile.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 bg-card rounded-lg border border-border p-5">
          <h2 className="text-[15px] font-semibold text-foreground mb-4">
            Patients per day this week
          </h2>
          {hasWeeklyVisits ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.weeklyTrend}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip trigger="click" wrapperStyle={{ pointerEvents: 'auto' }} />
                <Bar dataKey="patients" fill={CHART.bar} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[14px] text-muted-foreground">No visits recorded this week.</p>
          )}
        </section>

        <section className="bg-card rounded-lg border border-border p-5">
          <h2 className="text-[15px] font-semibold text-foreground mb-4">Bed occupancy</h2>
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90" aria-hidden>
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke={CHART.track}
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke={occupancy > 90 ? CHART.alert : CHART.bar}
                  strokeWidth="3"
                  strokeDasharray={`${occupancy} ${100 - occupancy}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[22px] font-semibold text-foreground">{occupancy}%</span>
                <span className="text-[12px] text-muted-foreground">occupied</span>
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-4 mt-4 w-full text-center">
              <div>
                <dd className="text-[16px] font-medium text-foreground">{facility.beds}</dd>
                <dt className="text-[13px] text-muted-foreground">Beds</dt>
              </div>
              <div>
                <dd className="text-[16px] font-medium text-foreground">{facility.bedsOccupied}</dd>
                <dt className="text-[13px] text-muted-foreground">In use</dt>
              </div>
              <div>
                <dd className="text-[16px] font-medium text-foreground">
                  {facility.beds - facility.bedsOccupied}
                </dd>
                <dt className="text-[13px] text-muted-foreground">Free</dt>
              </div>
            </dl>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-card rounded-lg border border-border p-5">
          <h2 className="text-[15px] font-semibold text-foreground mb-4">Top diagnoses</h2>
          {stats.topDiagnoses.length === 0 ? (
            <p className="text-[14px] text-muted-foreground">No diagnoses recorded today.</p>
          ) : (
            <ol className="space-y-3">
              {stats.topDiagnoses.slice(0, 6).map(d => (
                <li key={d.name}>
                  <div className="flex items-center justify-between mb-1 text-[13px]">
                    <span className="text-foreground">{d.name}</span>
                    <span className="text-muted-foreground tabular-nums">{d.count}</span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: CHART.track }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(d.count / maxDiagnosis) * 100}%`,
                        backgroundColor: CHART.bar,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-foreground">Low stock</h2>
            <Link
              to="/inventory"
              className="af-focus text-primary text-[13px] inline-flex items-center gap-1 hover:underline"
            >
              Inventory <ArrowRight className="w-3.5 h-3.5" aria-hidden />
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-[14px] text-muted-foreground">
              All items are above their reorder level.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {lowStock.map(item => (
                <li key={item.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-foreground">{item.name}</p>
                    {item.linkedPrescriptions > 0 && (
                      <p className="text-[13px] text-muted-foreground">
                        {item.linkedPrescriptions} active prescriptions use this
                      </p>
                    )}
                  </div>
                  <p className="text-[14px] text-right shrink-0">
                    <span className="font-semibold text-destructive">{item.quantity}</span>
                    <span className="text-muted-foreground">
                      {' '}
                      of {item.reorderLevel} {item.unit} reorder level
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
