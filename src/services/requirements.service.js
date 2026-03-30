import api from './api'

export const requirementsService = {
  get: (projectId) => api.get(`/projects/${projectId}/requirements`),
  create: (projectId, data) => api.post(`/projects/${projectId}/requirements`, data),
  update: (projectId, data) => api.patch(`/projects/${projectId}/requirements`, data),
}