import { Wallet, TrendingDown, Receipt, Layers } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import ResourcePage from '../components/ResourcePage'
import KPICard from '../components/KPICard'
import { entities } from '../api/schema'
import { naira, titleCase } from '../lib/format'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function chartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-700 bg-panel px-3 py-2 text-xs shadow-glass">
      <p className="font-medium text-slate-200">{label}</p>
      <p className="text-accent">{naira(payload[0].value)}</p>
    </div>
  )
}

export default function Finances() {
  return (
    <ResourcePage
      config={entities.expenses}
      icon={Wallet}
      subtitle="Track and approve factory expenses"
      kpis={(rows, filtered) => {
        const total = filtered.reduce((s, r) => s + Number(r.amount || 0), 0)
        const byCat = {}
        for (const r of filtered) byCat[r.category] = (byCat[r.category] || 0) + Number(r.amount || 0)
        const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]
        const monthly = MONTHS.map((m, i) => ({
          month: m,
          amount: filtered
            .filter((r) => r.date && new Date(r.date).getMonth() === i)
            .reduce((s, r) => s + Number(r.amount || 0), 0),
        }))
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KPICard label="Total Spend" value={naira(total)} icon={TrendingDown} theme="red" />
              <KPICard label="Entries" value={filtered.length} icon={Receipt} theme="blue" />
              <KPICard label="Categories" value={Object.keys(byCat).length} icon={Layers} theme="violet" />
              <KPICard
                label="Top Category"
                value={topCat ? titleCase(topCat[0]) : '—'}
                hint={topCat ? naira(topCat[1]) : ''}
                icon={Wallet}
                theme="amber"
              />
            </div>
            <div className="glass-card p-5">
              <p className="mb-4 text-sm font-semibold text-slate-200">Monthly Expense Summary</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(v) => `₦${v / 1000}k`} />
                    <Tooltip content={chartTooltip} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )
      }}
    />
  )
}
