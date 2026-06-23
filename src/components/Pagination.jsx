import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-1 pt-4 sm:flex-row">
      <p className="text-xs text-slate-400">
        Showing <span className="text-slate-200">{from}–{to}</span> of{' '}
        <span className="text-slate-200">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          className="btn-ghost px-2.5 py-1.5 disabled:opacity-40"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-3 text-sm text-slate-300">
          Page {page} / {pages}
        </span>
        <button
          className="btn-ghost px-2.5 py-1.5 disabled:opacity-40"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
