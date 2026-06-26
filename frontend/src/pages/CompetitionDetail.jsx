import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getCompetitionBySlug } from '../api/competitions'
import { registerForCompetition, withdrawFromCompetition } from '../api/registrations'
import useAuthStore from '../store/authStore'
import StatusBadge from '../components/StatusBadge'
import SponsorBadge from '../components/SponsorBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

function formatDate(dateStr) {
  if (!dateStr) return 'TBD'
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatPrize(amount) {
  if (!amount && amount !== 0) return 'TBA'
  return `$${Number(amount).toLocaleString()}`
}

function PlacementBadge({ placement }) {
  const map = { 1: '🥇', 2: '🥈', 3: '🥉' }
  return (
    <span>
      {map[placement] || `#${placement}`}
    </span>
  )
}

export default function CompetitionDetail() {
  const { slug } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [competition, setCompetition] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regMessage, setRegMessage] = useState({ type: '', text: '' })
  const [isRegistered, setIsRegistered] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await getCompetitionBySlug(slug)
        setCompetition(res.data)
        setIsRegistered(res.data.user_registered || false)
      } catch {
        setError('Competition not found or failed to load.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  const handleRegister = async () => {
    if (!user) {
      navigate(`/login?returnUrl=/competitions/${slug}`)
      return
    }
    setRegLoading(true)
    setRegMessage({ type: '', text: '' })
    try {
      if (isRegistered) {
        await withdrawFromCompetition(competition.id)
        setIsRegistered(false)
        setRegMessage({ type: 'success', text: 'Successfully withdrawn from the competition.' })
        setCompetition((prev) => ({
          ...prev,
          registered_count: Math.max(0, (prev.registered_count || 1) - 1),
        }))
      } else {
        await registerForCompetition(competition.id)
        setIsRegistered(true)
        setRegMessage({ type: 'success', text: "You're registered! Good luck!" })
        setCompetition((prev) => ({
          ...prev,
          registered_count: (prev.registered_count || 0) + 1,
        }))
      }
    } catch (err) {
      setRegMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Action failed. Please try again.',
      })
    } finally {
      setRegLoading(false)
    }
  }

  if (loading) return <LoadingSpinner size="xl" className="min-h-screen" />
  if (error || !competition) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <span className="text-6xl">😵</span>
        <p className="text-gray-400">{error || 'Competition not found.'}</p>
        <Link to="/competitions" className="btn-secondary">Back to Competitions</Link>
      </div>
    )
  }

  const {
    title, game, status, prize_pool, banner_url, sponsor, start_date, end_date,
    registration_deadline, max_participants, registered_count, rules, description,
    winners,
  } = competition

  const deadlinePassed = registration_deadline
    ? new Date(registration_deadline) < new Date()
    : false
  const isFull = max_participants && registered_count >= max_participants
  const isCompleted = status === 'completed'
  const isCancelled = status === 'cancelled'

  const canRegister = user && !deadlinePassed && !isFull && !isCompleted && !isCancelled
  const regButtonDisabled = !canRegister || regLoading

  const regButtonLabel = () => {
    if (isCancelled) return 'Cancelled'
    if (isCompleted) return 'Competition Ended'
    if (deadlinePassed) return 'Registration Closed'
    if (isFull) return 'Competition Full'
    if (!user) return 'Sign In to Register'
    if (isRegistered) return regLoading ? 'Withdrawing…' : 'Withdraw Registration'
    return regLoading ? 'Registering…' : 'Register Now'
  }

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        {banner_url ? (
          <img
            src={banner_url}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-dragon-purple/30 via-dragon-navy to-dragon-dark flex items-center justify-center">
            <span className="text-8xl opacity-20">🐉</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dragon-dark via-dragon-dark/50 to-transparent" />
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          to="/competitions"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-white transition-colors"
        >
          ← Back to Competitions
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Title area */}
            <div className="mb-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={status} />
                {game && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-400">
                    {game}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black text-white sm:text-4xl">{title}</h1>
              {sponsor && <SponsorBadge sponsor={sponsor} size="md" className="mt-3" />}
            </div>

            {/* Description */}
            {description && (
              <div className="mb-8">
                <p className="leading-relaxed text-gray-400">{description}</p>
              </div>
            )}

            {/* Rules */}
            {rules && (
              <div className="mb-8">
                <h2 className="mb-4 text-xl font-bold text-white">Rules & Format</h2>
                <div className="surface-card p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-400">
                    {rules}
                  </pre>
                </div>
              </div>
            )}

            {/* Winners */}
            {isCompleted && winners && winners.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-xl font-bold text-white">🏆 Winners</h2>
                <div className="surface-card overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5 bg-black/20">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Place</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Player</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Prize</th>
                      </tr>
                    </thead>
                    <tbody>
                      {winners.map((w, i) => (
                        <tr key={i} className="border-b border-white/5 last:border-0">
                          <td className="px-4 py-3 text-lg">
                            <PlacementBadge placement={w.placement} />
                          </td>
                          <td className="px-4 py-3 font-medium text-white">
                            {w.username || w.display_name || `User #${w.user_id}`}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-dragon-amber">
                            {w.prize_amount ? formatPrize(w.prize_amount) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Prize Pool */}
            <div className="surface-card p-6 text-center">
              <div className="mb-1 text-sm text-gray-500 uppercase tracking-wider">Prize Pool</div>
              <div className="text-4xl font-black text-dragon-amber">{formatPrize(prize_pool)}</div>
            </div>

            {/* Registration action */}
            <div className="surface-card p-6">
              {regMessage.text && (
                <div
                  className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                    regMessage.type === 'success'
                      ? 'border-green-500/30 bg-green-500/10 text-green-400'
                      : 'border-red-500/30 bg-red-500/10 text-red-400'
                  }`}
                >
                  {regMessage.text}
                </div>
              )}

              {!user && (
                <p className="mb-3 text-xs text-gray-500 text-center">
                  You must be signed in to register.
                </p>
              )}

              <button
                onClick={canRegister || (!user) ? handleRegister : undefined}
                disabled={regButtonDisabled && !!user}
                className={`w-full py-3 text-sm font-semibold rounded-lg transition-all ${
                  isRegistered
                    ? 'border border-red-500/40 text-red-400 hover:bg-red-500/10 active:scale-95'
                    : canRegister || !user
                    ? 'btn-primary'
                    : 'cursor-not-allowed bg-white/5 text-gray-600'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {regButtonLabel()}
              </button>

              {isRegistered && (
                <p className="mt-2 text-center text-xs text-green-500">✓ You are registered</p>
              )}
            </div>

            {/* Details */}
            <div className="surface-card divide-y divide-white/5 p-0">
              {[
                { label: 'Start Date', value: formatDate(start_date) },
                { label: 'End Date', value: formatDate(end_date) },
                {
                  label: 'Reg. Deadline',
                  value: registration_deadline ? formatDate(registration_deadline) : 'Open',
                },
                {
                  label: 'Participants',
                  value: max_participants
                    ? `${registered_count || 0} / ${max_participants}`
                    : `${registered_count || 0} registered`,
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-white text-right max-w-[60%]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
