export function matchesProjectFilters(project, filters = {}, { ignorePhase = false } = {}) {
  const search = (filters.search || '').toLowerCase()

  if (
    search &&
    !project.title?.toLowerCase().includes(search) &&
    !project.area?.toLowerCase().includes(search)
  ) {
    return false
  }

  if (filters.traffic_light?.length > 0 && !filters.traffic_light.includes(project.traffic_light)) {
    return false
  }

  if (!ignorePhase && filters.phases?.length > 0 && !filters.phases.includes(project.current_phase)) {
    return false
  }

  if (filters.areas?.length > 0 && !filters.areas.includes(project.area)) {
    return false
  }

  if (filters.levels?.length > 0 && !filters.levels.includes(project.level)) {
    return false
  }

  if (filters.responsible_ids?.length > 0) {
    const isResponsible = project.requesters?.some(
      r => filters.responsible_ids.includes(r.user_id) && r.type === 'RESPONSAVEL'
    )
    if (!isResponsible) return false
  }

  if (filters.requester_ids?.length > 0) {
    const isRequester = project.requesters?.some(r => {
      if (r.type !== 'SOLICITANTE') return false
      if (r.user_id) return filters.requester_ids.includes(r.user_id)
      return filters.requester_ids.includes(`manual_${r.manual_name}`)
    })
    if (!isRequester) return false
  }

  return true
}