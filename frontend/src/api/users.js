import apiClient from './client'

export const getMe = () =>
  apiClient.get('/users/me')

export const updateMe = (data) =>
  apiClient.put('/users/me', data)

export const getUserByUsername = (username) =>
  apiClient.get(`/users/${username}`)
