import { useRef, useState } from 'react'
import {
  Upload, FileDown, FileUp, Loader2, CheckCircle2, AlertTriangle, Database,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import AccessDenied from '../components/AccessDenied'
import { useAuth } from '../auth/AuthContext'
import { isFullAccess } from '../auth/roles'
import { IMPORT_ENTITIES, coerce, DEDUPE, rowKey } from '../api/importEntities'
import { table } from '../api/db'
import { parseCSV, downloadCSV } from '../lib/csv'

const BATCH = 100

function EntityCard({ entity }) {
  const inputRef = useRef(null)
  const [state, setState] = useState({ status: 'idle' }) // idle | importing | done | error

  const headers = entity.fields.map((f) => f.name)

  const downloadTemplate = () => downloadCSV(`${entity.key}_template.csv`, headers, [])

  const handleFile = async (file) => {
    if (!file) return
    setState({ status: 'importing', total: 0, imported: 0, skipped: 0, duplicates: 0, reasons: [] })
    try {
      const text = await file.text()
      const { records } = parseCSV(text)
      const total = records.length

      // Load existing natural keys so we can ignore duplicates already in the DB.
      const dedupeCols = DEDUPE[entity.key] || null
      const seen = new Set()
      if (dedupeCols) {
        const existing = await table(entity.table).select(dedupeCols)
        for (const r of existing) {
          const k = rowKey(r, dedupeCols)
          if (k) seen.add(k)
        }
      }

      // Keep the CSV line number with each row so error messages are precise.
      const valid = []
      const reasons = []
      let duplicates = 0
      let skipped = 0
      records.forEach((raw, idx) => {
        const line = idx + 2 // +1 for header row, +1 for 1-based
        const row = {}
        for (const fld of entity.fields) row[fld.name] = coerce(raw[fld.name], fld.type)

        const missing = entity.required.filter((r) => row[r] == null || row[r] === '')
        if (missing.length) {
          skipped += 1
          reasons.push(`Row ${line}: missing ${missing.join(', ')}`)
          return
        }

        // Duplicate check — against the DB and rows earlier in this same file.
        const k = rowKey(row, dedupeCols)
        if (k && seen.has(k)) {
          duplicates += 1
          reasons.push(`Row ${line}: duplicate (${k}) — ignored`)
          return
        }
        if (k) seen.add(k)

        valid.push({ data: row, line })
      })

      let imported = 0
      for (let i = 0; i < valid.length; i += BATCH) {
        const batch = valid.slice(i, i + BATCH)
        try {
          // Fast path: insert the whole batch in one request.
          const inserted = await table(entity.table).bulkCreate(batch.map((b) => b.data))
          imported += inserted.length || batch.length
        } catch {
          // A bad row poisoned the batch — retry each row alone so the good ones
          // still import and only the genuinely-bad rows are skipped.
          for (const item of batch) {
            try {
              await table(entity.table).bulkCreate([item.data])
              imported += 1
            } catch (rowErr) {
              skipped += 1
              reasons.push(`Row ${item.line}: ${rowErr.message}`)
            }
            setState({ status: 'importing', total, imported, skipped, duplicates, reasons })
          }
        }
        setState({ status: 'importing', total, imported, skipped, duplicates, reasons })
      }

      setState({ status: 'done', total, imported, skipped, duplicates, reasons })
    } catch (e) {
      setState({ status: 'error', message: e.message })
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const pct = state.total ? Math.round(((state.imported + state.skipped) / state.total) * 100) : 0

  return (
    <div className="glass-card flex flex-col p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent/20">
            <Database size={18} />
          </div>
          <div>
            <p className="font-semibold text-slate-100">{entity.label}</p>
            <p className="text-xs text-slate-500">{entity.fields.length} columns</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="btn-ghost flex-1" onClick={downloadTemplate}>
          <FileDown size={15} /> Template
        </button>
        <button
          className="btn-primary flex-1"
          onClick={() => inputRef.current?.click()}
          disabled={state.status === 'importing'}
        >
          {state.status === 'importing' ? <Loader2 size={15} className="animate-spin" /> : <FileUp size={15} />}
          Upload CSV
        </button>
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>

      {/* Progress */}
      {state.status === 'importing' && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>Importing…</span><span>{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Summary */}
      {state.status === 'done' && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 ring-1 ring-emerald-500/30">
            <CheckCircle2 size={16} /> {state.imported} record{state.imported === 1 ? '' : 's'} imported
            {state.duplicates > 0 && <span className="text-amber-300">· {state.duplicates} duplicate{state.duplicates === 1 ? '' : 's'} ignored</span>}
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
            <Stat label="Found" value={state.total} />
            <Stat label="Imported" value={state.imported} tone="text-emerald-300" />
            <Stat label="Duplicates" value={state.duplicates || 0} tone={state.duplicates ? 'text-amber-300' : 'text-slate-300'} />
            <Stat label="Skipped" value={state.skipped} tone={state.skipped ? 'text-red-300' : 'text-slate-300'} />
          </div>
          {state.reasons.length > 0 && (
            <details className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200 ring-1 ring-amber-500/30">
              <summary className="flex cursor-pointer items-center gap-1.5">
                <AlertTriangle size={14} /> {state.reasons.length} row{state.reasons.length === 1 ? '' : 's'} skipped or ignored
              </summary>
              <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
                {state.reasons.slice(0, 50).map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      {state.status === 'error' && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/30">
          <AlertTriangle size={16} /> {state.message || 'Could not read file.'}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, tone = 'text-slate-300' }) {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 py-2">
      <p className={`text-base font-bold ${tone}`}>{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  )
}

export default function ImportCenter() {
  const { roles } = useAuth()
  if (!isFullAccess(roles)) {
    return <AccessDenied message="The Import Center is restricted to administrators." />
  }

  return (
    <div className="fade-in">
      <PageHeader title="Import Center" icon={Upload} subtitle="Upload CSV files to bulk-import records" />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 text-sm text-slate-400">
        <FileDown size={18} className="mt-0.5 shrink-0 text-accent" />
        <p>
          Download a <span className="text-slate-200">template</span> first to get the exact column
          headers, fill in your rows, then <span className="text-slate-200">upload the CSV</span>.
          Headers must match the template exactly. Records import in batches of {BATCH}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {IMPORT_ENTITIES.map((e) => <EntityCard key={e.key} entity={e} />)}
      </div>
    </div>
  )
}
