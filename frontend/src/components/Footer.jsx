import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-black/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-2xl">🐉</span>
              <span className="gradient-text text-xl font-black tracking-wider">DRAGON</span>
            </div>
            <p className="text-sm text-gray-500">
              The ultimate gaming competition platform. Compete, win, and dominate the leaderboards.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Platform
            </h4>
            <ul className="space-y-2">
              {[
                { to: '/competitions', label: 'Competitions' },
                { to: '/register', label: 'Join Now' },
                { to: '/login', label: 'Sign In' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-500 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Status */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Status
            </h4>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <span className="text-sm text-gray-500">All systems operational</span>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/5 pt-6 text-center">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} DRAGON Gaming. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
