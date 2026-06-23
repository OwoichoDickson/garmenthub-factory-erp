import { Users, UserCheck, UserMinus, UserX } from 'lucide-react'
import ResourcePage from '../components/ResourcePage'
import KPICard from '../components/KPICard'
import { entities } from '../api/schema'

export default function Workers() {
  return (
    <ResourcePage
      config={entities.workers}
      icon={Users}
      subtitle="Manage factory workforce records"
      kpis={(rows) => {
        const by = (s) => rows.filter((r) => r.status === s).length
        return (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KPICard label="Total Workers" value={rows.length} icon={Users} theme="blue" />
            <KPICard label="Active" value={by('active')} icon={UserCheck} theme="green" />
            <KPICard label="On Leave" value={by('on_leave')} icon={UserMinus} theme="amber" />
            <KPICard label="Terminated" value={by('terminated')} icon={UserX} theme="red" />
          </div>
        )
      }}
    />
  )
}
