/**
 * Navigation + role-based access. The sidebar renders NAV filtered through
 * canAccess(role, key); pages also guard themselves via <RequireAccess>.
 */

export const ROLE_LABELS = {
  admin: 'Administrator',
  factory_admin: 'Factory Admin',
  manager: 'Manager',
  director: 'Director',
  supervisor: 'Supervisor',
  office_admin: 'Office Admin',
  storekeeper: 'Storekeeper',
  floor_assistant: 'Floor Assistant',
}

export const FULL_ACCESS_ROLES = ['admin', 'factory_admin', 'manager']

// page key -> { path, label, icon (lucide name), group }
export const NAV = [
  { key: 'dashboard', path: '/', label: 'Dashboard', icon: 'LayoutDashboard', group: 'Overview' },
  { key: 'director', path: '/DirectorDashboard', label: "Director's View", icon: 'Eye', group: 'Overview' },

  { key: 'production', path: '/Production', label: 'Production', icon: 'Factory', group: 'Production' },
  { key: 'daily', path: '/DailyProduction', label: 'Daily Production', icon: 'ClipboardList', group: 'Production' },
  { key: 'weekly', path: '/WeeklyTracker', label: 'Weekly Tracker', icon: 'CalendarRange', group: 'Production' },
  { key: 'hourly', path: '/HourlyTracker', label: 'Hourly Tracker', icon: 'Timer', group: 'Production' },

  { key: 'raw', path: '/RawMaterials', label: 'Raw Materials', icon: 'Package', group: 'Inventory' },
  { key: 'finished', path: '/FinishedProducts', label: 'Finished Products', icon: 'Shirt', group: 'Inventory' },
  { key: 'movements', path: '/StockMovements', label: 'Stock Movements', icon: 'ArrowLeftRight', group: 'Inventory' },
  { key: 'bin', path: '/BinBook', label: 'Bin Book', icon: 'BookOpen', group: 'Inventory' },

  { key: 'workers', path: '/Workers', label: 'Workers', icon: 'Users', group: 'Workforce' },
  { key: 'attendance', path: '/Attendance', label: 'Attendance', icon: 'CalendarCheck', group: 'Workforce' },

  { key: 'sales', path: '/Sales', label: 'Sales / POS', icon: 'ShoppingCart', group: 'Commerce' },
  { key: 'customers', path: '/Customers', label: 'Customers', icon: 'UserSquare', group: 'Commerce' },
  { key: 'suppliers', path: '/Suppliers', label: 'Suppliers', icon: 'Truck', group: 'Commerce' },

  { key: 'finances', path: '/Finances', label: 'Finances', icon: 'Wallet', group: 'Operations' },
  { key: 'power', path: '/PowerOutage', label: 'Power Outage', icon: 'Zap', group: 'Operations' },
  { key: 'reports', path: '/Reports', label: 'Reports', icon: 'BarChart3', group: 'Operations' },

  { key: 'import', path: '/ImportCenter', label: 'Import Center', icon: 'Upload', group: 'Admin' },
  { key: 'users', path: '/UserManagement', label: 'Users & Roles', icon: 'ShieldCheck', group: 'Admin' },
]

// Per-role access. '*' = every page. Otherwise an explicit allow-list of keys.
const ACCESS = {
  admin: '*',
  factory_admin: '*',
  manager: '*',
  director: ['director'],
  supervisor: ['production', 'daily', 'weekly'],
  office_admin: ['workers', 'attendance', 'power'],
  storekeeper: ['raw', 'finished', 'movements', 'suppliers', 'power', 'bin', 'daily'],
  floor_assistant: ['daily', 'weekly', 'hourly'],
}

export function canAccess(role, key) {
  const allowed = ACCESS[role]
  if (!allowed) return false
  if (allowed === '*') return true
  return allowed.includes(key)
}

export function navForRole(role) {
  return NAV.filter((item) => canAccess(role, item.key))
}

// Landing page for a role (first page it can see).
export function homePathForRole(role) {
  const first = navForRole(role)[0]
  return first ? first.path : '/'
}

// ---- Multi-role helpers (access is the union of all assigned roles) ----
const asArray = (roles) => (Array.isArray(roles) ? roles : roles ? [roles] : [])

export function canAccessAny(roles, key) {
  return asArray(roles).some((r) => canAccess(r, key))
}

export function isFullAccess(roles) {
  return asArray(roles).some((r) => FULL_ACCESS_ROLES.includes(r))
}

export function navForRoles(roles) {
  return NAV.filter((item) => canAccessAny(roles, item.key))
}

export function homePathForRoles(roles) {
  const first = navForRoles(roles)[0]
  return first ? first.path : '/'
}
