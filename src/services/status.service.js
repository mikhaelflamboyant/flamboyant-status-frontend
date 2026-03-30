import api from './api'

export const statusService = {
  list: (projectId) => api.get(`/projects/${projectId}/status`),
  getById: (projectId, id) => api.get(`/projects/${projectId}/status/${id}`),
  create: (projectId, data) => api.post(`/projects/${projectId}/status`, data),
  update: (projectId, id, data) => api.patch(`/projects/${projectId}/status/${id}`, data),
}