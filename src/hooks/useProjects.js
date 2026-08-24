import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { projectsService } from '../services/projects.service'

const DEFAULT_PAGE_SIZE = 10

export function useProjects() {
  const [searchParams] = useSearchParams()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(() => {
    return parseInt(sessionStorage.getItem('projectsPage') || '1')
  })
  const [pageSize, setPageSize] = useState(() => {
    const saved = parseInt(sessionStorage.getItem('projectsPageSize'))
    return [10, 50, 100].includes(saved) ? saved : DEFAULT_PAGE_SIZE
  })

  const initialFarol = searchParams.get('farol') || ''
  const initialFiltro = searchParams.get('filtro') || ''

  const hasUrlParams = initialFarol || initialFiltro

  const savedFilters = (() => {
    if (hasUrlParams) return null
    try { return JSON.parse(sessionStorage.getItem('projectFilters')) } catch { return null }
  })()

  const [filters, setFilters] = useState({
    search: savedFilters?.search || '',
    traffic_light: initialFarol ? [initialFarol] : (savedFilters?.traffic_light || []),
    phases: savedFilters?.phases || [],
    areas: savedFilters?.areas || [],
    levels: savedFilters?.levels || [],
    user_id: savedFilters?.user_id || '',
    filtro: initialFiltro || savedFilters?.filtro || '',
    responsible_ids: savedFilters?.responsible_ids || [],
    requester_ids: savedFilters?.requester_ids || [],
  })

  const fetchProjects = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filters.filtro) params.set('filtro', filters.filtro)
      const response = await projectsService.list(params.toString())
      setProjects(response.data)
    } catch (err) {
      setError('Erro ao carregar projetos.')
    } finally {
      setLoading(false)
    }
  }

  const isFirstRender = useRef(true)

  useEffect(() => {
    fetchProjects()
  }, [filters.filtro])

  useEffect(() => {
    const savedJSON = sessionStorage.getItem('projectFilters')
    const currentJSON = JSON.stringify(filters)
    if (savedJSON !== currentJSON) {
      setPage(1)
    }
    sessionStorage.setItem('projectFilters', currentJSON)
  }, [filters])

  useEffect(() => {
    sessionStorage.setItem('projectsPage', page)
  }, [page])

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const search = filters.search.toLowerCase()

      if (search && !project.title.toLowerCase().includes(search) &&
          !project.area.toLowerCase().includes(search)) {
        return false
      }

      if (filters.traffic_light?.length > 0 && !filters.traffic_light.includes(project.traffic_light)) {
        return false
      }

      if (filters.phases?.length > 0 && !filters.phases.includes(project.current_phase)) {
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
    })
  }, [projects, filters])

  const orderedProjects = useMemo(() => {
    const hasAnyPriority = filteredProjects.some(p => p.my_position !== null && p.my_position !== undefined)
    if (!hasAnyPriority) return filteredProjects

    return [...filteredProjects].sort((a, b) => {
      const pa = a.my_position ?? null
      const pb = b.my_position ?? null
      if (pa === null && pb === null) return 0
      if (pa === null) return 1
      if (pb === null) return -1
      return pa - pb
    })
  }, [filteredProjects])

  const canReorder = filters.responsible_ids?.length === 1

  const effectivePageSize = canReorder ? Math.max(orderedProjects.length, 1) : pageSize
  const totalPages = Math.ceil(orderedProjects.length / effectivePageSize)

  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * effectivePageSize
    return orderedProjects.slice(start, start + effectivePageSize)
  }, [orderedProjects, page, effectivePageSize])

  const metrics = useMemo(() => {
    const base = filteredProjects
    return {
      total: base.length,
      green: base.filter(p => p.traffic_light === 'VERDE').length,
      amber: base.filter(p => p.traffic_light === 'AMARELO').length,
      red: base.filter(p => p.traffic_light === 'VERMELHO').length,
    }
  }, [filteredProjects])

  return {
    projects: paginatedProjects,
    allFilteredProjects: orderedProjects,
    totalProjects: orderedProjects.length,
    loading,
    error,
    filters,
    setFilters,
    metrics,
    refetch: fetchProjects,
    page,
    setPage,
    totalPages,
    pageSize,
    pageSize,
    setPageSize,
    canReorder,
    setProjects,
  }
}