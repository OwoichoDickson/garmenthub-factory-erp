import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { currentShift, SHIFTS } from '../lib/format'

const DOT = { morning: 'bg-amber-400', afternoon: 'bg-blue-400', night: 'bg-violet-400' }

export default function ShiftIndicator() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const key = currentShift(now)
  const shift = SHIFTS[key]

  return (
    <div className="mx-3 mb-4 rounded-xl border border-slate-700/50 bg-slate-900/50 p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span className={`h-2 w-2 rounded-full ${DOT[key]} animate-pulse`} />
          {shift.label} Shift
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <Clock size={12} />
          {now.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">{shift.window}</p>
    </div>
  )
}
