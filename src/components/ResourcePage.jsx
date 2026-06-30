import { useMemo, useState } from 'react'
import { Plus, Download } from 'lucide-react'
import PageHeader from './PageHeader'
import DataTable from './DataTable'
import FilterBar from './FilterBar'
import Pagination from './Pagination'
import FormModal from './FormModal'
import Modal from './Modal'
import { useCollection } from '../hooks/useCollection'
import { yearsRange } from '../lib/format'
import { downloadCSV } from '../lib/csv'

const PAGE_SIZE = 25

/**
 * Schema-driven CRUD page used by the standard list screens. Handles search,
 * year filter, dropdown filters, pagination (resets to page 1 on any filter
 * change), and create / edit / delete via the shared modals.
 */
export default function ResourcePage({ config, icon, subtitle, kpis, extraActions }) {
  const { rows, loading, create, update, remove } = useCollection(config.table)

  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState({})
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const dateKeys = config.dateField ? [config.dateField] : ['created_at']
  const years = useMemo(() => yearsRange(rows, dateKeys), [rows]) // eslint-disable-line

  const resetPage = (fn) => (v) => { fn(v); setPage(1) }

  const hasRange = Boolean(dateFrom || dateTo)

  const filtered = useMemo(() => {
    const fromT = dateFrom ? new Date(dateFrom + 'T00:00:00') : null
    const toT = dateTo ? new Date(dateTo + 'T23:59:59') : null
    return rows.filter((r) => {
      const dv = r[dateKeys[0]] || r.created_at
      // date range (takes precedence over the year dropdown)
      if (hasRange) {
        const t = dv ? new Date(dv) : null
        if (!t || isNaN(t)) return false
        if (fromT && t < fromT) return false
        if (toT && t > toT) return false
      } else if (year !== 'all') {
        const ry = r.year ?? (dv ? new Date(dv).getFullYear() : null)
        if (ry != null && String(ry) !== String(year)) return false
      }
      // dropdown filters
      for (const [k, v] of Object.entries(filterValues)) {
        if (v && String(r[k]) !== String(v)) return false
      }
      // search
      if (search && config.searchKeys) {
        const hit = config.searchKeys.some((k) =>
          String(r[k] ?? '').toLowerCase().includes(search.toLowerCase()),
        )
        if (!hit) return false
      }
      return true
    })
  }, [rows, year, filterValues, search, dateFrom, dateTo]) // eslint-disable-line

  // Newest first by the entity's meaningful date, falling back to created_at.
  const sorted = useMemo(() => {
    const key = dateKeys[0]
    const ts = (r) => {
      const t = new Date(r[key] ?? r.created_at ?? 0).getTime()
      return isNaN(t) ? 0 : t
    }
    return [...filtered].sort((a, b) => {
      const d = ts(b) - ts(a)
      return d !== 0 ? d : new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0)
    })
  }, [filtered]) // eslint-disable-line

  const total = sorted.length
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const rowAccent = config.lowStock
    ? (r) => Number(r[config.lowStock.qty]) <= Number(r[config.lowStock.level])
    : undefined

  const onSubmit = async (values) => {
    setSaving(true)
    try {
      if (editing) await update(editing.id, values)
      else await create(values)
      setFormOpen(false)
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  // Export the current (filtered + sorted) view to CSV.
  const handleExport = () => {
    const headers = config.fields.map((f) => f.name)
    downloadCSV(`${config.table}_${new Date().toISOString().slice(0, 10)}.csv`, headers, sorted)
  }

  return (
    <div className="fade-in">
      <PageHeader
        title={config.title}
        subtitle={subtitle}
        icon={icon}
        actions={
          <>
            {extraActions}
            <button className="btn-ghost" onClick={handleExport} disabled={!sorted.length} title="Export current view to CSV">
              <Download size={16} /> Export CSV
            </button>
            <button className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
              <Plus size={16} /> New {config.singular}
            </button>
          </>
        }
      />

      {kpis && <div className="mb-6">{kpis(rows, filtered)}</div>}

      <FilterBar
        search={search}
        onSearch={config.searchKeys ? resetPage(setSearch) : undefined}
        year={year}
        years={years}
        onYear={resetPage(setYear)}
        filters={config.filters || []}
        values={filterValues}
        onFilter={(name, v) => { setFilterValues((p) => ({ ...p, [name]: v })); setPage(1) }}
        dateRange
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFrom={resetPage(setDateFrom)}
        onDateTo={resetPage(setDateTo)}
        onClearDates={() => { setDateFrom(''); setDateTo(''); setPage(1) }}
      />

      <DataTable
        columns={config.columns}
        rows={paged}
        loading={loading}
        rowAccent={rowAccent}
        onEdit={(row) => { setEditing(row); setFormOpen(true) }}
        onDelete={(row) => setDeleting(row)}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />

      <FormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSubmit={onSubmit}
        saving={saving}
        title={editing ? `Edit ${config.singular}` : `New ${config.singular}`}
        fields={config.fields}
        record={editing}
      />

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${config.singular}?`}
        size="sm"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
            <button
              className="btn-danger"
              onClick={async () => { await remove(deleting.id); setDeleting(null) }}
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          This will permanently remove this record. This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
