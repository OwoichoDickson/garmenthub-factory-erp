import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { titleCase } from './format'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** Landscape A4 export of all weekly entries for a year, grouped by month with totals. */
export function exportWeeklyPDF(entries, year) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  doc.setFontSize(16); doc.setTextColor('#0f172a')
  doc.text('GarmentHub — Weekly Production Report', 14, 16)
  doc.setFontSize(10); doc.setTextColor('#475569')
  doc.text(`Year: ${year}`, 14, 23)

  const yearEntries = entries
    .filter((e) => e.date && new Date(e.date).getFullYear() === Number(year))
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  let startY = 30

  MONTHS.forEach((monthName, mIdx) => {
    const monthEntries = yearEntries.filter((e) => new Date(e.date).getMonth() === mIdx)
    if (!monthEntries.length) return

    const body = monthEntries.map((e) => {
      const total = Number(e.day_output || 0) + Number(e.night_output || 0)
      return [
        new Date(e.date).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' }),
        titleCase(e.department || ''),
        e.team_or_worker_name || '',
        titleCase(e.product_type || ''),
        e.style_description || '',
        e.target_per_day || 0,
        e.day_output || 0,
        e.night_output || 0,
        total,
      ]
    })

    const totals = monthEntries.reduce(
      (acc, e) => {
        acc.target += Number(e.target_per_day || 0)
        acc.day += Number(e.day_output || 0)
        acc.night += Number(e.night_output || 0)
        return acc
      },
      { target: 0, day: 0, night: 0 },
    )
    body.push([
      { content: `${monthName} totals`, colSpan: 5, styles: { fontStyle: 'bold', halign: 'right' } },
      { content: totals.target, styles: { fontStyle: 'bold' } },
      { content: totals.day, styles: { fontStyle: 'bold' } },
      { content: totals.night, styles: { fontStyle: 'bold' } },
      { content: totals.day + totals.night, styles: { fontStyle: 'bold' } },
    ])

    autoTable(doc, {
      startY,
      head: [[`${monthName} ${year}`, 'Dept', 'Team/Worker', 'Product', 'Style', 'Target', 'Day', 'Night', 'Total']],
      body,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      margin: { left: 14, right: 14 },
    })
    startY = doc.lastAutoTable.finalY + 8
    if (startY > doc.internal.pageSize.getHeight() - 25) { doc.addPage(); startY = 20 }
  })

  if (!yearEntries.length) {
    doc.setFontSize(11); doc.setTextColor('#64748b')
    doc.text('No entries for this year.', 14, 40)
  }

  // Footer: page numbers + timestamp
  const pages = doc.internal.getNumberOfPages()
  const stamp = `Generated ${new Date().toLocaleString('en-NG')}`
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8); doc.setTextColor('#94a3b8')
    doc.text(stamp, 14, doc.internal.pageSize.getHeight() - 8)
    doc.text(`Page ${i} of ${pages}`, W - 30, doc.internal.pageSize.getHeight() - 8)
  }

  doc.save(`weekly-production-${year}.pdf`)
}
