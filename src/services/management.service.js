import api from './api'

export const managementService = {
  getDashboard: () => api.get('/management/dashboard'),
  getUsers: () => api.get('/management/users'),
}