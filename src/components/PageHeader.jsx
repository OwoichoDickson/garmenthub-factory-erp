export default function PageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent/20">
            <Icon size={22} />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
