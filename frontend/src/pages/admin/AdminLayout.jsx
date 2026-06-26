import { NavLink, Outlet } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/competitions', label: 'Competitions', icon: '🏆' },
  { to: '/admin/sponsors', label: 'Sponsors', icon: '⭐' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
]

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-white/5 bg-dragon-dark">
        <div className="sticky top-0 flex flex-col h-screen">
          <div className="flex items-center gap-2 border-b border-white/5 px-5 py-4">
            <span className="text-xl">🐉</span>
            <div>
              <div className="gradient-text text-sm font-black tracking-wider">DRAGON</div>
              <div className="text-xs text-gray-600">Admin Panel</div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-gray-600">
              Management
            </p>
            <ul className="space-y-1">
              {NAV_ITEMS.map(({ to, label, icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-dragon-purple/20 text-dragon-purple'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <span className="text-base">{icon}</span>
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-white/5 p-3">
            <NavLink
              to="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-white transition-colors"
            >
              ← Back to Site
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-dragon-dark">
        <Outlet />
      </main>
    </div>
  )
}
