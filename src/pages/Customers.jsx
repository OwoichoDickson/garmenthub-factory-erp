import { UserSquare } from 'lucide-react'
import ResourcePage from '../components/ResourcePage'
import { entities } from '../api/schema'

export default function Customers() {
  return (
    <ResourcePage config={entities.customers} icon={UserSquare} subtitle="Wholesale & retail customers" />
  )
}
