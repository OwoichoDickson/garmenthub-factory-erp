import { useMemo } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import {
  Eye, Gauge, UserCheck, Trophy, ZapOff, Wallet, TrendingUp, Receipt, Boxes,
  AlertTriangle, PackageX, Clock4, Percent, ShieldAlert, Users, Timer,
  Banknote, CheckCircle2,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import KPICard from '../components/KPICard'
import { ChartCard, ChartTip } from '../components/ChartCard'
import { useCollection } from '../hooks/useCollection'
import { titleCase, num, naira } from '../lib/format'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16']

function SectionTitle({ children }) {
  return <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">{children}</h2>
}

export default function DirectorDashboard() {
  const year = new Date().getFullYear()
  const inYear = (d) => d && new Date(d).getFullYear() === year

  const weekly = useCollection('weekly_production_entries')
  const attendance = useCollection('attendance')
  const outages = useCollection('power_outages')
  const orders = useCollection('production_orders')
  const sales = useCollection('sales_orders')
  const expenses = useCollection('expenses')
  const materials = useCollection('raw_materials')
  const finished = useCollection('finished_products')
  const workers = useCollection('workers')

  // ---------------- Financial ----------------
  const fin = useMemo(() => {
    const ySales = sales.rows.filter((s) => inYear(s.created_at))
    const yExp = expenses.rows.filter((e) => inYear(e.date))
    const revenue = ySales.reduce((s, r) => s + Number(r.total_amount || 0), 0)
    const expense = yExp.reduce((s, r) => s + Number(r.amount || 0), 0)
    const receivables = ySales.reduce((s, r) => s + Math.max(0, Number(r.total_amount || 0) - Number(r.amount_paid || 0)), 0)
    const profit = revenue - expense
    const margin = revenue ? Math.round((profit / revenue) * 100) : 0
    const inventoryValue =
      materials.rows.reduce((s, r) => s + Number(r.quantity || 0) * Number(r.cost_per_unit || 0), 0) +
      finished.rows.reduce((s, r) => s + Number(r.quantity_available || 0) * Number(r.cost_price || 0), 0)
    const monthly = MONTHS.map((m, i) => ({
      month: m,
      revenue: ySales.filter((r) => new Date(r.created_at).getMonth() === i).reduce((s, r) => s + Number(r.total_amount || 0), 0),
      expense: yExp.filter((r) => new Date(r.date).getMonth() === i).reduce((s, r) => s + Number(r.amount || 0), 0),
    }))
    const byCat = {}
    for (const e of yExp) byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount || 0)
    const expensePie = Object.entries(byCat).map(([k, v]) => ({ name: titleCase(k), value: v }))
    return { revenue, expense, profit, margin, receivables, inventoryValue, monthly, expensePie }
  }, [sales.rows, expenses.rows, materials.rows, finished.rows]) // eslint-disable-line

  // ---------------- Production / quality ----------------
  const ops = useMemo(() => {
    const yWeekly = weekly.rows.filter((e) => inYear(e.date))
    let target = 0, output = 0
    const dept = {}
    for (const e of yWeekly) {
      const t = Number(e.target_per_day || 0)
      const o = Number(e.day_output || 0) + Number(e.night_output || 0)
      target += t; output += o
      if (!dept[e.department]) dept[e.department] = { target: 0, output: 0 }
      dept[e.department].target += t; dept[e.department].output += o
    }
    const efficiency = target ? Math.round((output / target) * 100) : 0
    const byDept = Object.entries(dept).map(([k, v]) => ({
      dept: titleCase(k), efficiency: v.target ? Math.round((v.output / v.target) * 100) : 0,
    }))

    const completed = orders.rows.filter((o) => o.status === 'completed').length
    const delayed = orders.rows.filter((o) => o.status === 'delayed').length
    const onTime = completed + delayed ? Math.round((completed / (completed + delayed)) * 100) : 0
    const totDefects = orders.rows.reduce((s, o) => s + Number(o.defects || 0), 0)
    const totOutput = orders.rows.reduce((s, o) => s + Number(o.actual_output || 0), 0)
    const totTarget = orders.rows.reduce((s, o) => s + Number(o.target_quantity || 0), 0)
    const defectRate = totOutput ? +((totDefects / totOutput) * 100).toFixed(1) : 0
    const capacity = totTarget ? Math.round((totOutput / totTarget) * 100) : 0
    const waste = orders.rows.reduce((s, o) => s + Number(o.waste_kg || 0), 0)

    // Estimated units lost to power outages (factory throughput × outage hours)
    const hoursLost = outages.rows.filter((r) => String(r.year) === String(year)).reduce((s, r) => s + Number(r.total_hours || 0), 0)
    const prodDays = new Set(yWeekly.map((e) => e.date)).size
    const hourlyThroughput = prodDays ? output / (prodDays * 8) : 0
    const unitsLost = Math.round(hoursLost * hourlyThroughput)

    return { efficiency, byDept, completed, onTime, defectRate, capacity, waste, hoursLost, unitsLost }
  }, [weekly.rows, orders.rows, outages.rows]) // eslint-disable-line

  // ---------------- Workforce ----------------
  const wf = useMemo(() => {
    const yAtt = attendance.rows.filter((r) => inYear(r.date))
    const present = yAtt.filter((r) => r.status === 'present' || r.status === 'late').length
    const absent = yAtt.filter((r) => r.status === 'absent').length
    const attRate = yAtt.length ? Math.round((present / yAtt.length) * 100) : 0
    const absentRate = yAtt.length ? Math.round((absent / yAtt.length) * 100) : 0
    const overtime = yAtt.reduce((s, r) => s + Number(r.overtime_hours || 0), 0)
    const labourHours = yAtt.reduce((s, r) => s + Number(r.hours_worked || 0), 0)
    const totalUnits = weekly.rows.filter((e) => inYear(e.date)).reduce((s, e) => s + Number(e.day_output || 0) + Number(e.night_output || 0), 0)
    const productivity = labourHours ? +(totalUnits / labourHours).toFixed(1) : 0

    const deptCount = {}
    for (const w of workers.rows.filter((w) => w.status !== 'terminated')) {
      deptCount[w.department || 'unassigned'] = (deptCount[w.department || 'unassigned'] || 0) + 1
    }
    const headcount = Object.entries(deptCount).map(([k, v]) => ({ dept: titleCase(k), count: v }))

    const teamMap = {}
    for (const e of weekly.rows) {
      const name = e.team_or_worker_name || 'Unassigned'
      teamMap[name] = (teamMap[name] || 0) + Number(e.day_output || 0) + Number(e.night_output || 0)
    }
    const topTeams = Object.entries(teamMap).map(([team, output]) => ({ team, output })).sort((a, b) => b.output - a.output).slice(0, 6)
    return { attRate, absentRate, overtime, productivity, headcount, topTeams, active: workers.rows.filter((w) => w.status === 'active').length }
  }, [attendance.rows, weekly.rows, workers.rows]) // eslint-disable-line

  // ---------------- Customers ----------------
  const cust = useMemo(() => {
    const map = {}
    for (const s of sales.rows) {
      const name = s.customer_name || 'Walk-in'
      map[name] = (map[name] || 0) + Number(s.total_amount || 0)
    }
    const ranked = Object.entries(map).map(([name, spent]) => ({ name, spent })).sort((a, b) => b.spent - a.spent)
    const totalRev = ranked.reduce((s, r) => s + r.spent, 0)
    const concentration = totalRev ? Math.round((ranked[0]?.spent / totalRev) * 100) : 0
    return { top: ranked.slice(0, 6), concentration, topName: ranked[0]?.name }
  }, [sales.rows])

  // ---------------- Needs attention ----------------
  const alerts = useMemo(() => {
    const list = []
    const delayed = orders.rows.filter((o) => o.status === 'delayed').length
    if (delayed) list.push({ icon: AlertTriangle, tone: 'red', label: 'Delayed production orders', value: delayed })
    const outStock = materials.rows.filter((r) => r.status === 'out_of_stock' || Number(r.quantity) <= 0).length
    if (outStock) list.push({ icon: PackageX, tone: 'red', label: 'Materials out of stock', value: outStock })
    const lowStock = materials.rows.filter((r) => Number(r.quantity) > 0 && Number(r.quantity) <= Number(r.reorder_level)).length
    if (lowStock) list.push({ icon: Boxes, tone: 'amber', label: 'Materials low on stock', value: lowStock })
    const unpaid = sales.rows.filter((s) => s.payment_status !== 'paid' && Number(s.total_amount || 0) > Number(s.amount_paid || 0))
    if (unpaid.length) {
      const owed = unpaid.reduce((s, r) => s + (Number(r.total_amount || 0) - Number(r.amount_paid || 0)), 0)
      list.push({ icon: Receipt, tone: 'amber', label: 'Unpaid / partial invoices', value: `${unpaid.length} · ${naira(owed)}` })
    }
    const today = new Date().toISOString().slice(0, 10)
    const absentToday = attendance.rows.filter((r) => r.date === today && r.status === 'absent').length
    if (absentToday >= 3) list.push({ icon: Users, tone: 'amber', label: 'Workers absent today', value: absentToday })
    return list
  }, [orders.rows, materials.rows, sales.rows, attendance.rows])

  const TONE = { red: 'text-red-300 bg-red-500/10 ring-red-500/30', amber: 'text-amber-300 bg-amber-500/10 ring-amber-500/30' }

  return (
    <div className="fade-in">
      <PageHeader title="Director's View" icon={Eye} subtitle={`Executive overview · ${year} — read-only`} />

      {/* ---------- Financial ---------- */}
      <SectionTitle>Financial Health</SectionTitle>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Net Profit" value={naira(fin.profit)} hint={`${fin.margin}% margin`} icon={TrendingUp} theme={fin.profit >= 0 ? 'green' : 'red'} />
        <KPICard label="Revenue" value={naira(fin.revenue)} icon={Banknote} theme="blue" />
        <KPICard label="Expenses" value={naira(fin.expense)} icon={Wallet} theme="violet" />
        <KPICard label="Receivables" value={naira(fin.receivables)} hint="owed by customers" icon={Receipt} theme="amber" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Revenue vs Expenses" subtitle="Monthly (₦)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fin.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(v) => `₦${v / 1000}k`} />
              <Tooltip content={<ChartTip fmt={naira} />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Expense Breakdown" subtitle="By category" right={<span className="text-xs text-slate-500">Inventory on hand: {naira(fin.inventoryValue)}</span>}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={fin.expensePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2}>
                {fin.expensePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<ChartTip fmt={naira} />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ---------- Needs attention ---------- */}
      <SectionTitle>Needs Attention</SectionTitle>
      <div className="glass-card p-5">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-300">
            <CheckCircle2 size={18} /> All clear — no outstanding alerts.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.map((a, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ${TONE[a.tone]}`}>
                <a.icon size={18} className="shrink-0" />
                <span className="flex-1 text-sm text-slate-200">{a.label}</span>
                <span className="text-sm font-bold">{a.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------- Operations & quality ---------- */}
      <SectionTitle>Operations &amp; Quality</SectionTitle>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Production Efficiency" value={`${ops.efficiency}%`} icon={Gauge} theme={ops.efficiency >= 80 ? 'green' : 'amber'} />
        <KPICard label="On-time Delivery" value={`${ops.onTime}%`} hint={`${ops.completed} completed`} icon={CheckCircle2} theme={ops.onTime >= 80 ? 'green' : 'amber'} />
        <KPICard label="Defect Rate" value={`${ops.defectRate}%`} icon={Percent} theme={ops.defectRate <= 3 ? 'green' : 'red'} />
        <KPICard label="Capacity Utilisation" value={`${ops.capacity}%`} icon={Gauge} theme="blue" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Material Waste" value={`${ops.waste.toFixed(1)} kg`} icon={Boxes} theme="violet" />
        <KPICard label="Power Hours Lost" value={`${ops.hoursLost.toFixed(0)}h`} icon={ZapOff} theme="red" />
        <KPICard label="Est. Units Lost (power)" value={num(ops.unitsLost)} hint="estimated" icon={Clock4} theme="amber" />
        <KPICard label="Orders Completed" value={ops.completed} icon={Trophy} theme="green" />
      </div>
      <div className="mt-4">
        <ChartCard title="Efficiency by Department" subtitle="Output vs target (%)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ops.byDept}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="dept" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit="%" />
              <Tooltip content={<ChartTip fmt={(v) => `${v}%`} />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
              <Bar dataKey="efficiency" radius={[4, 4, 0, 0]}>
                {ops.byDept.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ---------- Workforce ---------- */}
      <SectionTitle>Workforce</SectionTitle>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Attendance Rate" value={`${wf.attRate}%`} icon={UserCheck} theme="blue" />
        <KPICard label="Absenteeism" value={`${wf.absentRate}%`} icon={Users} theme={wf.absentRate <= 10 ? 'green' : 'amber'} />
        <KPICard label="Overtime Hours" value={`${wf.overtime.toFixed(0)}h`} icon={Timer} theme="violet" />
        <KPICard label="Productivity" value={`${wf.productivity}`} hint="units / labour hour" icon={Gauge} theme="green" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Headcount by Department" subtitle={`${wf.active} active workers`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wf.headcount} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="dept" stroke="#64748b" fontSize={12} tickLine={false} width={80} />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Top Performing Teams" subtitle="Total units produced">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wf.topTeams} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis type="category" dataKey="team" stroke="#64748b" fontSize={12} tickLine={false} width={80} />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
              <Bar dataKey="output" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ---------- Customers ---------- */}
      <SectionTitle>Customers</SectionTitle>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <KPICard
          label="Revenue Concentration"
          value={`${cust.concentration}%`}
          hint={cust.topName ? `from ${cust.topName}` : '—'}
          icon={ShieldAlert}
          theme={cust.concentration >= 50 ? 'red' : 'blue'}
        />
        <div className="glass-card overflow-hidden lg:col-span-2">
          <p className="border-b border-slate-700/60 px-5 py-3 text-sm font-semibold text-slate-200">Top Customers by Spend</p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-800/70">
              {cust.top.map((c, i) => (
                <tr key={c.name} className={i % 2 ? 'bg-slate-900/30' : ''}>
                  <td className="px-5 py-2.5 text-slate-400">#{i + 1}</td>
                  <td className="px-5 py-2.5 font-medium text-slate-200">{c.name}</td>
                  <td className="px-5 py-2.5 text-right text-slate-300">{naira(c.spent)}</td>
                </tr>
              ))}
              {cust.top.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-500">No sales recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
