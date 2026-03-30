import { useState, useEffect, useMemo } from 'react'
import { projectsService } from '../services/projects.service'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState({
    search: '',
    traffic_light: '',
    phase: '',
    area: '',
    priority: '',
  })

  const fetchProjects = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await projectsService.list()
      setProjects(response.data)
    } catch (err) {
      setError('Erro ao carregar projetos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

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

      return true
    })
  }, [projects, filters])

  const metrics = useMemo(() => {
    return {
      total: projects.length,
      green: projects.filter(p => p.traffic_light === 'VERDE').length,
      amber: projects.filter(p => p.traffic_light === 'AMARELO').length,
      red: projects.filter(p => p.traffic_light === 'VERMELHO').length,
    }
  }, [projects])

  return {
    projects: filteredProjects,
    loading,
    error,
    filters,
    setFilters,
    metrics,
    refetch: fetchProjects,
  }
}