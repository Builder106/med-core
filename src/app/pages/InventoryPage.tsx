import { AlertTriangle, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ResponsiveTable, type TableColumn } from '../components/ui/responsive-table';
import { inventory as mockInventory } from '../data/mock-data';
import { downloadCsv } from '../lib/csv';
import { listInventory, type InventoryItem } from '../services/api';

interface InvRow {
  id: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unit: string;
  linkedPrescriptions: number;
}

function apiToRow(i: InventoryItem): InvRow {
  return {
    id: i.id,
    name: i.itemName,
    category: i.category ?? 'Supply',
    quantity: i.quantity,
    reorderLevel: i.reorderLevel,
    unit: i.unit ?? 'each',
    linkedPrescriptions: 0,
  };
}

export function InventoryPage() {
  const [rows, setRows] = useState<InvRow[]>([]);
  const [apiOk, setApiOk] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await listInventory();
        if (cancelled) return;
        setRows(res.items.map(apiToRow));
        setApiOk(true);
      } catch {
        if (cancelled) return;
        setApiOk(false);
        setRows(
          mockInventory.map(i => ({
            id: i.id,
            name: i.name,
            category: i.category,
            quantity: i.quantity,
            reorderLevel: i.reorderLevel,
            unit: i.unit,
            linkedPrescriptions: i.linkedPrescriptions,
          }))
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = [...rows].sort(
    (a, b) => (a.quantity <= a.reorderLevel ? -1 : 1) - (b.quantity <= b.reorderLevel ? -1 : 1)
  );
  const lowStock = rows.filter(i => i.quantity <= i.reorderLevel).length;

  const columns: TableColumn<InvRow>[] = [
    { key: 'drug', header: 'Drug', cell: i => <span className="text-[14px]">{i.name}</span> },
    {
      key: 'cat',
      header: 'Category',
      cell: i => <span className="text-[12px] text-muted-foreground">{i.category}</span>,
    },
    {
      key: 'qty',
      header: 'Quantity',
      cell: i => (
        <span className="text-[14px]">
          {i.quantity} {i.unit}
        </span>
      ),
    },
    {
      key: 'reorder',
      header: 'Reorder level',
      cell: i => (
        <span className="text-[13px] text-muted-foreground">
          {i.reorderLevel} {i.unit}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      cell: i =>
        i.quantity <= i.reorderLevel ? (
          <span className="inline-flex items-center gap-1 text-[13px] font-medium text-red-800">
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden /> Reorder now
          </span>
        ) : (
          <span className="text-[13px] text-muted-foreground">In stock</span>
        ),
    },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-[22px] font-semibold text-foreground">Drug inventory</h1>
        <button
          type="button"
          disabled={rows.length === 0}
          onClick={() =>
            downloadCsv('inventory', [
              ['Item', 'Category', 'Quantity', 'Unit', 'Reorder level'],
              ...sorted.map(i => [i.name, i.category, i.quantity, i.unit, i.reorderLevel]),
            ])
          }
          className="af-tap af-press af-focus inline-flex items-center gap-2 px-3 py-2 bg-card border border-border text-foreground rounded-md hover:bg-muted text-[14px] disabled:opacity-50"
        >
          <Download className="w-4 h-4" aria-hidden /> Export CSV
        </button>
      </div>
      {!apiOk && (
        <div
          role="status"
          className="text-[13px] text-amber-950 bg-amber-50 border border-amber-300 rounded-md px-3 py-2"
        >
          The server is unreachable, so this page shows sample data.
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 max-w-md">
        <div className="bg-card rounded-lg border border-border px-4 py-3">
          <dt className="text-[13px] text-muted-foreground">Items</dt>
          <dd className="text-[24px] font-semibold text-foreground">{rows.length}</dd>
        </div>
        <div className="bg-card rounded-lg border border-border px-4 py-3">
          <dt className="text-[13px] text-muted-foreground">At or below reorder level</dt>
          <dd
            className={`text-[24px] font-semibold ${lowStock > 0 ? 'text-destructive' : 'text-foreground'}`}
          >
            {lowStock}
          </dd>
        </div>
      </dl>

      <ResponsiveTable
        columns={columns}
        rows={sorted}
        rowKey={i => i.id}
        emptyLabel={loading ? 'Loading inventory…' : 'No inventory'}
        mobileTitle={i => i.name}
        mobileSubtitle={i => `${i.category}, ${i.quantity} ${i.unit}`}
      />
    </div>
  );
}
