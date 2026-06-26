import { useState, useEffect } from 'react'
import {
  listCompetitions,
  createCompetition,
  updateCompetition,
  changeCompetitionStatus,
  declareWinners,
} from '../../api/competitions'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

const STATUS_OPTIONS = ['draft', 'upcoming', 'active', 'completed', 'cancelled']

const EMPTY_FORM = {
  title: '',
  slug: '',
  game: '',
  description: '',
  rules: '',
  prize_pool: '',
  max_participants: '',
  start_date: '',
  end_date: '',
  registration_deadline: '',
  banner_url: '',
  status: 'draft',
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-10 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-dragon-navy shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function CompetitionForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'title' && !initial) {
        next.slug = slugify(value)
      }
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        prize_pool: form.prize_pool ? Number(form.prize_pool) : null,
        max_participants: form.max_participants ? Number(form.max_participants) : null,
      }
      const res = initial?.id
        ? await updateCompetition(initial.id, payload)
        : await createCompetition(payload)
      onSave(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save competition.')
      setLoading(false)
    }
  }

  const field = (label, name, type = 'text', required = false, extra = {}) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-400">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        required={required}
        className="input-dark w-full"
        {...extra}
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorMessage message={error} />
      <div className="grid grid-cols-2 gap-4">
        {field('Title', 'title', 'text', true, { placeholder: 'DRAGON Cup 2026' })}
        {field('Slug', 'slug', 'text', true, { placeholder: 'dragon-cup-2026' })}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('Game', 'game', 'text', false, { placeholder: 'Valorant' })}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-400">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="input-dark w-full cursor-pointer capitalize"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="bg-dragon-navy capitalize">
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-400">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="input-dark w-full resize-none"
          placeholder="Competition overview…"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-400">Rules</label>
        <textarea
          name="rules"
          value={form.rules}
          onChange={handleChange}
          rows={4}
          className="input-dark w-full resize-none"
          placeholder="Competition rules and format…"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('Prize Pool ($)', 'prize_pool', 'number', false, { min: 0, placeholder: '10000' })}
        {field('Max Participants', 'max_participants', 'number', false, { min: 1, placeholder: '256' })}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {field('Start Date', 'start_date', 'datetime-local')}
        {field('End Date', 'end_date', 'datetime-local')}
        {field('Reg. Deadline', 'registration_deadline', 'datetime-local')}
      </div>
      {field('Banner URL', 'banner_url', 'url', false, { placeholder: 'https://…' })}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
          {loading ? 'Saving…' : initial?.id ? 'Update Competition' : 'Create Competition'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  )
}

function DeclareWinnersModal({ competition, onClose, onDone }) {
  const [winners, setWinners] = useState([
    { user_id: '', placement: 1, prize_amount: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addRow = () =>
    setWinners((prev) => [
      ...prev,
      { user_id: '', placement: prev.length + 1, prize_amount: '' },
    ])

  const updateRow = (i, field, value) => {
    setWinners((prev) => prev.map((w, idx) => (idx === i ? { ...w, [field]: value } : w)))
  }

  const removeRow = (i) => setWinners((prev) => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = winners.map((w) => ({
        user_id: Number(w.user_id),
        placement: Number(w.placement),
        prize_amount: w.prize_amount ? Number(w.prize_amount) : null,
      }))
      await declareWinners(competition.id, payload)
      onDone()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to declare winners.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">
        Declare winners for: <strong className="text-white">{competition.title}</strong>
      </p>
      <ErrorMessage message={error} />
      <div className="space-y-3">
        {winners.map((w, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 items-end">
            <div>
              {i === 0 && (
                <label className="mb-1 block text-xs text-gray-500">User ID</label>
              )}
              <input
                type="number"
                value={w.user_id}
                onChange={(e) => updateRow(i, 'user_id', e.target.value)}
                required
                placeholder="User ID"
                className="input-dark w-full"
              />
            </div>
            <div>
              {i === 0 && (
                <label className="mb-1 block text-xs text-gray-500">Placement</label>
              )}
              <input
                type="number"
                value={w.placement}
                onChange={(e) => updateRow(i, 'placement', e.target.value)}
                required
                min={1}
                className="input-dark w-full"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                {i === 0 && (
                  <label className="mb-1 block text-xs text-gray-500">Prize ($)</label>
                )}
                <input
                  type="number"
                  value={w.prize_amount}
                  onChange={(e) => updateRow(i, 'prize_amount', e.target.value)}
                  placeholder="Optional"
                  min={0}
                  className="input-dark w-full"
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-red-400 hover:text-red-300 px-2"
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="text-sm text-dragon-purple hover:text-purple-400 transition-colors"
      >
        + Add winner
      </button>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-amber disabled:opacity-60">
          {loading ? 'Saving…' : 'Declare Winners'}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function ManageCompetitions() {
  const [competitions, setCompetitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) // null | 'create' | 'edit' | 'winners'
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await listCompetitions({ limit: 100 })
      const d = res.data
      setCompetitions(Array.isArray(d) ? d : d.items || [])
    } catch {
      setError('Failed to load competitions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleStatusChange = async (comp, newStatus) => {
    try {
      await changeCompetitionStatus(comp.id, newStatus)
      setCompetitions((prev) =>
        prev.map((c) => (c.id === comp.id ? { ...c, status: newStatus } : c))
      )
    } catch {
      alert('Failed to change status.')
    }
  }

  const handleSaved = (saved) => {
    setCompetitions((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
    setModal(null)
    setSelected(null)
  }

  const handleWinnersDone = () => {
    setModal(null)
    setSelected(null)
    load()
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Competitions</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage all competitions</p>
        </div>
        <button
          onClick={() => { setSelected(null); setModal('create') }}
          className="btn-primary"
        >
          + Create Competition
        </button>
      </div>

      <ErrorMessage message={error} className="mb-4" />

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/5 bg-black/20">
                  {['Title', 'Game', 'Status', 'Prize Pool', 'Participants', 'Start Date', 'Actions'].map((h) => (
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
                {competitions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-500">
                      No competitions yet. Create one!
                    </td>
                  </tr>
                ) : (
                  competitions.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/3"
                    >
                      <td className="px-4 py-3 font-medium text-white max-w-[180px] truncate">
                        {c.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{c.game || '—'}</td>
                      <td className="px-4 py-3">
                        <select
                          value={c.status}
                          onChange={(e) => handleStatusChange(c, e.target.value)}
                          className="rounded border border-white/10 bg-transparent px-2 py-1 text-xs capitalize text-gray-300 cursor-pointer focus:outline-none"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s} className="bg-dragon-navy capitalize">
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-dragon-amber">
                        {c.prize_pool ? `$${Number(c.prize_pool).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {c.registered_count || 0}
                        {c.max_participants ? ` / ${c.max_participants}` : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {c.start_date
                          ? new Date(c.start_date).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelected(c); setModal('edit') }}
                            className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded border border-white/10 hover:border-white/20"
                          >
                            Edit
                          </button>
                          {(c.status === 'completed' || c.status === 'active') && (
                            <button
                              onClick={() => { setSelected(c); setModal('winners') }}
                              className="text-xs text-dragon-amber hover:text-yellow-400 transition-colors px-2 py-1 rounded border border-dragon-amber/30 hover:border-dragon-amber/50"
                            >
                              Winners
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'edit' ? 'Edit Competition' : 'Create Competition'}
          onClose={() => { setModal(null); setSelected(null) }}
        >
          <CompetitionForm
            initial={modal === 'edit' ? selected : null}
            onSave={handleSaved}
            onCancel={() => { setModal(null); setSelected(null) }}
          />
        </Modal>
      )}

      {modal === 'winners' && selected && (
        <Modal title="Declare Winners" onClose={() => { setModal(null); setSelected(null) }}>
          <DeclareWinnersModal
            competition={selected}
            onClose={() => { setModal(null); setSelected(null) }}
            onDone={handleWinnersDone}
          />
        </Modal>
      )}
    </div>
  )
}
