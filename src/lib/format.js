// Formatting + shift helpers shared across pages.

export const naira = (n) =>
  '₦' + Number(n || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })

export const num = (n) => Number(n || 0).toLocaleString('en-NG')

export function fmtDate(d) {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date)) return d
  return date.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtDateTime(d) {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date)) return d
  return date.toLocaleString('en-NG', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export const titleCase = (s) =>
  String(s ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

export const SHIFTS = {
  morning: { label: 'Morning', window: '6am – 2pm', start: 6, end: 14 },
  afternoon: { label: 'Afternoon', window: '2pm – 10pm', start: 14, end: 22 },
  night: { label: 'Night', window: '10pm – 6am', start: 22, end: 6 },
}

export function currentShift(date = new Date()) {
  const h = date.getHours()
  if (h >= 6 && h < 14) return 'morning'
  if (h >= 14 && h < 22) return 'afternoon'
  return 'night'
}

// "07:30" -> minutes since midnight
function toMinutes(t) {
  if (!t) return null
  const [h, m] = String(t).split(':').map(Number)
  if (isNaN(h)) return null
  return h * 60 + (m || 0)
}

// Returns { hours, label } between two "HH:MM" times, wrapping past midnight.
export function durationBetween(off, back) {
  const a = toMinutes(off)
  const b = toMinutes(back)
  if (a == null || b == null) return { hours: 0, label: '' }
  let mins = b - a
  if (mins < 0) mins += 24 * 60
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return { hours: +(mins / 60).toFixed(2), label: `${h}h ${m}m` }
}

export function yearsRange(records, dateKeys = ['created_at']) {
  const set = new Set()
  for (const r of records) {
    for (const k of dateKeys) {
      const v = r[k]
      if (v) {
        const y = new Date(v).getFullYear()
        if (!isNaN(y)) set.add(y)
      }
    }
    if (r.year) set.add(Number(r.year))
  }
  set.add(new Date().getFullYear())
  return [...set].filter(Boolean).sort((a, b) => b - a)
}
