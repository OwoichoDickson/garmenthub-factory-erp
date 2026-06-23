import { ShieldAlert } from 'lucide-react'

export default function AccessDenied({ message }) {
  return (
    <div className="grid min-h-[60vh] place-items-center fade-in">
      <div className="glass-card max-w-md p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/15 text-red-300 ring-1 ring-red-500/30">
          <ShieldAlert size={28} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-100">Access denied</h2>
        <p className="mt-1.5 text-sm text-slate-400">
          {message || "You don't have permission to view this page. Contact an administrator if you think this is a mistake."}
        </p>
      </div>
    </div>
  )
}
