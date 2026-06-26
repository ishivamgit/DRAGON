import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyRegistrations } from '../api/registrations'
import { updateMe } from '../api/users'
import useAuthStore from '../store/authStore'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

function Avatar({ user, size = 'lg' }) {
  const initials = (user.display_name || user.username || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sizes = {
    lg: 'h-20 w-20 text-2xl',
    md: 'h-12 w-12 text-base',
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-dragon-purple to-purple-800 font-bold text-white ${sizes[size]}`}
    >
      {initials}
    </div>
  )
}

function EditProfileForm({ user, onSave, onCancel }) {
  const [form, setForm] = useState({
    display_name: user.display_name || '',
    bio: user.bio || '',
    country: user.country || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await updateMe(form)
      onSave(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorMessage message={error} />
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-400">Display Name</label>
        <input
          type="text"
          name="display_name"
          value={form.display_name}
          onChange={handleChange}
          className="input-dark w-full"
          maxLength={50}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-400">Bio</label>
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          rows={3}
          className="input-dark w-full resize-none"
          maxLength={300}
          placeholder="Tell the arena about yourself…"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-400">Country</label>
        <input
          type="text"
          name="country"
          value={form.country}
          onChange={handleChange}
          className="input-dark w-full"
          maxLength={60}
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const [registrations, setRegistrations] = useState([])
  const [regLoading, setRegLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyRegistrations()
        const data = res.data
        setRegistrations(Array.isArray(data) ? data : data.items || [])
      } catch {
        // silently fail
      } finally {
        setRegLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = (updatedUser) => {
    setUser(updatedUser)
    setEditing(false)
  }

  if (!user) return null

  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile card */}
          <div className="lg:col-span-1">
            <div className="surface-card p-6">
              <div className="mb-4 flex flex-col items-center text-center">
                <Avatar user={user} size="lg" />
                <h2 className="mt-4 text-xl font-bold text-white">
                  {user.display_name || user.username}
                </h2>
                <p className="text-sm text-gray-500">@{user.username}</p>
                {user.is_admin && (
                  <span className="mt-2 rounded-full bg-dragon-purple/20 px-2.5 py-0.5 text-xs text-dragon-purple">
                    Admin
                  </span>
                )}
              </div>

              {!editing && (
                <>
                  {user.bio && (
                    <p className="mb-4 text-center text-sm text-gray-400 leading-relaxed">
                      {user.bio}
                    </p>
                  )}

                  <div className="space-y-2 border-t border-white/5 pt-4 text-sm">
                    {user.country && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>🌍</span>
                        <span>{user.country}</span>
                      </div>
                    )}
                    {user.email && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>✉️</span>
                        <span className="truncate">{user.email}</span>
                      </div>
                    )}
                    {joinedDate && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>📅</span>
                        <span>Joined {joinedDate}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setEditing(true)}
                    className="btn-secondary mt-4 w-full text-sm"
                  >
                    Edit Profile
                  </button>
                </>
              )}

              {editing && (
                <div className="border-t border-white/5 pt-4">
                  <h3 className="mb-4 font-semibold text-white">Edit Profile</h3>
                  <EditProfileForm user={user} onSave={handleSave} onCancel={() => setEditing(false)} />
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="surface-card p-4 text-center">
                <div className="text-2xl font-black text-dragon-amber">{registrations.length}</div>
                <div className="text-xs text-gray-500 mt-1">Competitions</div>
              </div>
              <div className="surface-card p-4 text-center">
                <div className="text-2xl font-black text-dragon-purple">
                  {registrations.filter((r) => r.placement === 1).length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Wins 🏆</div>
              </div>
            </div>
          </div>

          {/* My Competitions */}
          <div className="lg:col-span-2">
            <h3 className="mb-4 text-xl font-bold text-white">My Competitions</h3>

            {regLoading ? (
              <LoadingSpinner className="py-12" />
            ) : registrations.length > 0 ? (
              <div className="space-y-3">
                {registrations.map((reg, i) => (
                  <div
                    key={reg.id || i}
                    className="surface-card flex items-center justify-between p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/competitions/${reg.competition?.slug || reg.competition_id}`}
                          className="font-medium text-white hover:text-dragon-purple transition-colors truncate"
                        >
                          {reg.competition?.title || `Competition #${reg.competition_id}`}
                        </Link>
                        <StatusBadge status={reg.competition?.status} />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {reg.competition?.game && `${reg.competition.game} · `}
                        Registered{' '}
                        {reg.registered_at
                          ? new Date(reg.registered_at).toLocaleDateString()
                          : ''}
                      </div>
                    </div>
                    <div className="ml-4 text-right shrink-0">
                      {reg.placement ? (
                        <div>
                          <span className="text-lg">
                            {reg.placement === 1
                              ? '🥇'
                              : reg.placement === 2
                              ? '🥈'
                              : reg.placement === 3
                              ? '🥉'
                              : `#${reg.placement}`}
                          </span>
                          {reg.prize_amount && (
                            <div className="text-xs text-dragon-amber">
                              +${Number(reg.prize_amount).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="surface-card py-16 text-center">
                <span className="text-5xl">🎮</span>
                <p className="mt-4 text-gray-500">You haven't joined any competitions yet.</p>
                <Link to="/competitions" className="btn-primary mt-4 inline-block">
                  Browse Competitions
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
