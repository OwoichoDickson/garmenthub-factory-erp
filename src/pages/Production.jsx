import { Factory, CheckCircle2, Loader, AlertTriangle } from 'lucide-react'
import ResourcePage from '../components/ResourcePage'
import KPICard from '../components/KPICard'
import { entities } from '../api/schema'

export default function Production() {
  return (
    <ResourcePage
      config={entities.production_orders}
      icon={Factory}
      subtitle="Track production orders across stages"
      kpis={(rows, filtered) => {
        const by = (s) => filtered.filter((r) => r.status === s).length
        return (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KPICard label="Total Orders" value={filtered.length} icon={Factory} theme="blue" />
            <KPICard label="Completed" value={by('completed')} icon={CheckCircle2} theme="green" />
            <KPICard label="In Progress" value={by('in_progress')} icon={Loader} theme="amber" />
            <KPICard label="Delayed" value={by('delayed')} icon={AlertTriangle} theme="red" />
          </div>
        )
      }}
    />
  )
}
