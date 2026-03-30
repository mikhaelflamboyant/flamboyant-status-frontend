import api from './api'

export const risksService = {
  create: (statusUpdateId, data) => api.post(`/status/${statusUpdateId}/risks`, data),
  update: (statusUpdateId, id, data) => api.patch(`/status/${statusUpdateId}/risks/${id}`, data),
  delete: (statusUpdateId, id) => api.delete(`/status/${statusUpdateId}/risks/${id}`),
}