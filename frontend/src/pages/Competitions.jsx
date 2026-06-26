import { useState, useEffect, useCallback } from 'react'
import { listCompetitions } from '../api/competitions'
import CompetitionCard from '../components/CompetitionCard'
import Pagination from '../components/Pagination'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const PAGE_SIZE = 20

function SkeletonCard() {
  return (
    <div className="surface-card overflow-hidden animate-pulse">
      <div className="h-36 bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-1/3 rounded bg-white/5" />
        <div className="h-4 w-3/4 rounded bg-white/5" />
        <div className="h-6 w-1/4 rounded bg-white/5" />
        <div className="h-3 w-1/2 rounded bg-white/5" />
      </div>
    </div>
  )
}

export default function Competitions() {
  const [competitions, setCompetitions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const fetchCompetitions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      }
      if (status) params.status = status
      if (search) params.search = search

      const res = await listCompetitions(params)
      const data = res.data
      if (Array.isArray(data)) {
        setCompetitions(data)
        setTotal(data.length)
      } else {
        setCompetitions(data.items || data.competitions || [])
        setTotal(data.total || 0)
      }
    } catch (err) {
      setError('Failed to load competitions. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [page, status, search])

  useEffect(() => {
    fetchCompetitions()
  }, [fetchCompetitions])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [status, search])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  return (
    <div className="min-h-screen py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white">
            <span className="gradient-text">Competitions</span>
          </h1>
          <p className="mt-2 text-gray-500">Find and join sponsored gaming tournaments</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search competitions, games…"
              className="input-dark w-full pl-9"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  setSearch('')
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </form>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input-dark w-full sm:w-48 cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-dragon-navy">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active filters */}
        {(search || status) && (
          <div className="mb-6 flex flex-wrap gap-2">
            {search && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-dragon-purple/30 bg-dragon-purple/10 px-3 py-1 text-xs text-dragon-purple">
                Search: "{search}"
                <button onClick={() => { setSearch(''); setSearchInput('') }} className="hover:text-white">✕</button>
              </span>
            )}
            {status && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-dragon-purple/30 bg-dragon-purple/10 px-3 py-1 text-xs text-dragon-purple capitalize">
                Status: {status}
                <button onClick={() => setStatus('')} className="hover:text-white">✕</button>
              </span>
            )}
          </div>
        )}

        {/* Error */}
        <ErrorMessage message={error} onRetry={fetchCompetitions} className="mb-6" />

        {/* Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : competitions.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {total > 0 && `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} competitions`}
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {competitions.map((comp) => (
                <CompetitionCard key={comp.id || comp.slug} competition={comp} />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              className="mt-10"
            />
          </>
        ) : (
          <div className="py-24 text-center">
            <span className="text-6xl">🎮</span>
            <h3 className="mt-4 text-xl font-semibold text-white">No competitions found</h3>
            <p className="mt-2 text-gray-500">
              {search || status
                ? 'Try adjusting your filters.'
                : 'Check back soon — tournaments are coming!'}
            </p>
            {(search || status) && (
              <button
                onClick={() => { setSearch(''); setSearchInput(''); setStatus('') }}
                className="btn-secondary mt-4"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
