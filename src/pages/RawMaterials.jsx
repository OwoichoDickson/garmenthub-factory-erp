import { Package, AlertTriangle, PackageX, Boxes } from 'lucide-react'
import ResourcePage from '../components/ResourcePage'
import KPICard from '../components/KPICard'
import { entities } from '../api/schema'

export default function RawMaterials() {
  return (
    <ResourcePage
      config={entities.raw_materials}
      icon={Package}
      subtitle="Fabric & raw material inventory — low stock highlighted"
      kpis={(rows, filtered) => {
        const low = filtered.filter((r) => Number(r.quantity) <= Number(r.reorder_level)).length
        const out = filtered.filter((r) => r.status === 'out_of_stock').length
        return (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KPICard label="Total Materials" value={filtered.length} icon={Boxes} theme="blue" />
            <KPICard label="In Stock" value={filtered.filter((r) => r.status === 'in_stock').length} icon={Package} theme="green" />
            <KPICard label="Low Stock" value={low} icon={AlertTriangle} theme="amber" />
            <KPICard label="Out of Stock" value={out} icon={PackageX} theme="red" />
          </div>
        )
      }}
    />
  )
}
