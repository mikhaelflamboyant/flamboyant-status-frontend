import api from './api'

export const getPermissions = () => api.get('/management/permissions')

export const revokePermission = ({ role, permission, enabled }) =>
  api.patch('/management/permissions', { role, permission, enabled })