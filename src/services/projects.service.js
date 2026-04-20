import api from './api'

export const projectsService = {
  list: (queryString) => api.get(queryString ? `/projects?${queryString}` : '/projects'),
  listArchived: (queryString) => api.get(queryString ? `/projects/archived?${queryString}` : '/projects/archived'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  assignMember: (id, user_id) => api.post(`/projects/${id}/members`, { user_id }),
}