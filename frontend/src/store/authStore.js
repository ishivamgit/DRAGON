import { create } from 'zustand'
import apiClient from '../api/client'

const LS_ACCESS = 'dragon_access_token'
const LS_REFRESH = 'dragon_refresh_token'
const LS_USER = 'dragon_user'

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,

  hydrate: () => {
    try {
      const accessToken = localStorage.getItem(LS_ACCESS)
      const refreshToken = localStorage.getItem(LS_REFRESH)
      const userRaw = localStorage.getItem(LS_USER)
      const user = userRaw ? JSON.parse(userRaw) : null
      if (accessToken && user) {
        set({ accessToken, refreshToken, user })
      }
    } catch {
      // corrupted storage — clear it
      localStorage.removeItem(LS_ACCESS)
      localStorage.removeItem(LS_REFRESH)
      localStorage.removeItem(LS_USER)
    }
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const response = await apiClient.post('/auth/login', { email, password })
      const { access_token, refresh_token, user } = response.data
      localStorage.setItem(LS_ACCESS, access_token)
      localStorage.setItem(LS_REFRESH, refresh_token)
      localStorage.setItem(LS_USER, JSON.stringify(user))
      set({ accessToken: access_token, refreshToken: refresh_token, user, isLoading: false })
      return { success: true }
    } catch (error) {
      set({ isLoading: false })
      return {
        success: false,
        message: error.response?.data?.detail || 'Login failed. Please check your credentials.',
      }
    }
  },

  logout: async () => {
    const { refreshToken } = get()
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken })
      }
    } catch {
      // ignore logout API errors
    } finally {
      localStorage.removeItem(LS_ACCESS)
      localStorage.removeItem(LS_REFRESH)
      localStorage.removeItem(LS_USER)
      set({ user: null, accessToken: null, refreshToken: null })
    }
  },

  refresh: async () => {
    const { refreshToken } = get()
    if (!refreshToken) return false
    try {
      const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken })
      const { access_token, refresh_token: newRefreshToken } = response.data
      localStorage.setItem(LS_ACCESS, access_token)
      if (newRefreshToken) {
        localStorage.setItem(LS_REFRESH, newRefreshToken)
      }
      set({ accessToken: access_token, refreshToken: newRefreshToken || refreshToken })
      return true
    } catch {
      return false
    }
  },

  setUser: (user) => {
    localStorage.setItem(LS_USER, JSON.stringify(user))
    set({ user })
  },
}))

export default useAuthStore
