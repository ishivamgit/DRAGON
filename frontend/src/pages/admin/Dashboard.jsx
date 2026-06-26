import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAdminStats } from '../../api/admin'
import { listCompetitions } from '../../api/competitions'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatusBadge from '../../components/StatusBadge'

function StatCard({ label, value, icon, color = 'purple', change }) {
  const colors = {
    purple: 'from-dragon-purple/20 to-transparent border-dragon-purple/20',
    amber: 'from-dragon-amber/20 to-transparent border-dragon-amber/20',
    green: 'from-green-500/20 to-transparent border-green-500/20',
    blue: 'from-blue-500/20 to-transparent border-blue-500/20',
  }
  const textColors = {
    purple: 'text-dragon-purple',
    amber: 'text-dragon-amber',
    green: 'text-green-400',
    blue: 'text-blue-400',
  }
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-5 ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`mt-1 text-3xl font-black ${textColors[color]}`}>{value ?? '—'}</p>
          {change !== undefined && (
            <p className="mt-1 text-xs text-gray-600">{change}</p>
          )}
        </div>
        <span className="text-2xl opacity-60">{icon}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, compRes] = await Promise.allSettled([
          getAdminStats(),
          listCompetitions({ limit: 5, sort: 'created_at:desc' }),
        ])
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
        if (compRes.status === 'fulfilled') {
          const d = compRes.value.data
          setRecent(Array.isArray(d) ? d.slice(0, 5) : (d.items || []).slice(0, 5))
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Platform overview and key metrics</p>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <>
          {/* Stats grid */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Users"
              value={stats?.total_users?.toLocaleString()}
              icon="👥"
              color="purple"
            />
            <StatCard
              label="Active Competitions"
              value={stats?.active_competitions}
              icon="🏆"
              color="amber"
            />
            <StatCard
              label="Total Registrations"
              value={stats?.total_registrations?.toLocaleString()}
              icon="📋"
              color="green"
            />
            <StatCard
              label="Prize Pool Distributed"
              value={
                stats?.prize_distributed != null
                  ? `$${Number(stats.prize_distributed).toLocaleString()}`
                  : '—'
              }
              icon="💰"
              color="blue"
            />
          </div>

          {/* Quick links */}
          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            {[
              { to: '/admin/competitions', label: 'Manage Competitions', icon: '🏆' },
              { to: '/admin/sponsors', label: 'Manage Sponsors', icon: '⭐' },
              { to: '/admin/users', label: 'Manage Users', icon: '👥' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 p-4 transition-colors hover:border-dragon-purple/30 hover:bg-dragon-purple/5"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium text-gray-300">{item.label}</span>
                <span className="ml-auto text-gray-600">→</span>
              </Link>
            ))}
          </div>

          {/* Recent competitions */}
          {recent.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-white">Recent Competitions</h2>
                <Link
                  to="/admin/competitions"
                  className="text-sm text-dragon-purple hover:text-purple-400 transition-colors"
                >
                  View all →
                </Link>
              </div>
              <div className="surface-card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-black/20">
                      {['Title', 'Game', 'Status', 'Prize Pool', 'Participants'].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((c, i) => (
                      <tr
                        key={c.id || i}
                        className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/3"
                      >
                        <td className="px-4 py-3 font-medium text-white">{c.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{c.game || '—'}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-dragon-amber">
                          {c.prize_pool ? `$${Number(c.prize_pool).toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {c.registered_count || 0}
                          {c.max_participants ? ` / ${c.max_participants}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
