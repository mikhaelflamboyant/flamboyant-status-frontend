import api from './api'

export const managementService = {
  getDashboard: () => api.get('/management/dashboard'),
  getUsers: () => api.get('/management/users'),
  getApprovals: (params = {}) => api.get('/management/approvals', { params }),
  getRecentActions: (params = {}) => api.get('/management/recent-actions', { params }),
  getRecentActionFilters: () => api.get('/management/recent-actions/filters'),
}