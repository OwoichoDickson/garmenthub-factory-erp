export function ChartCard({ title, subtitle, children, right }) {
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-200">{title}</p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="h-64">{children}</div>
    </div>
  )
}

export function ChartTip({ active, payload, label, fmt = (v) => v }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-700 bg-panel px-3 py-2 text-xs shadow-glass">
      {label != null && <p className="mb-1 font-medium text-slate-200">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: <span className="font-medium">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  )
}
