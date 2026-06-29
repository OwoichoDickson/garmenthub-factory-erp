import { ClipboardList, PackageCheck, Truck, Hourglass, BadgeCheck } from 'lucide-react'
import ResourcePage from '../components/ResourcePage'
import KPICard from '../components/KPICard'
import { entities } from '../api/schema'
import { num } from '../lib/format'
import { dailyTotals } from '../lib/dailyProd'

export default function DailyProduction() {
  return (
    <ResourcePage
      config={entities.daily_production}
      icon={ClipboardList}
      subtitle="Daily uniform & badge production — net outstanding after carry-out"
      kpis={(rows, filtered) => {
        // Running balance over the filtered period (year / date range).
        const t = dailyTotals(filtered)
        return (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KPICard label="Outstanding for Pickup" value={num(t.outstanding)} hint={`${num(t.ready)} ready − ${num(t.carriedOut)} carried out`} icon={PackageCheck} theme={t.outstanding > 0 ? 'green' : 'slate'} />
            <KPICard label="Carried Out (period)" value={num(t.carriedOut)} hint="collected / dispatched" icon={Truck} theme="blue" />
            <KPICard label="Awaiting Badges" value={num(t.awaitingLatest)} hint="latest count" icon={Hourglass} theme="amber" />
            <KPICard label="Badges Produced (period)" value={num(t.badges)} hint={`${num(t.badgesToday)} today`} icon={BadgeCheck} theme="violet" />
          </div>
        )
      }}
    />
  )
}
