import { ClipboardList, PackageCheck, Hourglass, BadgeCheck } from 'lucide-react'
import ResourcePage from '../components/ResourcePage'
import KPICard from '../components/KPICard'
import { entities } from '../api/schema'
import { num } from '../lib/format'

const today = () => new Date().toISOString().slice(0, 10)

export default function DailyProduction() {
  return (
    <ResourcePage
      config={entities.daily_production}
      icon={ClipboardList}
      subtitle="Daily uniform & badge production log"
      kpis={(rows, filtered) => {
        // Most recent entry = current queue state; today's row drives "produced today".
        const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date))
        const latest = sorted[0]
        const todays = filtered.filter((r) => r.date === today())
        const badgesToday = todays.reduce((s, r) => s + Number(r.badges_produced || 0), 0)
        const badgesTotal = filtered.reduce((s, r) => s + Number(r.badges_produced || 0), 0)
        return (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KPICard label="Ready for Pickup" value={num(latest?.uniforms_ready_pickup || 0)} hint="latest count" icon={PackageCheck} theme="green" />
            <KPICard label="Awaiting Badges" value={num(latest?.uniforms_awaiting_badges || 0)} hint="latest count" icon={Hourglass} theme="amber" />
            <KPICard label="Badges Produced Today" value={num(badgesToday)} icon={BadgeCheck} theme="blue" />
            <KPICard label="Badges Produced (total)" value={num(badgesTotal)} icon={BadgeCheck} theme="violet" />
          </div>
        )
      }}
    />
  )
}
