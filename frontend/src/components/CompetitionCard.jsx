import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import SponsorBadge from './SponsorBadge'

const GAME_GRADIENTS = {
  default: 'from-dragon-purple/30 to-dragon-navy',
  fps: 'from-red-900/40 to-dragon-navy',
  moba: 'from-blue-900/40 to-dragon-navy',
  racing: 'from-yellow-900/40 to-dragon-navy',
  sports: 'from-green-900/40 to-dragon-navy',
}

function formatPrize(amount) {
  if (!amount && amount !== 0) return 'TBA'
  if (amount >= 1000) return `$${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`
  return `$${amount}`
}

function formatDate(dateStr) {
  if (!dateStr) return 'TBD'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function CompetitionCard({ competition }) {
  const {
    slug,
    title,
    game,
    status,
    prize_pool,
    banner_url,
    sponsor,
    start_date,
    end_date,
    max_participants,
    registered_count,
  } = competition

  const gradient = GAME_GRADIENTS.default
  const spotsLeft = max_participants
    ? max_participants - (registered_count || 0)
    : null
  const isFull = spotsLeft !== null && spotsLeft <= 0

  return (
    <Link to={`/competitions/${slug}`} className="group block">
      <div className="surface-card card-hover overflow-hidden border border-white/5 transition-all duration-300 group-hover:border-dragon-purple/40 group-hover:shadow-xl group-hover:shadow-dragon-purple/10">
        {/* Banner */}
        <div className={`relative h-36 bg-gradient-to-br ${gradient} overflow-hidden`}>
          {banner_url ? (
            <img
              src={banner_url}
              alt={title}
              className="h-full w-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl opacity-20">🐉</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dragon-navy via-transparent to-transparent" />
          <div className="absolute left-3 top-3">
            <StatusBadge status={status} />
          </div>
          {game && (
            <div className="absolute right-3 top-3">
              <span className="rounded-full bg-black/50 px-2 py-0.5 text-xs text-gray-300 backdrop-blur-sm">
                {game}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {sponsor && <SponsorBadge sponsor={sponsor} className="mb-2" />}

          <h3 className="mb-1 font-semibold text-white line-clamp-2 group-hover:text-dragon-purple transition-colors">
            {title}
          </h3>

          {/* Prize */}
          <div className="mb-3">
            <span className="text-xl font-bold text-dragon-amber">
              {formatPrize(prize_pool)}
            </span>
            {prize_pool ? (
              <span className="ml-1 text-xs text-gray-500">prize pool</span>
            ) : null}
          </div>

          {/* Dates */}
          <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
            <span>📅</span>
            <span>
              {formatDate(start_date)}
              {end_date && ` → ${formatDate(end_date)}`}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <div className="text-xs text-gray-500">
              {max_participants ? (
                <span className={isFull ? 'text-red-400' : 'text-gray-400'}>
                  {isFull
                    ? 'Full'
                    : `${registered_count || 0} / ${max_participants} players`}
                </span>
              ) : (
                <span>{registered_count || 0} registered</span>
              )}
            </div>
            <span className="text-xs font-medium text-dragon-purple group-hover:text-purple-400 transition-colors">
              View →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
