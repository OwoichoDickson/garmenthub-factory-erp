import { ArrowLeftRight } from 'lucide-react'
import ResourcePage from '../components/ResourcePage'
import { entities } from '../api/schema'

export default function StockMovements() {
  return (
    <ResourcePage
      config={entities.stock_movements}
      icon={ArrowLeftRight}
      subtitle="Log of all stock in / out / adjustments"
    />
  )
}
