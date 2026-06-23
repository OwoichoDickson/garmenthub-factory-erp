import { useMemo, useState } from 'react'
import { Zap, Plus, ZapOff, Clock, TrendingDown } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import KPICard from '../components/KPICard'
import { useCollection } from '../hooks/useCollection'
import { durationBetween, yearsRange } from '../lib/format'

const PAGE_SIZE = 25
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const COLUMNS = [
  { key: 'date', label: 'Date', type: 'text' },
  { key: 'month', label: 'Month', type: 'text' },
  { key: 'power_off', label: 'Power Off', type: 'text' },
  { key: 'power_back', label: 'Power Back', type: 'text' },
  { key: 'duration', label: 'Duration', type: 'text' },
  { key: 'total_hours', label: 'Hours', type: 'number' },
  { key: 'notes', label: 'Notes', type: 'text' },
]

function OutageForm({ open, onClose, onSave, record, saving }) {
  const [day, setDay] = useState(() => record?._iso || new Date().toISOString().slice(0, 10))
  const [off, setOff] = useState(record?.power_off || '')
  const [back, setBack] = useState(record?.power_back || '')
  const [notes, setNotes] = useState(record?.notes || '')
  useMemo(() => {
    setDay(record?._iso || new Date().toISOString().slice(0, 10))
    setOff(record?.power_off || ''); setBack(record?.power_back || ''); setNotes(record?.notes || '')
  }, [record, open]) // eslint-disable-line

  const dur = durationBetween(off, back)
  const d = new Date(day)

  const save = () => onSave({
    date: d.toLocaleDateString('en-NG', { day: '2-digit', month: 'short' }),
    month: MONTHS[d.getMonth()],
    year: d.getFullYear(),
    power_off: off || null,
    power_back: back || null,
    duration: dur.label,
    total_hours: dur.hours,
    notes: notes || null,
  })

  return (
    <Modal open={open} onClose={onClose} title={record ? 'Edit Outage' : 'Log Power Outage'}
      footer={<>
        <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={day} onChange={(e) => setDay(e.target.value)} />
        </div>
        <div>
          <label className="label">Power off</label>
          <input type="time" className="input" value={off} onChange={(e) => setOff(e.target.value)} />
        </div>
        <div>
          <label className="label">Power back</label>
          <input type="time" className="input" value={back} onChange={(e) => setBack(e.target.value)} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-3">
        <span className="text-sm text-slate-400">Calculated duration</span>
        <span className="text-lg font-bold text-amber-300">{dur.label || '—'}</span>
      </div>
      <div className="mt-4">
        <label className="label">Notes</label>
        <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Modal>
  )
}

export default function PowerOutage() {
  const { rows, loading, create, update, remove } = useCollection('power_outages')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [month, setMonth] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const years = useMemo(() => yearsRange(rows, []), [rows])
  const filtered = useMemo(() => rows.filter((r) =>
    (year === 'all' || String(r.year) === String(year)) && (!month || r.month === month),
  ), [rows, year, month])
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const thisMonthName = MONTHS[new Date().getMonth()]
  const monthRows = rows.filter((r) => r.month === thisMonthName && String(r.year) === String(new Date().getFullYear()))
  const hoursLost = monthRows.reduce((s, r) => s + Number(r.total_hours || 0), 0)
  const longest = monthRows.reduce((m, r) => Math.max(m, Number(r.total_hours || 0)), 0)

  const onSave = async (values) => {
    setSaving(true)
    try {
      if (editing) await update(editing.id, values)
      else await create(values)
      setModal(false); setEditing(null)
    } finally { setSaving(false) }
  }

  return (
    <div className="fade-in">
      <PageHeader title="Power Outage" icon={Zap} subtitle="Log power interruptions & downtime"
        actions={<button className="btn-primary" onClick={() => { setEditing(null); setModal(true) }}><Plus size={16} /> Log Outage</button>} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard label={`Outages — ${thisMonthName}`} value={monthRows.length} icon={ZapOff} theme="amber" />
        <KPICard label="Hours Lost (month)" value={`${hoursLost.toFixed(1)}h`} icon={TrendingDown} theme="red" />
        <KPICard label="Longest Outage" value={`${longest.toFixed(1)}h`} icon={Clock} theme="violet" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select className="input w-auto" value={month} onChange={(e) => { setMonth(e.target.value); setPage(1) }}>
          <option value="">All months</option>
          {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="input w-auto" value={year} onChange={(e) => { setYear(e.target.value); setPage(1) }}>
          <option value="all">All years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <DataTable columns={COLUMNS} rows={paged} loading={loading}
        onEdit={(r) => { setEditing({ ...r, _iso: undefined }); setModal(true) }}
        onDelete={(r) => setDeleting(r)} />
      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />

      <OutageForm open={modal} onClose={() => { setModal(false); setEditing(null) }} onSave={onSave} record={editing} saving={saving} />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete outage?" size="sm"
        footer={<>
          <button className="btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
          <button className="btn-danger" onClick={async () => { await remove(deleting.id); setDeleting(null) }}>Delete</button>
        </>}>
        <p className="text-sm text-slate-300">Remove this outage record?</p>
      </Modal>
    </div>
  )
}
