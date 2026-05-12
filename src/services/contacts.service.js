import api from './api'

export const contactsService = {
  list: (area) => api.get(area ? `/contacts?area=${encodeURIComponent(area)}` : '/contacts'),
  create: (name, area) => api.post('/contacts', { name, area }),
  delete: (id) => api.delete(`/contacts/${id}`),
  syncAD: () => api.post('/contacts/sync-ad'),
}