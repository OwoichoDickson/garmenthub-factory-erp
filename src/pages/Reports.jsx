import { useMemo, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { ChartCard, ChartTip } from '../components/ChartCard'
import { useCollection } from '../hooks/useCollection'
import { titleCase, naira, yearsRange } from '../lib/format'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16']

export default function Reports() {
  const weekly = useCollection('weekly_production_entries')
  const attendance = useCollection('attendance')
  const expenses = useCollection('expenses')

  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const years = useMemo(
    () => yearsRange([...weekly.rows, ...attendance.rows, ...expenses.rows], ['date']),
    [weekly.rows, attendance.rows, expenses.rows],
  )

  const hasRange = Boolean(from || to)
  // A record is included if it falls in the date range (when set), else in the
  // selected year (or any year when "All years").
  const included = (d) => {
    if (!d) return false
    const x = new Date(d)
    if (hasRange) {
      if (from && x < new Date(from)) return false
      if (to && x > new Date(to)) return false
      return true
    }
    return year === 'all' || x.getFullYear() === Number(year)
  }

  const production = useMemo(() => MONTHS.map((m, i) => ({
    month: m,
    output: weekly.rows
      .filter((e) => e.date && new Date(e.date).getMonth() === i && included(e.date))
      .reduce((s, e) => s + Number(e.day_output || 0) + Number(e.night_output || 0), 0),
  })), [weekly.rows, year, from, to]) // eslint-disable-line

  const attendanceRate = useMemo(() => MONTHS.map((m, i) => {
    const rows = attendance.rows.filter((r) => r.date && new Date(r.date).getMonth() === i && included(r.date))
    const present = rows.filter((r) => r.status === 'present' || r.status === 'late').length
    return { month: m, rate: rows.length ? Math.round((present / rows.length) * 100) : 0 }
  }), [attendance.rows, year, from, to]) // eslint-disable-line

  const expenseBreakdown = useMemo(() => {
    const m = {}
    for (const e of expenses.rows) {
      if (!included(e.date)) continue
      m[e.category] = (m[e.category] || 0) + Number(e.amount || 0)
    }
    return Object.entries(m).map(([k, v]) => ({ name: titleCase(k), value: v }))
  }, [expenses.rows, year, from, to]) // eslint-disable-line

  return (
    <div className="fade-in">
      <PageHeader title="Reports" icon={BarChart3} subtitle="Consolidated production, workforce & finance analytics" />

      <div className="glass-card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="label">Year</label>
          <select className="input w-auto" value={year} onChange={(e) => setYear(e.target.value)} disabled={hasRange}>
            <option value="all">All years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="label">From</label>
          <input type="date" className="input w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        {hasRange
          ? <button className="btn-ghost" onClick={() => { setFrom(''); setTo('') }}>Clear range</button>
          : <span className="pb-2 text-xs text-slate-500">Set a From/To to override the year</span>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Production Trend" subtitle="Monthly output (units)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={production}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
              <Bar dataKey="output" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Attendance Rate" subtitle="Monthly % present">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendanceRate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit="%" />
              <Tooltip content={<ChartTip fmt={(v) => `${v}%`} />} />
              <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Expense Breakdown" subtitle="By category">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2}>
                {expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<ChartTip fmt={naira} />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Output vs Attendance" subtitle="Correlation by month">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={production.map((p, i) => ({ month: p.month, output: p.output, rate: attendanceRate[i].rate }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Line type="monotone" dataKey="output" name="Output" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="rate" name="Attendance %" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
