import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getFeaturedCompetitions } from '../api/competitions'
import { listSponsors } from '../api/sponsors'
import CompetitionCard from '../components/CompetitionCard'
import LoadingSpinner from '../components/LoadingSpinner'

const FEATURES = [
  {
    icon: '🏆',
    title: 'Sponsored Tournaments',
    desc: 'Top brands back our competitions with real prize money and exclusive rewards for winners.',
  },
  {
    icon: '💰',
    title: 'Real Prize Money',
    desc: 'Cash prizes, gaming gear, and exclusive merchandise. Every competition is worth fighting for.',
  },
  {
    icon: '🌍',
    title: 'Global Leaderboard',
    desc: 'Compete against the best players worldwide and cement your name in the DRAGON hall of fame.',
  },
]

function SponsorsMarquee({ sponsors }) {
  if (!sponsors.length) return null

  // Duplicate for seamless loop
  const doubled = [...sponsors, ...sponsors]

  return (
    <div className="overflow-hidden py-2">
      <div className="flex animate-marquee gap-8" style={{ width: 'max-content' }}>
        {doubled.map((s, i) => (
          <div
            key={`${s.id}-${i}`}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 whitespace-nowrap"
          >
            {s.logo_url ? (
              <img src={s.logo_url} alt={s.name} className="h-5 w-5 rounded-full object-cover" />
            ) : (
              <span className="text-dragon-amber">★</span>
            )}
            {s.name}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [sponsors, setSponsors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [compRes, sponsorRes] = await Promise.allSettled([
          getFeaturedCompetitions(),
          listSponsors({ active: true, limit: 20 }),
        ])
        if (compRes.status === 'fulfilled') {
          const data = compRes.value.data
          setFeatured(Array.isArray(data) ? data.slice(0, 3) : (data.items || []).slice(0, 3))
        }
        if (sponsorRes.status === 'fulfilled') {
          const data = sponsorRes.value.data
          setSponsors(Array.isArray(data) ? data : (data.items || []))
        }
      } catch {
        // silently fail — page still renders
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-dragon-purple/20 blur-3xl" />
          <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-dragon-amber/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-64 w-full -translate-x-1/2 bg-gradient-to-t from-dragon-dark to-transparent" />
        </div>

        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-32 text-center sm:px-6 lg:px-8 lg:py-44">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-dragon-purple/30 bg-dragon-purple/10 px-4 py-1.5 text-sm text-dragon-purple">
            <span className="h-2 w-2 animate-pulse rounded-full bg-dragon-purple" />
            Season 2026 Now Live
          </div>

          <h1 className="mb-6 text-6xl font-black leading-none tracking-tight sm:text-7xl lg:text-8xl">
            <span className="gradient-text">COMPETE.</span>
            <br />
            <span className="gradient-text">WIN.</span>
            <br />
            <span className="text-white">DOMINATE.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg text-gray-400">
            Join thousands of players in sponsored gaming tournaments. Climb the ranks, earn prizes,
            and make your mark on the global leaderboard.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/competitions" className="btn-primary px-8 py-3 text-base">
              Browse Competitions
            </Link>
            <Link to="/register" className="btn-secondary px-8 py-3 text-base">
              Join Now — It's Free
            </Link>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-4 sm:max-w-none sm:grid-cols-3">
            {[
              { value: '50K+', label: 'Players' },
              { value: '$500K+', label: 'Prize Money' },
              { value: '200+', label: 'Competitions' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/5 bg-white/3 p-4">
                <div className="text-2xl font-black text-dragon-amber sm:text-3xl">{stat.value}</div>
                <div className="mt-1 text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-white/5 bg-dragon-navy/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-white">Why DRAGON?</h2>
            <p className="text-gray-500">Built for serious competitors who play to win.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-white/5 bg-black/30 p-6 transition-all duration-300 hover:border-dragon-purple/30 hover:shadow-lg hover:shadow-dragon-purple/5"
              >
                <div className="mb-4 text-4xl">{f.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Competitions */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">Featured Competitions</h2>
              <p className="mt-1 text-gray-500">Hottest tournaments happening right now</p>
            </div>
            <Link
              to="/competitions"
              className="text-sm font-medium text-dragon-purple hover:text-purple-400 transition-colors"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" className="py-20" />
          ) : featured.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((comp) => (
                <CompetitionCard key={comp.id || comp.slug} competition={comp} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-dragon-navy/40 py-16 text-center">
              <span className="text-5xl">🎮</span>
              <p className="mt-4 text-gray-500">No competitions live yet — check back soon!</p>
              <Link to="/competitions" className="btn-primary mt-4 inline-block">
                Browse All
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Sponsors Marquee */}
      {sponsors.length > 0 && (
        <section className="border-t border-white/5 bg-dragon-navy/30 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-gray-600">
              Proudly Sponsored By
            </p>
            <SponsorsMarquee sponsors={sponsors} />
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-dragon-purple/30 bg-gradient-to-br from-dragon-purple/20 via-dragon-navy to-dragon-dark p-10 text-center">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-dragon-purple/10 blur-3xl" />
            <h2 className="mb-4 text-3xl font-black text-white">
              Ready to Enter the <span className="gradient-text">Arena?</span>
            </h2>
            <p className="mb-8 text-gray-400">
              Create your free account today and start competing in sponsored tournaments.
            </p>
            <Link to="/register" className="btn-amber px-10 py-3 text-base">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
