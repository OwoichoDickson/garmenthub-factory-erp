import { titleCase } from '../lib/format'

const TONES = {
  green: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  red: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30',
  blue: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30',
  slate: 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/30',
  violet: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30',
}

const MAP = {
  // generic
  active: 'green', present: 'green', completed: 'green', paid: 'green', in_stock: 'green',
  delivered: 'green', confirmed: 'blue', shipped: 'violet', in_progress: 'blue',
  on_leave: 'amber', late: 'amber', half_day: 'amber', low_stock: 'amber',
  partial: 'amber', pending: 'amber', delayed: 'red', absent: 'red',
  terminated: 'red', out_of_stock: 'red', unpaid: 'red', cancelled: 'red', inactive: 'slate',
  // movement types
  stock_in: 'green', production_output: 'green', stock_out: 'red', sale: 'blue',
  production_use: 'amber', adjustment: 'violet',
  // customer / order types
  wholesale: 'blue', retail: 'violet',
  // expense categories (neutral)
  raw_materials: 'blue', labor: 'violet', utilities: 'amber', maintenance: 'slate',
  transport: 'slate', rent: 'slate', equipment: 'slate', other: 'slate',
}

export default function StatusBadge({ value }) {
  if (value == null || value === '') return <span className="text-slate-600">—</span>
  const tone = TONES[MAP[value]] || TONES.slate
  return <span className={`chip ${tone}`}>{titleCase(value)}</span>
}
