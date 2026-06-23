import { Pencil, Trash2, Inbox, Star } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { naira, num, fmtDate, fmtDateTime } from '../lib/format'

function ProgressCell({ row, col }) {
  const a = Number(row[col.num] || 0)
  const b = Number(row[col.den] || 0)
  const pct = b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0
  const tone = pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-accent' : 'bg-amber-500'
  return (
    <div className="min-w-[120px]">
      <div className="mb-1 flex justify-between text-xs text-slate-400">
        <span>{num(a)} / {num(b)}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Rating({ value }) {
  const v = Number(value || 0)
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={13} className={i <= v ? 'fill-amber-400 text-amber-400' : 'text-slate-600'} />
      ))}
    </span>
  )
}

function Cell({ row, col }) {
  const v = row[col.key]
  switch (col.type) {
    case 'currency': return naira(v)
    case 'number': return num(v)
    case 'date': return fmtDate(v)
    case 'datetime': return fmtDateTime(v)
    case 'badge': return <StatusBadge value={v} />
    case 'rating': return <Rating value={v} />
    case 'progress': return <ProgressCell row={row} col={col} />
    case 'bool': return v ? 'Yes' : 'No'
    case 'tags':
      return Array.isArray(v) && v.length
        ? <span className="flex flex-wrap gap-1">{v.map((t, i) => (
            <span key={i} className="chip bg-slate-700/50 text-slate-300">{t}</span>
          ))}</span>
        : <span className="text-slate-600">—</span>
    default:
      return v == null || v === '' ? <span className="text-slate-600">—</span> : String(v)
  }
}

export default function DataTable({ columns, rows, loading, onEdit, onDelete, rowAccent }) {
  const hasActions = onEdit || onDelete

  if (loading) {
    return (
      <div className="glass-card overflow-hidden">
        <div className="animate-pulse divide-y divide-slate-800">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3.5">
              {columns.map((_, j) => (
                <div key={j} className="h-3.5 flex-1 rounded bg-slate-800" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="glass-card grid place-items-center py-16 text-center">
        <Inbox size={36} className="text-slate-600" />
        <p className="mt-3 text-sm text-slate-400">No records found.</p>
        <p className="text-xs text-slate-600">Try adjusting filters or add a new entry.</p>
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/60 text-left text-xs uppercase tracking-wide text-slate-400">
              {columns.map((c) => (
                <th key={c.key} className="whitespace-nowrap px-4 py-3 font-medium">{c.label}</th>
              ))}
              {hasActions && <th className="px-4 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {rows.map((row, i) => (
              <tr
                key={row.id || i}
                className={`transition hover:bg-slate-800/40 ${i % 2 ? 'bg-slate-900/30' : ''} ${
                  rowAccent?.(row) ? 'bg-amber-500/[0.06]' : ''
                }`}
              >
                {columns.map((c) => (
                  <td key={c.key} className="whitespace-nowrap px-4 py-3 text-slate-200">
                    <Cell row={row} col={c} />
                  </td>
                ))}
                {hasActions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-accent"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
