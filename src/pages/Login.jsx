import { useState } from 'react'
import { Scissors, Loader2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await signIn(form.email, form.password)
        if (error) throw error
      } else {
        const { error } = await signUp(form.email, form.password, form.fullName)
        if (error) throw error
        setInfo('Account created. If email confirmation is enabled, check your inbox — otherwise sign in now.')
        setMode('signin')
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-canvas p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-white shadow-glass">
            <Scissors size={26} />
          </div>
          <h1 className="mt-4 text-xl font-extrabold text-slate-100">GarmentHub</h1>
          <p className="text-sm text-slate-500">Enugu Fashion &amp; Garment Hub — Factory ERP</p>
        </div>

        <form onSubmit={submit} className="glass-card space-y-4 p-6">
          <div className="flex rounded-lg bg-slate-900/60 p-1 text-sm">
            {['signin', 'signup'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); setInfo('') }}
                className={`flex-1 rounded-md py-1.5 font-medium transition ${
                  mode === m ? 'bg-accent text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          {mode === 'signup' && (
            <div>
              <label className="label">Full name</label>
              <input className="input" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Jane Doe" />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@factory.ng" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required minLength={6} className="input" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" />
          </div>

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300 ring-1 ring-red-500/30">{error}</p>}
          {info && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 ring-1 ring-emerald-500/30">{info}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>

          {mode === 'signup' && (
            <p className="text-center text-[11px] text-slate-500">
              The first account created becomes the Administrator.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
