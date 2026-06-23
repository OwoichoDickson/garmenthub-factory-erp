import { Timer } from 'lucide-react'
import ResourcePage from '../components/ResourcePage'
import { entities } from '../api/schema'

export default function HourlyTracker() {
  return (
    <ResourcePage
      config={entities.hourly_progress}
      icon={Timer}
      subtitle="Hourly production log per worker"
    />
  )
}
