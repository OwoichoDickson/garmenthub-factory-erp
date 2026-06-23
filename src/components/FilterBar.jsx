import { Search, CalendarRange, X } from 'lucide-react'
import { titleCase } from '../lib/format'

/**
 * Reusable filter row: search box + select filters + optional From/To date
 * range + year dropdown. Changing any control resets pagination to page 1
 * (caller's onChange does that).
 */
export default function FilterBar({
  search, onSearch, year, years, onYear, filters = [], values = {}, onFilter,
  dateRange, dateFrom, dateTo, onDateFrom, onDateTo, onClearDates,
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {onSearch && (
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9"
            placeholder="Search…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}

      {dateRange && (
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1">
          <CalendarRange size={15} className="text-slate-500" />
          <input type="date" className="bg-transparent text-sm text-slate-100 focus:outline-none"
            value={dateFrom} onChange={(e) => onDateFrom(e.target.value)} title="From date" />
          <span className="text-xs text-slate-500">to</span>
          <input type="date" className="bg-transparent text-sm text-slate-100 focus:outline-none"
            value={dateTo} onChange={(e) => onDateTo(e.target.value)} title="To date" />
          {(dateFrom || dateTo) && (
            <button onClick={onClearDates} className="rounded p-0.5 text-slate-500 hover:text-slate-200" title="Clear dates">
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {filters.map((f) => (
        <select
          key={f.name}
          className="input w-auto"
          value={values[f.name] ?? ''}
          onChange={(e) => onFilter(f.name, e.target.value)}
        >
          <option value="">All {titleCase(f.name)}</option>
          {f.options.map((o) => (
            <option key={o} value={o}>{titleCase(o)}</option>
          ))}
        </select>
      ))}

      {onYear && years?.length > 0 && (
        <select className="input w-auto" value={year} onChange={(e) => onYear(e.target.value)}>
          <option value="all">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      )}
    </div>
  )
}
