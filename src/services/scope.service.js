import api from './api'

export const scopeService = {
  list: (projectId) => api.get(`/projects/${projectId}/scope`),
  create: (projectId, data) => api.post(`/projects/${projectId}/scope`, data),
  update: (projectId, id, data) => api.patch(`/projects/${projectId}/scope/${id}`, data),
  delete: (projectId, id) => api.delete(`/projects/${projectId}/scope/${id}`),
  requestApproval: (projectId) => api.post(`/projects/${projectId}/scope/request-approval`),
  approve: (projectId) => api.post(`/projects/${projectId}/scope/approve`),
  reject: (projectId) => api.post(`/projects/${projectId}/scope/reject`),
  approveItems: (projectId, ids) => api.post(`/projects/${projectId}/scope/approve-items`, { ids }),
  rejectItems: (projectId, ids) => api.post(`/projects/${projectId}/scope/reject-items`, { ids }),
}