import api from './api'

export const projectsService = {
  list: (queryString) => api.get(queryString ? `/projects?${queryString}` : '/projects'),
  listArchived: (queryString) => api.get(queryString ? `/projects/archived?${queryString}` : '/projects/archived'),
  listGoLive: () => api.get('/projects/go-live'),
  listBacklog: () => api.get('/projects/backlog'),
  assignResponsible: (projectId, data) => api.post(`/projects/${projectId}/assign`, data),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  cancel: (id, reason) => api.patch(`/projects/${id}/cancel`, { reason }),
  listCancelled: () => api.get('/projects/cancelled'),
  restore: (id) => api.patch(`/projects/${id}/restore`),
  assignMember: (id, user_id) => api.post(`/projects/${id}/members`, { user_id }),
  getFreshserviceRequests: () => api.get('/projects/freshservice-requests'),
  approveFreshservice: (id, data) => api.patch(`/projects/${id}/approve-freshservice`, data),
  rejectFreshservice: (id) => api.delete(`/projects/${id}/reject-freshservice`),
}