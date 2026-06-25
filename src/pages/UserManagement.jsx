import { useEffect, useState } from 'react'
import { ShieldCheck, Loader2, Check } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { table } from '../api/db'
import { useAuth } from '../auth/AuthContext'
import { ROLE_LABELS, NAV, canAccess } from '../auth/roles'
import { fmtDate } from '../lib/format'

const ROLES = Object.keys(ROLE_LABELS)
const rolesOf = (u) => (u.roles?.length ? u.roles : u.role ? [u.role] : [])

export default function UserManagement() {
  const { user, refreshProfile } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const rows = await table('profiles').list({ order: 'created_at', ascending: true })
      setProfiles(rows)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  // Add or remove a single role from a user's role set.
  const toggleRole = async (u, role) => {
    const current = rolesOf(u)
    const next = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role]
    if (next.length === 0) {
      setError('A user must have at least one role.')
      return
    }
    setSavingId(u.id)
    setError('')
    try {
      // roles is the source of truth; role mirrors the first for compatibility.
      await table('profiles').update(u.id, { roles: next, role: next[0] })
      setProfiles((p) => p.map((x) => (x.id === u.id ? { ...x, roles: next, role: next[0] } : x)))
      if (u.id === user?.id) await refreshProfile()
    } catch (e) {
      setError(e.message)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="fade-in">
      <PageHeader title="Users & Roles" icon={ShieldCheck} subtitle="Assign one or more roles per user — access is the combination of all their roles" />

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/30">{error}</p>}

      <div className="glass-card mb-8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Assigned Roles (click to toggle)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {loading ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500"><Loader2 className="mx-auto animate-spin" /></td></tr>
              ) : profiles.map((u) => {
                const isSelf = u.id === user?.id
                const userRoles = rolesOf(u)
                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 align-top">
                    <td className="px-5 py-4 font-medium text-slate-200">
                      {u.full_name || '—'} {isSelf && <span className="text-xs text-slate-500">(you)</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-400">{u.email}</td>
                    <td className="px-5 py-4 text-slate-400">{fmtDate(u.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {ROLES.map((r) => {
                          const on = userRoles.includes(r)
                          return (
                            <button
                              key={r}
                              disabled={isSelf || savingId === u.id}
                              onClick={() => toggleRole(u, r)}
                              className={`chip transition disabled:opacity-60 ${
                                on
                                  ? 'bg-accent/20 text-accent ring-1 ring-accent/40'
                                  : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                              }`}
                            >
                              {on && <Check size={12} />}
                              {ROLE_LABELS[r]}
                            </button>
                          )
                        })}
                        {savingId === u.id && <Loader2 size={15} className="ml-1 animate-spin text-slate-400" />}
                      </div>
                      {isSelf && <p className="mt-1.5 text-[11px] text-slate-500">You can't change your own roles</p>}
                    </td>
                  </tr>
                )
              })}
              {!loading && profiles.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role access guide */}
      <h2 className="mb-3 text-sm font-semibold text-slate-300">Role Access Guide</h2>
      <p className="mb-3 text-xs text-slate-500">A user with several roles can see every page any of those roles unlocks.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROLES.map((role) => {
          const pages = NAV.filter((n) => canAccess(role, n.key))
          return (
            <div key={role} className="glass-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-slate-200">{ROLE_LABELS[role]}</span>
                <StatusBadge value={pages.length >= NAV.length ? 'active' : 'partial'} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pages.map((p) => (
                  <span key={p.key} className="chip bg-slate-800/70 text-slate-400">{p.label}</span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
