import apiClient from './client'

export const listSponsors = (params = {}) =>
  apiClient.get('/sponsors', { params })

export const getSponsor = (id) =>
  apiClient.get(`/sponsors/${id}`)

export const createSponsor = (data) =>
  apiClient.post('/sponsors', data)

export const updateSponsor = (id, data) =>
  apiClient.put(`/sponsors/${id}`, data)

export const deleteSponsor = (id) =>
  apiClient.delete(`/sponsors/${id}`)
