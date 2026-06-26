import { useState, useEffect } from 'react'
import { listSponsors, createSponsor, updateSponsor, deleteSponsor } from '../../api/sponsors'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

const EMPTY_FORM = {
  name: '',
  website: '',
  logo_url: '',
  description: '',
  is_active: true,
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-dragon-navy shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl">
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function SponsorForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = initial?.id
        ? await updateSponsor(initial.id, form)
        : await createSponsor(form)
      onSave(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save sponsor.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorMessage message={error} />
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-400">
          Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Acme Corp"
          className="input-dark w-full"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-400">Website</label>
        <input
          type="url"
          name="website"
          value={form.website}
          onChange={handleChange}
          placeholder="https://acme.com"
          className="input-dark w-full"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-400">Logo URL</label>
        <input
          type="url"
          name="logo_url"
          value={form.logo_url}
          onChange={handleChange}
          placeholder="https://…/logo.png"
          className="input-dark w-full"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-400">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="input-dark w-full resize-none"
          placeholder="Brief sponsor description…"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          checked={form.is_active}
          onChange={handleChange}
          className="h-4 w-4 rounded border-white/20 accent-dragon-purple"
        />
        <label htmlFor="is_active" className="text-sm text-gray-400">
          Active (shown on site)
        </label>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
          {loading ? 'Saving…' : initial?.id ? 'Update Sponsor' : 'Create Sponsor'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function ManageSponsors() {
  const [sponsors, setSponsors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) // null | 'create' | 'edit'
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await listSponsors({ limit: 100 })
      const d = res.data
      setSponsors(Array.isArray(d) ? d : d.items || [])
    } catch {
      setError('Failed to load sponsors.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSaved = (saved) => {
    setSponsors((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id)
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

  const handleDelete = async (sponsor) => {
    if (!window.confirm(`Delete sponsor "${sponsor.name}"?`)) return
    setDeleting(sponsor.id)
    try {
      await deleteSponsor(sponsor.id)
      setSponsors((prev) => prev.filter((s) => s.id !== sponsor.id))
    } catch {
      alert('Failed to delete sponsor.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Sponsors</h1>
          <p className="mt-1 text-sm text-gray-500">Manage platform sponsors</p>
        </div>
        <button
          onClick={() => { setSelected(null); setModal('create') }}
          className="btn-primary"
        >
          + Add Sponsor
        </button>
      </div>

      <ErrorMessage message={error} className="mb-4" />

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <div className="surface-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-black/20">
                {['Sponsor', 'Website', 'Status', 'Actions'].map((h) => (
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
              {sponsors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-gray-500">
                    No sponsors yet.
                  </td>
                </tr>
              ) : (
                sponsors.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/3"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {s.logo_url ? (
                          <img
                            src={s.logo_url}
                            alt={s.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dragon-amber/20 text-sm text-dragon-amber">
                            ★
                          </div>
                        )}
                        <span className="font-medium text-white">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {s.website ? (
                        <a
                          href={s.website}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-white transition-colors"
                        >
                          {s.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          s.is_active
                            ? 'border-green-500/30 bg-green-500/10 text-green-400'
                            : 'border-gray-500/30 bg-gray-500/10 text-gray-500'
                        }`}
                      >
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelected(s); setModal('edit') }}
                          className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded border border-white/10 hover:border-white/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          disabled={deleting === s.id}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded border border-red-500/20 hover:border-red-500/40 disabled:opacity-50"
                        >
                          {deleting === s.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'edit' ? 'Edit Sponsor' : 'Add Sponsor'}
          onClose={() => { setModal(null); setSelected(null) }}
        >
          <SponsorForm
            initial={modal === 'edit' ? selected : null}
            onSave={handleSaved}
            onCancel={() => { setModal(null); setSelected(null) }}
          />
        </Modal>
      )}
    </div>
  )
}
