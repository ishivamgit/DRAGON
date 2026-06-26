import apiClient from './client'

export const registerForCompetition = (competitionId) =>
  apiClient.post(`/competitions/${competitionId}/register`)

export const withdrawFromCompetition = (competitionId) =>
  apiClient.delete(`/competitions/${competitionId}/register`)

export const getMyRegistrations = () =>
  apiClient.get('/registrations/me')
