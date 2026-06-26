import apiClient from './client'

export const getAdminStats = () =>
  apiClient.get('/admin/stats')

export const listUsers = (params = {}) =>
  apiClient.get('/admin/users', { params })

export const toggleUserAdmin = (userId, isAdmin) =>
  apiClient.patch(`/admin/users/${userId}`, { is_admin: isAdmin })

export const toggleUserActive = (userId, isActive) =>
  apiClient.patch(`/admin/users/${userId}`, { is_active: isActive })

export const declareWinners = (competitionId, winners) =>
  apiClient.post(`/admin/competitions/${competitionId}/winners`, { winners })

export const changeStatus = (competitionId, status) =>
  apiClient.patch(`/admin/competitions/${competitionId}/status`, { status })
