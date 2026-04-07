import api from './api'

export const apitokenService = {
  list: () => api.get('/api-tokens'),
  create: (name) => api.post('/api-tokens', { name }),
  revoke: (id) => api.delete(`/api-tokens/${id}`),
  listAll: () => api.get('/api-tokens/history'),
}