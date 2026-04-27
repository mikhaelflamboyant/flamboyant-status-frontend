import api from './api'

export const projectsService = {
  list: (queryString) => api.get(queryString ? `/projects?${queryString}` : '/projects'),
  listArchived: (queryString) => api.get(queryString ? `/projects/archived?${queryString}` : '/projects/archived'),
  listGoLive: () => api.get('/projects/go-live'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  assignMember: (id, user_id) => api.post(`/projects/${id}/members`, { user_id }),
  getFreshserviceRequests: () => api.get('/projects/freshservice-requests'),
  approveFreshservice: (id, data) => api.patch(`/projects/${id}/approve-freshservice`, data),
  rejectFreshservice: (id) => api.delete(`/projects/${id}/reject-freshservice`),
}