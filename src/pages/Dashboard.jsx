import { useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  Users, CalendarCheck, Factory, AlertTriangle, Activity,
  PackageCheck, Hourglass, BadgeCheck,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import KPICard from '../components/KPICard'
import { ChartCard, ChartTip } from '../components/ChartCard'
import { useCollection } from '../hooks/useCollection'
import { useAuth } from '../auth/AuthContext'
import { currentShift, SHIFTS, titleCase, fmtDate } from '../lib/format'

const today = () => new Date().toISOString().slice(0, 10)

export default function Dashboard() {
  const { profile } = useAuth()
  const workers = useCollection('workers')
  const attendance = useCollection('attendance')
  const orders = useCollection('production_orders')
  const materials = useCollection('raw_materials')
  const weekly = useCollection('weekly_production_entries')
  const daily = useCollection('daily_production')

  const shift = SHIFTS[currentShift()]
  const todayAttendance = attendance.rows.filter((r) => r.date === today())
  const present = todayAttendance.filter((r) => r.status === 'present' || r.status === 'late').length
  const activeOrders = orders.rows.filter((r) => r.status === 'in_progress' || r.status === 'pending').length
  const lowStock = materials.rows.filter((r) => Number(r.quantity) <= Number(r.reorder_level)).length

  // Daily uniform & badge production — latest queue state + today's badges
  const dailyMetrics = useMemo(() => {
    const sorted = [...daily.rows].sort((a, b) => new Date(b.date) - new Date(a.date))
    const latest = sorted[0]
    const badgesToday = daily.rows
      .filter((r) => r.date === today())
      .reduce((s, r) => s + Number(r.badges_produced || 0), 0)
    return {
      readyPickup: Number(latest?.uniforms_ready_pickup || 0),
      awaitingBadges: Number(latest?.uniforms_awaiting_badges || 0),
      badgesToday,
    }
  }, [daily.rows])

  // Attendance trend — last 7 days present count
  const trend = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      days.push({
        day: d.toLocaleDateString('en-NG', { weekday: 'short' }),
        present: attendance.rows.filter((r) => r.date === iso && (r.status === 'present' || r.status === 'late')).length,
      })
    }
    return days
  }, [attendance.rows])

  // Production output by department (weekly entries: day + night)
  const byDept = useMemo(() => {
    const m = {}
    for (const e of weekly.rows) {
      const out = Number(e.day_output || 0) + Number(e.night_output || 0)
      m[e.department] = (m[e.department] || 0) + out
    }
    return Object.entries(m).map(([k, v]) => ({ dept: titleCase(k), output: v }))
  }, [weekly.rows])

  // Recent activity feed
  const activity = useMemo(() => {
    const items = [
      ...orders.rows.map((r) => ({ t: r.created_at, text: `Production order ${r.order_number} — ${titleCase(r.status)}`, tag: 'Production' })),
      ...attendance.rows.map((r) => ({ t: r.created_at, text: `${r.worker_name} marked ${r.status}`, tag: 'Attendance' })),
      ...materials.rows.filter((r) => r.status !== 'in_stock').map((r) => ({ t: r.updated_at, text: `${r.fabric_type} is ${titleCase(r.status)}`, tag: 'Inventory' })),
    ].filter((i) => i.t).sort((a, b) => new Date(b.t) - new Date(a.t)).slice(0, 8)
    return items
  }, [orders.rows, attendance.rows, materials.rows])

  return (
    <div className="fade-in">
      <PageHeader
        title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}`}
        subtitle={`${shift.label} shift · ${shift.window}`}
        icon={Activity}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Total Workers" value={workers.rows.length} icon={Users} theme="blue" hint={`${workers.rows.filter((w) => w.status === 'active').length} active`} />
        <KPICard label="Today's Attendance" value={present} icon={CalendarCheck} theme="green" hint={`${todayAttendance.length} marked`} />
        <KPICard label="Active Orders" value={activeOrders} icon={Factory} theme="violet" />
        <KPICard label="Low Stock Materials" value={lowStock} icon={AlertTriangle} theme="amber" />
      </div>

      {/* Uniform & badge production (daily) */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Uniform &amp; Badge Production</h2>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard label="Uniforms Ready for Pickup" value={dailyMetrics.readyPickup} icon={PackageCheck} theme="green" hint="latest count" />
        <KPICard label="Uniforms Awaiting Badges" value={dailyMetrics.awaitingBadges} icon={Hourglass} theme="amber" hint="latest count" />
        <KPICard label="Badges Produced Today" value={dailyMetrics.badgesToday} icon={BadgeCheck} theme="blue" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Attendance Trend" subtitle="Present workers — last 7 days">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="present" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Production Output" subtitle="Units produced by department">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDept}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="dept" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
              <Bar dataKey="output" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="glass-card p-5">
        <p className="mb-4 text-sm font-semibold text-slate-200">Recent Activity</p>
        {activity.length === 0 ? (
          <p className="text-sm text-slate-500">No recent activity.</p>
        ) : (
          <ul className="space-y-3">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                <span className="flex-1 text-sm text-slate-300">{a.text}</span>
                <span className="chip bg-slate-800/70 text-slate-400">{a.tag}</span>
                <span className="hidden text-xs text-slate-600 sm:block">{fmtDate(a.t)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
