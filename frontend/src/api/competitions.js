import apiClient from './client'

export const listCompetitions = (params = {}) =>
  apiClient.get('/competitions', { params })

export const getCompetitionBySlug = (slug) =>
  apiClient.get(`/competitions/${slug}`)

export const createCompetition = (data) =>
  apiClient.post('/competitions', data)

export const updateCompetition = (id, data) =>
  apiClient.put(`/competitions/${id}`, data)

export const changeCompetitionStatus = (id, status) =>
  apiClient.patch(`/competitions/${id}/status`, { status })

export const declareWinners = (id, winners) =>
  apiClient.post(`/competitions/${id}/winners`, { winners })

export const getFeaturedCompetitions = () =>
  apiClient.get('/competitions', {
    params: { status: 'active', limit: 3 },
  })
