import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { Eye, Gauge, UserCheck, Trophy, ZapOff } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import KPICard from '../components/KPICard'
import { ChartCard, ChartTip } from '../components/ChartCard'
import { useCollection } from '../hooks/useCollection'
import { titleCase, num } from '../lib/format'

export default function DirectorDashboard() {
  const weekly = useCollection('weekly_production_entries')
  const attendance = useCollection('attendance')
  const outages = useCollection('power_outages')
  const orders = useCollection('production_orders')

  const year = new Date().getFullYear()

  const { efficiency, byDept } = useMemo(() => {
    const yEntries = weekly.rows.filter((e) => e.date && new Date(e.date).getFullYear() === year)
    let target = 0, output = 0
    const dept = {}
    for (const e of yEntries) {
      const t = Number(e.target_per_day || 0)
      const o = Number(e.day_output || 0) + Number(e.night_output || 0)
      target += t; output += o
      if (!dept[e.department]) dept[e.department] = { target: 0, output: 0 }
      dept[e.department].target += t; dept[e.department].output += o
    }
    return {
      efficiency: target ? Math.round((output / target) * 100) : 0,
      byDept: Object.entries(dept).map(([k, v]) => ({
        dept: titleCase(k), efficiency: v.target ? Math.round((v.output / v.target) * 100) : 0,
      })),
    }
  }, [weekly.rows]) // eslint-disable-line

  const attRate = useMemo(() => {
    const total = attendance.rows.length
    const present = attendance.rows.filter((r) => r.status === 'present' || r.status === 'late').length
    return total ? Math.round((present / total) * 100) : 0
  }, [attendance.rows])

  const topTeams = useMemo(() => {
    const m = {}
    for (const e of weekly.rows) {
      const name = e.team_or_worker_name || 'Unassigned'
      m[name] = (m[name] || 0) + Number(e.day_output || 0) + Number(e.night_output || 0)
    }
    return Object.entries(m).map(([team, output]) => ({ team, output })).sort((a, b) => b.output - a.output).slice(0, 6)
  }, [weekly.rows])

  const hoursLost = outages.rows
    .filter((r) => String(r.year) === String(year))
    .reduce((s, r) => s + Number(r.total_hours || 0), 0)

  const completed = orders.rows.filter((r) => r.status === 'completed').length

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']

  return (
    <div className="fade-in">
      <PageHeader title="Director's View" icon={Eye} subtitle={`Executive overview · ${year} — read-only`} />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Production Efficiency" value={`${efficiency}%`} icon={Gauge} theme={efficiency >= 80 ? 'green' : 'amber'} />
        <KPICard label="Attendance Rate" value={`${attRate}%`} icon={UserCheck} theme="blue" />
        <KPICard label="Orders Completed" value={completed} icon={Trophy} theme="violet" />
        <KPICard label="Power Hours Lost" value={`${hoursLost.toFixed(0)}h`} icon={ZapOff} theme="red" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Efficiency by Department" subtitle="Output vs target (%)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDept}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="dept" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit="%" />
              <Tooltip content={<ChartTip fmt={(v) => `${v}%`} />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
              <Bar dataKey="efficiency" radius={[4, 4, 0, 0]}>
                {byDept.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Performing Teams" subtitle="Total units produced">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topTeams} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis type="category" dataKey="team" stroke="#64748b" fontSize={12} tickLine={false} width={80} />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
              <Bar dataKey="output" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="glass-card overflow-hidden">
        <p className="border-b border-slate-700/60 px-5 py-4 text-sm font-semibold text-slate-200">Team Performance Summary</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/60 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">Rank</th>
              <th className="px-5 py-3 font-medium">Team / Worker</th>
              <th className="px-5 py-3 font-medium">Total Output</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {topTeams.map((t, i) => (
              <tr key={t.team} className={i % 2 ? 'bg-slate-900/30' : ''}>
                <td className="px-5 py-3 text-slate-400">#{i + 1}</td>
                <td className="px-5 py-3 font-medium text-slate-200">{t.team}</td>
                <td className="px-5 py-3 text-slate-300">{num(t.output)} units</td>
              </tr>
            ))}
            {topTeams.length === 0 && (
              <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-500">No production data yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
