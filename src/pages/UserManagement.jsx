import { useEffect, useState } from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { table } from '../api/db'
import { useAuth } from '../auth/AuthContext'
import { ROLE_LABELS, NAV, canAccess } from '../auth/roles'
import { fmtDate } from '../lib/format'

const ROLES = Object.keys(ROLE_LABELS)

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

  const changeRole = async (id, role) => {
    setSavingId(id)
    setError('')
    try {
      await table('profiles').update(id, { role })
      setProfiles((p) => p.map((u) => (u.id === id ? { ...u, role } : u)))
      if (id === user?.id) await refreshProfile()
    } catch (e) {
      setError(e.message)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="fade-in">
      <PageHeader title="Users & Roles" icon={ShieldCheck} subtitle="Manage staff access levels" />

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/30">{error}</p>}

      <div className="glass-card mb-8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Current Role</th>
                <th className="px-5 py-3 font-medium">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500"><Loader2 className="mx-auto animate-spin" /></td></tr>
              ) : profiles.map((u) => {
                const isSelf = u.id === user?.id
                return (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-medium text-slate-200">
                      {u.full_name || '—'} {isSelf && <span className="text-xs text-slate-500">(you)</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{u.email}</td>
                    <td className="px-5 py-3 text-slate-400">{fmtDate(u.created_at)}</td>
                    <td className="px-5 py-3"><span className="chip bg-accent/15 text-accent">{ROLE_LABELS[u.role] || u.role}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          className="input w-auto py-1.5"
                          value={u.role}
                          disabled={isSelf || savingId === u.id}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                        {savingId === u.id && <Loader2 size={15} className="animate-spin text-slate-400" />}
                      </div>
                      {isSelf && <p className="mt-1 text-[11px] text-slate-500">Can't change your own role</p>}
                    </td>
                  </tr>
                )
              })}
              {!loading && profiles.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role access guide */}
      <h2 className="mb-3 text-sm font-semibold text-slate-300">Role Access Guide</h2>
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
