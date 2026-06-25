import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Eye, Factory, CalendarRange, Timer, Package, Shirt,
  ArrowLeftRight, BookOpen, Users, CalendarCheck, ShoppingCart, UserSquare,
  Truck, Wallet, Zap, BarChart3, ShieldCheck, ChevronDown, LogOut, Scissors, Upload,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { navForRoles, ROLE_LABELS } from '../auth/roles'
import ShiftIndicator from './ShiftIndicator'

const ICONS = {
  LayoutDashboard, Eye, Factory, CalendarRange, Timer, Package, Shirt,
  ArrowLeftRight, BookOpen, Users, CalendarCheck, ShoppingCart, UserSquare,
  Truck, Wallet, Zap, BarChart3, ShieldCheck, Upload,
}

function groupBy(items) {
  const out = []
  const idx = {}
  for (const it of items) {
    if (!(it.group in idx)) {
      idx[it.group] = out.length
      out.push({ group: it.group, items: [] })
    }
    out[idx[it.group]].items.push(it)
  }
  return out
}

export default function Sidebar({ onNavigate }) {
  const { profile, roles, signOut } = useAuth()
  const groups = groupBy(navForRoles(roles))
  const roleLabel = roles.length ? roles.map((r) => ROLE_LABELS[r] || r).join(', ') : '—'
  const [collapsed, setCollapsed] = useState({})
  const toggle = (g) => setCollapsed((c) => ({ ...c, [g]: !c[g] }))

  const initials = (profile?.full_name || profile?.email || '?')
    .split(/[ @.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-800 bg-panel">
      {/* Branding */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-white shadow-glass">
          <Scissors size={20} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-extrabold tracking-tight text-slate-100">GarmentHub</p>
          <p className="text-[11px] font-medium text-slate-500">Factory ERP</p>
        </div>
      </div>

      <ShiftIndicator />

      {/* Nav */}
      <nav className="flex-1 space-y-3 overflow-y-auto px-3 pb-4">
        {groups.map(({ group, items }) => (
          <div key={group}>
            <button
              onClick={() => toggle(group)}
              className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
            >
              {group}
              <ChevronDown
                size={13}
                className={`transition ${collapsed[group] ? '-rotate-90' : ''}`}
              />
            </button>
            {!collapsed[group] && (
              <div className="mt-1 space-y-0.5">
                {items.map((item) => {
                  const Icon = ICONS[item.icon] || LayoutDashboard
                  return (
                    <NavLink
                      key={item.key}
                      to={item.path}
                      end={item.path === '/'}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                          isActive
                            ? 'bg-accent/15 font-medium text-accent ring-1 ring-accent/20'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`
                      }
                    >
                      <Icon size={17} />
                      {item.label}
                    </NavLink>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-slate-900/50 p-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
            {initials || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">
              {profile?.full_name || profile?.email || 'User'}
            </p>
            <p className="truncate text-[11px] text-slate-500" title={roleLabel}>{roleLabel}</p>
          </div>
          <button
            onClick={signOut}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-red-400"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
        <p className="mt-2.5 text-center text-[10px] text-slate-600">
          Powered by <span className="font-semibold text-slate-500">Vantix Innovations</span>&trade;
        </p>
      </div>
    </aside>
  )
}
