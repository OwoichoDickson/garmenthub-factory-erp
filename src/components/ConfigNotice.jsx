import { Scissors, Database } from 'lucide-react'

export default function ConfigNotice() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas p-6">
      <div className="glass-card max-w-lg p-8">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-white">
            <Scissors size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">GarmentHub — Factory ERP</h1>
            <p className="text-xs text-slate-500">Supabase not configured</p>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <Database size={20} className="mt-0.5 shrink-0 text-amber-300" />
          <div className="text-sm text-amber-100">
            <p className="font-medium">Connect your Supabase project to continue.</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-amber-100/80">
              <li>Create a project at <span className="font-mono">supabase.com</span></li>
              <li>Run <span className="font-mono">supabase/schema.sql</span> in the SQL editor</li>
              <li>Copy <span className="font-mono">.env.example</span> → <span className="font-mono">.env</span></li>
              <li>Fill in <span className="font-mono">VITE_SUPABASE_URL</span> and <span className="font-mono">VITE_SUPABASE_ANON_KEY</span></li>
              <li>Restart the dev server</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
