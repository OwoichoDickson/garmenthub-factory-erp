import { TrendingUp, TrendingDown } from 'lucide-react'

const THEMES = {
  blue: 'from-blue-500/20 to-blue-500/5 text-blue-300 ring-blue-500/20',
  green: 'from-emerald-500/20 to-emerald-500/5 text-emerald-300 ring-emerald-500/20',
  amber: 'from-amber-500/20 to-amber-500/5 text-amber-300 ring-amber-500/20',
  red: 'from-red-500/20 to-red-500/5 text-red-300 ring-red-500/20',
  violet: 'from-violet-500/20 to-violet-500/5 text-violet-300 ring-violet-500/20',
  slate: 'from-slate-500/20 to-slate-500/5 text-slate-300 ring-slate-500/20',
}

export default function KPICard({ label, value, icon: Icon, theme = 'blue', trend, hint }) {
  const t = THEMES[theme] || THEMES.blue
  return (
    <div className="glass-card p-4 sm:p-5 fade-in">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-100 truncate">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && (
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ring-1 ${t}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {trend != null && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend >= 0 ? (
            <TrendingUp size={14} className="text-emerald-400" />
          ) : (
            <TrendingDown size={14} className="text-red-400" />
          )}
          <span className={trend >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
          <span className="text-slate-500">vs last period</span>
        </div>
      )}
    </div>
  )
}
