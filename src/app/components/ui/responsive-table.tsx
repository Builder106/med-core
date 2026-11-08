import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyLabel?: ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
  mobileTitle?: (row: T) => ReactNode;
  mobileSubtitle?: (row: T) => ReactNode;
}

export function ResponsiveTable<T>({
  columns,
  rows,
  rowKey,
  emptyLabel = 'No records',
  onRowClick,
  className,
  mobileTitle,
  mobileSubtitle,
}: ResponsiveTableProps<T>) {
  const visibleMobileColumns = columns.filter(c => !c.hideOnMobile);

  return (
    <div className={clsx('w-full', className)}>
      <div
        data-responsive-table-desktop=""
        className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card shadow-sm"
      >
        <table className="w-full text-[13px] text-foreground">
          <thead className="bg-muted text-left text-[12px] text-muted-foreground">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  scope="col"
                  className={clsx('px-4 py-3 font-medium', col.headerClassName)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map(row => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={clsx(
                    'transition-colors hover:bg-card',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map(col => (
                    <td key={col.key} className={clsx('px-4 py-3 align-top', col.cellClassName)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div data-testid="responsive-table-mobile" className="md:hidden space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          rows.map(row => (
            <div
              key={rowKey(row)}
              data-testid="responsive-table-card"
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={clsx(
                'rounded-xl border border-border bg-card p-4 shadow-sm',
                onRowClick && 'af-tap af-press cursor-pointer'
              )}
            >
              {mobileTitle && (
                <div className="text-[15px] font-medium text-foreground">{mobileTitle(row)}</div>
              )}
              {mobileSubtitle && (
                <div className="text-[12px] text-muted-foreground mt-0.5">
                  {mobileSubtitle(row)}
                </div>
              )}
              <dl
                className={clsx(
                  'grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-[13px]',
                  (mobileTitle || mobileSubtitle) && 'mt-3 pt-3 border-t border-border'
                )}
              >
                {visibleMobileColumns.map(col => (
                  <div key={col.key} className="contents">
                    <dt className="text-[12px] text-muted-foreground self-center">{col.header}</dt>
                    <dd className="text-foreground break-words">{col.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
