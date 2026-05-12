import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { projectsService } from '../services/projects.service'

const PAGE_SIZE = 10

export function useProjects() {
  const [searchParams] = useSearchParams()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

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
    priorities: savedFilters?.priorities || [],
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

  useEffect(() => {
    fetchProjects()
  }, [filters.filtro])

  useEffect(() => {
    setPage(1)
    sessionStorage.setItem('projectFilters', JSON.stringify(filters))
  }, [filters])

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

      if (filters.priorities?.length > 0 && !filters.priorities.includes(String(project.priority))) {
        return false
      }

      if (filters.responsible_ids?.length > 0) {
        const isResponsible = project.requesters?.some(
          r => filters.responsible_ids.includes(r.user_id) && r.type === 'RESPONSAVEL'
        )
        if (!isResponsible) return false
      }

      if (filters.requester_ids?.length > 0) {
        const isRequester = project.requesters?.some(
          r => filters.requester_ids.includes(r.user_id) && r.type === 'SOLICITANTE'
        )
        if (!isRequester) return false
      }

      return true
    })
  }, [projects, filters])

  const totalPages = Math.ceil(filteredProjects.length / PAGE_SIZE)

  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredProjects.slice(start, start + PAGE_SIZE)
  }, [filteredProjects, page])

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
    allFilteredProjects: filteredProjects,
    totalProjects: filteredProjects.length,
    loading,
    error,
    filters,
    setFilters,
    metrics,
    refetch: fetchProjects,
    page,
    setPage,
    totalPages,
  }
}