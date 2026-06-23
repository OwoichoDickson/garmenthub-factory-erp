import { useState } from 'react'
import { Scissors, Loader2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 7.9-21l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C39 35.7 44 30.5 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  )
}

export default function Login() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const googleSignIn = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) throw error
      // On success the browser redirects to Google, so no further code runs here.
    } catch (err) {
      setError(err.message || 'Google sign-in failed.')
      setGoogleLoading(false)
    }
  }

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

          <button
            type="button"
            onClick={googleSignIn}
            disabled={googleLoading || loading}
            className="btn w-full border border-slate-700 bg-white text-slate-800 hover:bg-slate-100"
          >
            {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px flex-1 bg-slate-700/60" />
            or use email
            <span className="h-px flex-1 bg-slate-700/60" />
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

        <p className="mt-5 text-center text-[11px] text-slate-600">
          Powered by <span className="font-semibold text-slate-500">Vantix Innovations</span>&trade;
        </p>
      </div>
    </div>
  )
}
