import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import { titleCase } from '../lib/format'
import { table } from '../api/db'

function Field({ field, value, onChange, dynamicOptions }) {
  const common = 'input'
  switch (field.type) {
    case 'select': {
      // Options can be a static list, or loaded from another table (optionsTable).
      let opts = field.options
      if (field.optionsTable) {
        const rows = dynamicOptions[field.optionsTable] || []
        opts = rows
          .map((r) => ({
            value: r[field.optionValue],
            label: Array.isArray(field.optionLabel)
              ? field.optionLabel.map((k) => r[k]).filter(Boolean).join(' · ')
              : r[field.optionLabel],
          }))
          .filter((o) => o.value != null && o.value !== '')
      }
      const isObj = field.optionsTable
      return (
        <select className={common} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {opts.map((o) =>
            isObj
              ? <option key={o.value} value={o.value}>{o.label || o.value}</option>
              : <option key={o} value={o}>{titleCase(o)}</option>,
          )}
        </select>
      )
    }
    case 'textarea':
      return (
        <textarea
          className={common}
          rows={3}
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'number':
      return (
        <input
          type="number"
          step="any"
          className={common}
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      )
    case 'date':
      return <input type="date" className={common} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    case 'time':
      return <input type="time" className={common} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    case 'tags':
      return (
        <input
          className={common}
          placeholder={field.placeholder || 'Comma separated'}
          value={Array.isArray(value) ? value.join(', ') : value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    default:
      return (
        <input
          className={common}
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }
}

export default function FormModal({ open, onClose, onSubmit, title, fields, record, saving }) {
  const initial = useMemo(() => {
    const base = {}
    for (const f of fields) {
      const existing = record?.[f.name]
      base[f.name] = existing ?? (f.default ?? (f.type === 'tags' ? [] : ''))
    }
    return base
  }, [fields, record])

  const [values, setValues] = useState(initial)
  const [error, setError] = useState('')

  useEffect(() => {
    setValues(initial)
    setError('')
  }, [initial, open])

  // Load options for any select fields that pull from another table.
  const optionTables = useMemo(
    () => [...new Set(fields.filter((f) => f.optionsTable).map((f) => f.optionsTable))],
    [fields],
  )
  const [dynamicOptions, setDynamicOptions] = useState({})
  useEffect(() => {
    if (!open || optionTables.length === 0) return
    let active = true
    Promise.all(
      optionTables.map(async (t) => {
        try { return [t, await table(t).list({ order: 'created_at', ascending: false })] }
        catch { return [t, []] }
      }),
    ).then((entries) => { if (active) setDynamicOptions(Object.fromEntries(entries)) })
    return () => { active = false }
  }, [open, optionTables])

  const set = (name, v) => setValues((prev) => ({ ...prev, [name]: v }))

  const handleSubmit = async () => {
    for (const f of fields) {
      if (f.required && (values[f.name] === '' || values[f.name] == null)) {
        setError(`${f.label} is required.`)
        return
      }
    }
    // Normalize: empty strings -> null, tags -> array
    const payload = {}
    for (const f of fields) {
      let v = values[f.name]
      if (f.type === 'tags') {
        v = Array.isArray(v) ? v : String(v || '').split(',').map((s) => s.trim()).filter(Boolean)
      } else if (v === '') {
        v = null
      }
      payload[f.name] = v
    }
    try {
      setError('')
      await onSubmit(payload)
    } catch (e) {
      setError(e.message || 'Could not save. Please try again.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
            <label className="label">
              {f.label}
              {f.required && <span className="text-red-400"> *</span>}
            </label>
            <Field field={f} value={values[f.name]} onChange={(v) => set(f.name, v)} dynamicOptions={dynamicOptions} />
          </div>
        ))}
      </div>
    </Modal>
  )
}
