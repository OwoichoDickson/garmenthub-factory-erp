import { Shirt } from 'lucide-react'
import ResourcePage from '../components/ResourcePage'
import { entities } from '../api/schema'

export default function FinishedProducts() {
  return (
    <ResourcePage
      config={entities.finished_products}
      icon={Shirt}
      subtitle="Finished goods ready for sale"
    />
  )
}
