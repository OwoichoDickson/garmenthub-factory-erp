// Minimal CSV helpers — handles quoted fields, embedded commas, and "" escapes.

export function parseCSV(text) {
  const rows = []
  let field = ''
  let row = []
  let inQuotes = false

  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = ''
    } else {
      field += c
    }
  }
  // last field / row
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }

  // drop fully-empty trailing rows
  const cleaned = rows.filter((r) => r.some((c) => String(c).trim() !== ''))
  if (cleaned.length === 0) return { headers: [], records: [] }

  const headers = cleaned[0].map((h) => h.trim())
  const records = cleaned.slice(1).map((r) => {
    const obj = {}
    headers.forEach((h, idx) => { obj[h] = r[idx] ?? '' })
    return obj
  })
  return { headers, records }
}

function escapeCell(v) {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Trigger a browser download of a CSV string. */
export function downloadCSV(filename, headers, rows = []) {
  const lines = [headers.map(escapeCell).join(',')]
  for (const r of rows) lines.push(headers.map((h) => escapeCell(r[h])).join(','))
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
