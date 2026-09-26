'use client';

import PivotTable, { type PivotField } from '@/components/table/PivotTable';
import { SALES } from '../fixtures';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const SALE_FIELDS: PivotField[] = [
  { key: 'region', label: 'Region' },
  { key: 'country', label: 'Country' },
  { key: 'rep', label: 'Sales rep' },
  { key: 'category', label: 'Category' },
  { key: 'product', label: 'Product' },
  { key: 'channel', label: 'Channel' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'month', label: 'Month' },
  { key: 'units', label: 'Units', kind: 'number' },
  { key: 'revenue', label: 'Revenue', kind: 'number', format: money },
  { key: 'cost', label: 'Cost', kind: 'number', format: money },
];

/**
 * 360 sale records, pivoted by region and country down the side and quarter
 * across the top, with revenue and units in the cells and channel as a page
 * filter. Tick, drag or remove fields in the panel to re-pivot.
 */
export function PivotTableDemo() {
  return (
    <PivotTable
      title="Sales"
      data={SALES}
      fields={SALE_FIELDS}
      maxHeight={480}
      defaultConfig={{
        rows: ['region', 'country'],
        columns: ['quarter'],
        values: [{ field: 'revenue', agg: 'sum' }, { field: 'units', agg: 'sum' }],
        filters: ['channel'],
        exclude: { channel: ['Partner'] },
      }}
    />
  );
}
