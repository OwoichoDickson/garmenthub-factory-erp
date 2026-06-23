import { Truck } from 'lucide-react'
import ResourcePage from '../components/ResourcePage'
import { entities } from '../api/schema'

export default function Suppliers() {
  return (
    <ResourcePage config={entities.suppliers} icon={Truck} subtitle="Fabric & material suppliers" />
  )
}
