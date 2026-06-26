import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    setDropdownOpen(false)
    navigate('/')
  }

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-dragon-purple' : 'text-gray-400 hover:text-white'
    }`

  const initials = user
    ? (user.display_name || user.username || 'U')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : ''

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl transition-transform group-hover:scale-110">🐉</span>
            <span className="gradient-text text-xl font-black tracking-wider">DRAGON</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 md:flex">
            <NavLink to="/competitions" className={navLinkClass}>
              Competitions
            </NavLink>
            {user && (
              <NavLink to="/profile" className={navLinkClass}>
                Profile
              </NavLink>
            )}
            {user?.is_admin && (
              <NavLink to="/admin" className={navLinkClass}>
                Admin
              </NavLink>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm transition-colors hover:border-dragon-purple/40"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-dragon-purple/20 text-xs font-bold text-dragon-purple">
                    {initials}
                  </div>
                  <span className="hidden text-gray-300 sm:block">
                    {user.display_name || user.username}
                  </span>
                  <span className="text-gray-600">{dropdownOpen ? '▲' : '▼'}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-dragon-navy shadow-2xl shadow-black/50">
                    <div className="border-b border-white/5 px-4 py-3">
                      <p className="text-sm font-medium text-white">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      {user.is_admin && (
                        <span className="mt-1 inline-block rounded-full bg-dragon-purple/20 px-2 py-0.5 text-xs text-dragon-purple">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        My Profile
                      </Link>
                      {user.is_admin && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full px-4 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary py-1.5 text-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary py-1.5 text-sm">
                  Join Now
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="rounded-lg border border-white/10 p-2 text-gray-400 transition-colors hover:text-white md:hidden"
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-white/5 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <NavLink
                to="/competitions"
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                Competitions
              </NavLink>
              {user && (
                <NavLink
                  to="/profile"
                  className={navLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  Profile
                </NavLink>
              )}
              {user?.is_admin && (
                <NavLink
                  to="/admin"
                  className={navLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  Admin
                </NavLink>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
