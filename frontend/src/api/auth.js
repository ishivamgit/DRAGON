import apiClient from './client'

export const login = (email, password) =>
  apiClient.post('/auth/login', { email, password })

export const register = (data) =>
  apiClient.post('/auth/register', data)

export const logout = (refreshToken) =>
  apiClient.post('/auth/logout', { refresh_token: refreshToken })

export const refresh = (refreshToken) =>
  apiClient.post('/auth/refresh', { refresh_token: refreshToken })

export const getMe = () =>
  apiClient.get('/auth/me')
