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

  const [filters, setFilters] = useState({
    search: '',
    traffic_light: initialFarol,
    phase: '',
    area: '',
    priority: '',
    user_id: '',
    filtro: initialFiltro,
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
  }, [filters])

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const search = filters.search.toLowerCase()

      if (search && !project.title.toLowerCase().includes(search) &&
          !project.area.toLowerCase().includes(search)) {
        return false
      }

      if (filters.traffic_light && project.traffic_light !== filters.traffic_light) {
        return false
      }

      if (filters.phase && project.current_phase !== filters.phase) {
        return false
      }

      if (filters.area && project.area !== filters.area) {
        return false
      }

      if (filters.priority && project.priority !== parseInt(filters.priority)) {
        return false
      }

      if (filters.user_id) {
        const isRequester = project.requesters?.some(r => r.user_id === filters.user_id)
        const isMember = project.members?.some(m => m.user_id === filters.user_id)
        if (!isRequester && !isMember) return false
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