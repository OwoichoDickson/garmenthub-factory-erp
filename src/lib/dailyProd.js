// Shared aggregation for the daily uniform & badge log, so the Daily Production
// page, the Dashboard and the Director's View all compute the same way.
//
// Model: each row is a day's flow. "Ready" and "carried out" accumulate into a
// running balance (Outstanding = Ready − Carried out) for the period. "Awaiting
// badges" is a daily snapshot, so we show the latest. Badges are a daily flow.

const todayISO = () => new Date().toISOString().slice(0, 10)

export function dailyTotals(rows = []) {
  const ready = rows.reduce((s, r) => s + Number(r.uniforms_ready_pickup || 0), 0)
  const carriedOut = rows.reduce((s, r) => s + Number(r.uniforms_carried_out || 0), 0)
  const badges = rows.reduce((s, r) => s + Number(r.badges_produced || 0), 0)
  const badgesToday = rows
    .filter((r) => r.date === todayISO())
    .reduce((s, r) => s + Number(r.badges_produced || 0), 0)
  const latest = [...rows].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
  return {
    ready,
    carriedOut,
    outstanding: Math.max(0, ready - carriedOut),
    awaitingLatest: Number(latest?.uniforms_awaiting_badges || 0),
    badges,
    badgesToday,
  }
}

export const inYear = (rows, year) =>
  rows.filter((r) => r.date && new Date(r.date).getFullYear() === Number(year))
