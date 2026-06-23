import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarCheck, Check, Search, UserCheck, UserX, Clock, Plane } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import KPICard from '../components/KPICard'
import { useCollection } from '../hooks/useCollection'
import { opts } from '../api/schema'
import { durationBetween, titleCase, currentShift, yearsRange } from '../lib/format'

const PAGE_SIZE = 25
const COLUMNS = [
  { key: 'worker_name', label: 'Worker', type: 'text' },
  { key: 'shift', label: 'Shift', type: 'text' },
  { key: 'clock_in', label: 'In', type: 'text' },
  { key: 'clock_out', label: 'Out', type: 'text' },
  { key: 'hours_worked', label: 'Hours', type: 'number' },
  { key: 'overtime_hours', label: 'OT', type: 'number' },
  { key: 'status', label: 'Status', type: 'badge' },
]

const today = () => new Date().toISOString().slice(0, 10)

function WorkerPicker({ workers, markedNames, value, onPick }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const matches = workers.filter((w) => w.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="relative" ref={ref}>
      <label className="label">Worker</label>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="input pl-9"
          placeholder="Search worker…"
          value={open ? q : value || ''}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-700 bg-panel shadow-glass">
          {matches.length === 0 && <p className="px-3 py-2 text-xs text-slate-500">No workers</p>}
          {matches.map((w) => {
            const marked = markedNames.has(w.name)
            return (
              <button
                key={w.id}
                onClick={() => { onPick(w); setOpen(false); setQ('') }}
                className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                <span>{w.name} <span className="text-xs text-slate-500">· {w.department}</span></span>
                {marked && <span className="flex items-center gap-1 text-xs text-emerald-400"><Check size={13} /> marked</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Attendance() {
  const workersCol = useCollection('workers')
  const { rows, loading, create, update, remove } = useCollection('attendance')

  const [date, setDate] = useState(today())
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(null) // { worker, record? , shift, clock_in, clock_out, status }
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)

  const activeWorkers = workersCol.rows.filter((w) => w.status !== 'terminated')

  const forDate = useMemo(() => rows.filter((r) => r.date === date), [rows, date])
  const markedNames = useMemo(() => new Set(forDate.map((r) => r.worker_name)), [forDate])
  const years = useMemo(() => yearsRange(rows, ['date']), [rows])

  const yearRows = useMemo(
    () => rows
      .filter((r) => year === 'all' || (r.date && String(new Date(r.date).getFullYear()) === String(year)))
      .sort((a, b) => {
        const d = new Date(b.date ?? 0) - new Date(a.date ?? 0)
        return d !== 0 ? d : new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0)
      }),
    [rows, year],
  )
  const paged = yearRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = (s) => forDate.filter((r) => r.status === s).length

  // Build the form for a worker + shift: load the existing record for that exact
  // worker/date/shift (edit mode) or start a fresh entry. Keyed on shift so a
  // worker can be marked separately per shift — matching the import dedup key.
  const buildForm = (worker, shift) => {
    const existing = forDate.find((r) => r.worker_name === worker.name && r.shift === shift)
    return existing
      ? { worker, record: existing, shift, clock_in: existing.clock_in || '', clock_out: existing.clock_out || '', status: existing.status }
      : { worker, record: null, shift, clock_in: '', clock_out: '', status: 'present' }
  }
  const pickWorker = (w) => { setError(''); setForm(buildForm(w, w.shift || currentShift())) }
  const changeShift = (shift) => setForm((f) => (f ? buildForm(f.worker, shift) : f))

  const dur = form ? durationBetween(form.clock_in, form.clock_out) : { hours: 0, label: '' }
  const overtime = Math.max(0, +(dur.hours - 8).toFixed(2))

  const save = async () => {
    if (!form) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        worker_name: form.worker.name,
        worker_id: form.worker.employee_id,
        date,
        shift: form.shift,
        clock_in: form.clock_in || null,
        clock_out: form.clock_out || null,
        hours_worked: dur.hours,
        overtime_hours: overtime,
        status: form.status,
      }
      if (form.record) await update(form.record.id, payload)
      else await create(payload)
      setForm(null)
    } catch (e) {
      setError(e.message || 'Could not save attendance. Please try again.')
    } finally { setSaving(false) }
  }

  return (
    <div className="fade-in">
      <PageHeader title="Attendance" icon={CalendarCheck} subtitle="Mark daily worker attendance" />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Present" value={counts('present')} icon={UserCheck} theme="green" />
        <KPICard label="Absent" value={counts('absent')} icon={UserX} theme="red" />
        <KPICard label="Late" value={counts('late')} icon={Clock} theme="amber" />
        <KPICard label="On Leave" value={counts('on_leave')} icon={Plane} theme="violet" />
      </div>

      {/* Marking panel */}
      <div className="glass-card mb-6 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={date} onChange={(e) => { setDate(e.target.value); setForm(null) }} />
          </div>
          <WorkerPicker workers={activeWorkers} markedNames={markedNames} value={form?.worker?.name} onPick={pickWorker} />
        </div>

        {/* Guidance — the marking form (and its button) only shows after a worker is picked */}
        {!form && (
          activeWorkers.length === 0 ? (
            <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              No workers yet. Add workers on the <span className="font-medium">Workers</span> page first — attendance is marked per worker.
            </p>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Search and select a worker above to mark attendance.
            </p>
          )
        )}

        {form && (
          <div className="mt-5 border-t border-slate-700/60 pt-5">
            <div className="mb-4 flex items-center gap-2 text-sm">
              <span className="font-semibold text-slate-100">{form.worker.name}</span>
              {form.record
                ? <span className="chip bg-amber-500/15 text-amber-300">Edit mode — already marked</span>
                : <span className="chip bg-emerald-500/15 text-emerald-300">New entry</span>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="label">Shift</label>
                <select className="input" value={form.shift} onChange={(e) => changeShift(e.target.value)}>
                  {opts.shift.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Clock in</label>
                <input type="time" className="input" value={form.clock_in} onChange={(e) => setForm({ ...form, clock_in: e.target.value })} />
              </div>
              <div>
                <label className="label">Clock out</label>
                <input type="time" className="input" value={form.clock_out} onChange={(e) => setForm({ ...form, clock_out: e.target.value })} />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {opts.attendanceStatus.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Hours (auto)</label>
                <div className="input flex items-center justify-between !bg-slate-900/40">
                  <span>{dur.hours || 0}h</span>
                  {overtime > 0 && <span className="text-xs text-amber-300">+{overtime} OT</span>}
                </div>
              </div>
            </div>
            {error && (
              <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/30">{error}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => { setForm(null); setError('') }}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : form.record ? 'Update attendance' : 'Mark attendance'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">Attendance records</h2>
        <select className="input w-auto" value={year} onChange={(e) => { setYear(e.target.value); setPage(1) }}>
          <option value="all">All years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <DataTable
        columns={[{ key: 'date', label: 'Date', type: 'date' }, ...COLUMNS]}
        rows={paged}
        loading={loading}
        onDelete={(r) => setDeleting(r)}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={yearRows.length} onPage={setPage} />

      {deleting && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleting(null)} />
          <div className="glass-card relative z-10 max-w-sm p-6">
            <p className="text-sm text-slate-300">Delete attendance for {deleting.worker_name} on {deleting.date}?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="btn-danger" onClick={async () => { await remove(deleting.id); setDeleting(null) }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
