import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { isSupabaseConfigured } from './lib/supabase'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { canAccess, homePathForRole } from './auth/roles'

import ConfigNotice from './components/ConfigNotice'
import Layout from './components/Layout'
import AccessDenied from './components/AccessDenied'
import Login from './pages/Login'

import Dashboard from './pages/Dashboard'
import DirectorDashboard from './pages/DirectorDashboard'
import Production from './pages/Production'
import WeeklyTracker from './pages/WeeklyTracker'
import HourlyTracker from './pages/HourlyTracker'
import RawMaterials from './pages/RawMaterials'
import FinishedProducts from './pages/FinishedProducts'
import StockMovements from './pages/StockMovements'
import BinBook from './pages/BinBook'
import Workers from './pages/Workers'
import Attendance from './pages/Attendance'
import Sales from './pages/Sales'
import Customers from './pages/Customers'
import Suppliers from './pages/Suppliers'
import Finances from './pages/Finances'
import PowerOutage from './pages/PowerOutage'
import Reports from './pages/Reports'
import ImportCenter from './pages/ImportCenter'
import UserManagement from './pages/UserManagement'

function Spinner() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas">
      <Loader2 className="animate-spin text-accent" size={32} />
    </div>
  )
}

// Route-level access guard.
function Guard({ pageKey, children }) {
  const { role } = useAuth()
  return canAccess(role, pageKey) ? children : <AccessDenied />
}

// Index route: dashboard for those who can see it, else their first allowed page.
function RoleHome() {
  const { role } = useAuth()
  if (canAccess(role, 'dashboard')) return <Dashboard />
  return <Navigate to={homePathForRole(role)} replace />
}

const ROUTES = [
  { path: '/DirectorDashboard', key: 'director', el: <DirectorDashboard /> },
  { path: '/Production', key: 'production', el: <Production /> },
  { path: '/WeeklyTracker', key: 'weekly', el: <WeeklyTracker /> },
  { path: '/HourlyTracker', key: 'hourly', el: <HourlyTracker /> },
  { path: '/RawMaterials', key: 'raw', el: <RawMaterials /> },
  { path: '/FinishedProducts', key: 'finished', el: <FinishedProducts /> },
  { path: '/StockMovements', key: 'movements', el: <StockMovements /> },
  { path: '/BinBook', key: 'bin', el: <BinBook /> },
  { path: '/Workers', key: 'workers', el: <Workers /> },
  { path: '/Attendance', key: 'attendance', el: <Attendance /> },
  { path: '/Sales', key: 'sales', el: <Sales /> },
  { path: '/Customers', key: 'customers', el: <Customers /> },
  { path: '/Suppliers', key: 'suppliers', el: <Suppliers /> },
  { path: '/Finances', key: 'finances', el: <Finances /> },
  { path: '/PowerOutage', key: 'power', el: <PowerOutage /> },
  { path: '/Reports', key: 'reports', el: <Reports /> },
  { path: '/ImportCenter', key: 'import', el: <ImportCenter /> },
  { path: '/UserManagement', key: 'users', el: <UserManagement /> },
]

function Shell() {
  const { loading, session } = useAuth()
  if (loading) return <Spinner />
  if (!session) return <Login />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<RoleHome />} />
        {ROUTES.map((r) => (
          <Route key={r.path} path={r.path} element={<Guard pageKey={r.key}>{r.el}</Guard>} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  if (!isSupabaseConfigured) return <ConfigNotice />
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  )
}
