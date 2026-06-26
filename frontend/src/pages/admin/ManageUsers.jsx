import { useState, useEffect, useCallback } from 'react'
import { listUsers, toggleUserAdmin, toggleUserActive } from '../../api/admin'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 25

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toggling, setToggling] = useState({})

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      }
      if (search) params.search = search
      const res = await listUsers(params)
      const d = res.data
      if (Array.isArray(d)) {
        setUsers(d)
        setTotal(d.length)
      } else {
        setUsers(d.items || d.users || [])
        setTotal(d.total || 0)
      }
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search])

  const handleToggle = async (userId, field, currentValue) => {
    const key = `${userId}-${field}`
    setToggling((prev) => ({ ...prev, [key]: true }))
    try {
      let res
      if (field === 'is_admin') {
        res = await toggleUserAdmin(userId, !currentValue)
      } else {
        res = await toggleUserActive(userId, !currentValue)
      }
      const updated = res.data
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)))
    } catch {
      alert('Failed to update user.')
    } finally {
      setToggling((prev) => ({ ...prev, [key]: false }))
    }
  }

  function Toggle({ userId, field, value, label }) {
    const key = `${userId}-${field}`
    const busy = toggling[key]
    return (
      <button
        onClick={() => handleToggle(userId, field, value)}
        disabled={busy}
        title={`${value ? 'Revoke' : 'Grant'} ${label}`}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
          value ? 'bg-dragon-purple' : 'bg-white/10'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-4' : 'translate-x-1'
          }`}
        />
      </button>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage platform users — toggle admin and active status
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {total > 0 && `${total.toLocaleString()} users`}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSearch(searchInput)
          }}
          className="relative max-w-sm"
        >
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by username or email…"
            className="input-dark w-full pl-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearch('') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              ✕
            </button>
          )}
        </form>
      </div>

      <ErrorMessage message={error} className="mb-4" />

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <>
          <div className="surface-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/5 bg-black/20">
                    {['User', 'Email', 'Joined', 'Admin', 'Active'].map((h) => (
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
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-gray-500">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/3"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dragon-purple/20 text-xs font-bold text-dragon-purple">
                              {(u.display_name || u.username || 'U')
                                .split(' ')
                                .map((w) => w[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">
                                {u.display_name || u.username}
                              </div>
                              <div className="text-xs text-gray-500">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">{u.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Toggle
                            userId={u.id}
                            field="is_admin"
                            value={u.is_admin}
                            label="admin"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Toggle
                            userId={u.id}
                            field="is_active"
                            value={u.is_active !== false}
                            label="active"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="mt-6"
          />
        </>
      )}
    </div>
  )
}
