import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import useAuthStore from './store/authStore'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Competitions from './pages/Competitions'
import CompetitionDetail from './pages/CompetitionDetail'
import Profile from './pages/Profile'

import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import ManageCompetitions from './pages/admin/ManageCompetitions'
import ManageSponsors from './pages/admin/ManageSponsors'
import ManageUsers from './pages/admin/ManageUsers'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate)
  const location = useLocation()

  // Hydrate auth state from localStorage on startup
  useEffect(() => {
    hydrate()
  }, [hydrate])

  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <div className="flex min-h-screen flex-col bg-dragon-dark text-white">
      <ScrollToTop />

      {/* Navbar shown everywhere except admin */}
      {!isAdmin && <Navbar />}

      <div className={isAdmin ? '' : 'flex flex-1 flex-col'}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/competitions/:slug" element={<CompetitionDetail />} />

          {/* Protected routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin routes — own layout, no shared navbar/footer */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="competitions" element={<ManageCompetitions />} />
            <Route path="sponsors" element={<ManageSponsors />} />
            <Route path="users" element={<ManageUsers />} />
          </Route>

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="flex flex-1 flex-col items-center justify-center gap-4 py-32">
                <span className="text-8xl">🐉</span>
                <h1 className="text-4xl font-black text-white">404</h1>
                <p className="text-gray-500">This page was slain in battle.</p>
                <a href="/" className="btn-primary mt-2">
                  Return Home
                </a>
              </div>
            }
          />
        </Routes>
      </div>

      {/* Footer shown everywhere except admin */}
      {!isAdmin && <Footer />}
    </div>
  )
}
