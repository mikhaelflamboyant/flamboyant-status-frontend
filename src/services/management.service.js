import api from './api'

export const managementService = {
  getDashboard: () => api.get('/management/dashboard'),
  getUsers: () => api.get('/management/users'),
  getApprovals: (params = {}) => api.get('/management/approvals', { params }),
}