import { useMemo, useState } from 'react'
import { CalendarRange, ChevronLeft, ChevronRight, Plus, FileDown, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import FormModal from '../components/FormModal'
import Modal from '../components/Modal'
import { useCollection } from '../hooks/useCollection'
import { opts } from '../api/schema'
import { titleCase, num, yearsRange } from '../lib/format'
import { exportWeeklyPDF } from '../lib/weeklyPdf'

const DEPTS = opts.weeklyDept
const FIELDS = [
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'department', label: 'Department', type: 'select', options: opts.weeklyDept, required: true },
  { name: 'team_or_worker_name', label: 'Team / Worker', type: 'text' },
  { name: 'product_category', label: 'Category', type: 'select', options: opts.productCategory },
  { name: 'product_type', label: 'Product type', type: 'select', options: opts.productType },
  { name: 'style_description', label: 'Style description', type: 'text' },
  { name: 'target_per_day', label: 'Target / day', type: 'number' },
  { name: 'day_output', label: 'Day output', type: 'number' },
  { name: 'night_output', label: 'Night output', type: 'number' },
  { name: 'remarks', label: 'Remarks', type: 'textarea' },
]

function startOfWeek(d) {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7 // Monday = 0
  x.setDate(x.getDate() - day)
  x.setHours(0, 0, 0, 0)
  return x
}
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const fmt = (d) => d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })

function effTone(pct) {
  if (pct >= 100) return 'text-emerald-300'
  if (pct >= 75) return 'text-blue-300'
  if (pct >= 50) return 'text-amber-300'
  return 'text-red-300'
}

export default function WeeklyTracker() {
  const { rows, loading, create, update, remove } = useCollection('weekly_production_entries')
  const currentYear = new Date().getFullYear()

  const [year, setYear] = useState(String(currentYear))
  const [anchor, setAnchor] = useState(startOfWeek(new Date()))
  const [dept, setDept] = useState(DEPTS[0])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const years = useMemo(() => {
    const ys = yearsRange(rows, ['date'])
    if (!ys.includes(2024)) ys.push(2024)
    return [...new Set([currentYear, 2026, 2025, 2024, ...ys])].sort((a, b) => b - a)
  }, [rows]) // eslint-disable-line

  const weekStart = anchor
  const weekEnd = addDays(weekStart, 6)

  const onYear = (y) => {
    setYear(y)
    // Reset week anchor to Jan 1 of the selected year (spec behaviour)
    setAnchor(startOfWeek(new Date(Number(y), 0, 1)))
  }

  const weekEntries = useMemo(() => rows.filter((r) => {
    if (r.department !== dept || !r.date) return false
    const d = new Date(r.date)
    return d >= weekStart && d <= addDays(weekEnd, 1)
  }).sort((a, b) => new Date(a.date) - new Date(b.date)), [rows, dept, weekStart]) // eslint-disable-line

  const totals = weekEntries.reduce((acc, e) => {
    acc.target += Number(e.target_per_day || 0)
    acc.day += Number(e.day_output || 0)
    acc.night += Number(e.night_output || 0)
    return acc
  }, { target: 0, day: 0, night: 0 })

  const onSubmit = async (values) => {
    setSaving(true)
    try {
      const payload = { ...values, week_label: `${fmt(startOfWeek(new Date(values.date)))} week` }
      if (editing) await update(editing.id, payload)
      else await create(payload)
      setModal(false); setEditing(null)
    } finally { setSaving(false) }
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Weekly Tracker" icon={CalendarRange} subtitle="Production output by department, week by week"
        actions={
          <>
            <button className="btn-ghost" onClick={() => exportWeeklyPDF(rows, year)}>
              <FileDown size={16} /> Export PDF
            </button>
            <button className="btn-primary" onClick={() => { setEditing(null); setModal(true) }}>
              <Plus size={16} /> New Entry
            </button>
          </>
        }
      />

      {/* Week + year nav */}
      <div className="glass-card mb-5 flex flex-col items-center justify-between gap-3 p-3 sm:flex-row">
        <div className="flex items-center gap-2">
          <button className="btn-ghost px-2.5 py-1.5" onClick={() => setAnchor(addDays(anchor, -7))}><ChevronLeft size={16} /></button>
          <div className="px-2 text-center">
            <p className="text-sm font-semibold text-slate-100">{fmt(weekStart)} – {fmt(weekEnd)}</p>
            <p className="text-[11px] text-slate-500">{weekStart.getFullYear()}</p>
          </div>
          <button className="btn-ghost px-2.5 py-1.5" onClick={() => setAnchor(addDays(anchor, 7))}><ChevronRight size={16} /></button>
        </div>
        <select className="input w-auto" value={year} onChange={(e) => onYear(e.target.value)}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Department tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {DEPTS.map((d) => (
          <button
            key={d}
            onClick={() => setDept(d)}
            className={`chip px-3 py-1.5 transition ${
              dept === d ? 'bg-accent text-white' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {titleCase(d)}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 text-left text-xs uppercase tracking-wide text-slate-400">
                {['Date', 'Team/Worker', 'Product', 'Style', 'Target', 'Day', 'Night', 'Total', 'Efficiency', ''].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-500">Loading…</td></tr>
              ) : weekEntries.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-500">No {titleCase(dept)} entries this week.</td></tr>
              ) : (
                weekEntries.map((e, i) => {
                  const total = Number(e.day_output || 0) + Number(e.night_output || 0)
                  const pct = e.target_per_day ? Math.round((total / Number(e.target_per_day)) * 100) : 0
                  return (
                    <tr key={e.id} className={`hover:bg-slate-800/40 ${i % 2 ? 'bg-slate-900/30' : ''}`}>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-300">{new Date(e.date).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}</td>
                      <td className="px-4 py-3 text-slate-200">{e.team_or_worker_name || '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{titleCase(e.product_type || '—')}</td>
                      <td className="px-4 py-3 text-slate-400">{e.style_description || '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{num(e.target_per_day)}</td>
                      <td className="px-4 py-3 text-slate-300">{num(e.day_output)}</td>
                      <td className="px-4 py-3 text-slate-300">{num(e.night_output)}</td>
                      <td className="px-4 py-3 font-medium text-slate-100">{num(total)}</td>
                      <td className={`px-4 py-3 font-semibold ${effTone(pct)}`}>{pct}%</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setEditing(e); setModal(true) }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-accent"><Pencil size={15} /></button>
                          <button onClick={() => setDeleting(e)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {weekEntries.length > 0 && (
              <tfoot>
                <tr className="border-t border-slate-700/60 bg-slate-900/50 font-semibold text-slate-200">
                  <td className="px-4 py-3" colSpan={4}>Week totals</td>
                  <td className="px-4 py-3">{num(totals.target)}</td>
                  <td className="px-4 py-3">{num(totals.day)}</td>
                  <td className="px-4 py-3">{num(totals.night)}</td>
                  <td className="px-4 py-3">{num(totals.day + totals.night)}</td>
                  <td className={`px-4 py-3 ${effTone(totals.target ? Math.round(((totals.day + totals.night) / totals.target) * 100) : 0)}`}>
                    {totals.target ? Math.round(((totals.day + totals.night) / totals.target) * 100) : 0}%
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <FormModal
        open={modal} onClose={() => { setModal(false); setEditing(null) }} onSubmit={onSubmit}
        saving={saving} title={editing ? 'Edit Entry' : 'New Weekly Entry'} fields={FIELDS} record={editing}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete entry?" size="sm"
        footer={<>
          <button className="btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
          <button className="btn-danger" onClick={async () => { await remove(deleting.id); setDeleting(null) }}>Delete</button>
        </>}>
        <p className="text-sm text-slate-300">Remove this weekly production entry?</p>
      </Modal>
    </div>
  )
}
