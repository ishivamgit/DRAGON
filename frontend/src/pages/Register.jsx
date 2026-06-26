import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerApi } from '../api/auth'
import useAuthStore from '../store/authStore'
import ErrorMessage from '../components/ErrorMessage'

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    display_name: '',
    country: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registerApi(form)
      // Auto-login after registration
      const result = await login(form.email, form.password)
      if (result.success) {
        navigate('/competitions', { replace: true })
      } else {
        navigate('/login')
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          (Array.isArray(err.response?.data)
            ? err.response.data[0]?.msg
            : null) ||
          'Registration failed. Please try again.'
      )
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/3 top-1/4 h-64 w-64 rounded-full bg-dragon-purple/10 blur-3xl" />
        <div className="absolute right-1/3 bottom-1/4 h-48 w-48 rounded-full bg-dragon-amber/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-4xl">🐉</span>
            <span className="gradient-text text-3xl font-black tracking-wider">DRAGON</span>
          </Link>
          <p className="mt-2 text-gray-500">Create your account and start competing</p>
        </div>

        <div className="surface-card p-8">
          <h2 className="mb-6 text-xl font-bold text-white">Create Account</h2>

          <ErrorMessage message={error} className="mb-4" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-400">
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  placeholder="dragonslayer99"
                  className="input-dark w-full"
                  autoComplete="username"
                  minLength={3}
                  maxLength={30}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-400">
                  Display Name
                </label>
                <input
                  type="text"
                  name="display_name"
                  value={form.display_name}
                  onChange={handleChange}
                  placeholder="Dragon Slayer"
                  className="input-dark w-full"
                  maxLength={50}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-400">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="input-dark w-full"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-400">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="input-dark w-full"
                autoComplete="new-password"
                minLength={8}
              />
              <p className="mt-1 text-xs text-gray-600">Minimum 8 characters</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-400">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="United States"
                className="input-dark w-full"
                maxLength={60}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating account…
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-white/5 pt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-dragon-purple hover:text-purple-400 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
