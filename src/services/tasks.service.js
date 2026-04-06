import api from './api'

export const tasksService = {
  list: (projectId) => api.get(`/projects/${projectId}/tasks`),
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  update: (projectId, taskId, data) => api.patch(`/projects/${projectId}/tasks/${taskId}`, data),
  complete: (projectId, taskId) => api.patch(`/projects/${projectId}/tasks/${taskId}/complete`),
  delete: (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`),
}