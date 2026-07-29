export function formatRelativeTime(isoDate, now = Date.now()) {
  const elapsedMinutes = Math.max(0, Math.round((now - new Date(isoDate).getTime()) / 60000))
  if (elapsedMinutes < 2) return 'agora mesmo'
  if (elapsedMinutes < 60) return `há ${elapsedMinutes} min`
  if (elapsedMinutes < 1440) return `há ${Math.round(elapsedMinutes / 60)}h`
  const elapsedDays = Math.round(elapsedMinutes / 1440)
  return `há ${elapsedDays} ${elapsedDays === 1 ? 'dia' : 'dias'}`
}

export function formatDayLabel(isoDate, now = Date.now()) {
  const actionDate = new Date(isoDate)
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const dayOffset = Math.floor((startOfToday - new Date(actionDate).setHours(0, 0, 0, 0)) / 86400000)
  if (dayOffset <= 0) return 'Hoje'
  if (dayOffset === 1) return 'Ontem'
  return `${String(actionDate.getDate()).padStart(2, '0')}/${String(actionDate.getMonth() + 1).padStart(2, '0')}`
}

export function groupActionsByDay(actions, now = Date.now()) {
  const buckets = []
  const indexByLabel = new Map()
  for (const action of actions) {
    const label = formatDayLabel(action.created_at, now)
    if (!indexByLabel.has(label)) {
      indexByLabel.set(label, buckets.length)
      buckets.push({ dayLabel: label, actions: [] })
    }
    buckets[indexByLabel.get(label)].actions.push(action)
  }
  return buckets
}

export function groupActionsByUser(actions) {
  const buckets = []
  const indexByUserId = new Map()
  for (const action of actions) {
    const { id } = action.user
    if (!indexByUserId.has(id)) {
      indexByUserId.set(id, buckets.length)
      buckets.push({ user: action.user, actions: [] })
    }
    buckets[indexByUserId.get(id)].actions.push(action)
  }
  return buckets
}

export function getUserInitials(name) {
  return (name || '').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
}