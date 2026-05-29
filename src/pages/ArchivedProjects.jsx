import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { ProjectCard } from '../components/project/ProjectCard'
import { ProjectFilters } from '../components/project/ProjectFilters'
import { projectsService } from '../services/projects.service'

const PAGE_SIZE = 10

export default function ArchivedProjects() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(location.state?.restorePage || 1)
  const [filters, setFilters] = useState({
    search: '',
    traffic_light: [],
    areas: [],
    levels: [],
    responsible_ids: [],
    requester_ids: [],
    filtro: searchParams.get('filtro') || '',
  })

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const serverFiltro = ['entregues_mes', 'sem_cronograma'].includes(filters.filtro)
          ? `filtro=${filters.filtro}`
          : ''
        const response = await projectsService.listArchived(serverFiltro)
        setProjects(response.data)
      } catch {
        setError('Erro ao carregar projetos finalizados.')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [filters.filtro])

  useEffect(() => { setPage(1) }, [filters])

  const filtered = useMemo(() => {
    return projects.filter(p => {
      const search = filters.search.toLowerCase()
      if (search && !p.title.toLowerCase().includes(search) && !p.area.toLowerCase().includes(search)) return false
      if (filters.traffic_light?.length > 0 && !filters.traffic_light.includes(p.traffic_light)) return false
      if (filters.areas?.length > 0 && !filters.areas.includes(p.area)) return false
      if (filters.levels?.length > 0 && !filters.levels.includes(p.level)) return false
      if (filters.responsible_ids?.length > 0) {
        const ok = p.requesters?.some(r => filters.responsible_ids.includes(r.user_id) && r.type === 'RESPONSAVEL')
        if (!ok) return false
      }
      if (filters.requester_ids?.length > 0) {
        const ok = p.requesters?.some(r => {
          if (r.type !== 'SOLICITANTE') return false
          if (r.user_id) return filters.requester_ids.includes(r.user_id)
          return filters.requester_ids.includes(`manual_${r.manual_name}`)
        })
        if (!ok) return false
      }
      return true
    })
  }, [projects, filters])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-6">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-base font-medium text-gray-900">Projetos finalizados</h1>
          <button onClick={() => navigate('/projetos')} className="text-xs text-primary-600 hover:text-primary-800">
            ← Voltar para ativos
          </button>
        </div>

        <div className="mb-5">
          <ProjectFilters
            filters={filters}
            onChange={setFilters}
            hidePhase
            extraOptions={[
              { value: 'entregues_mes', label: 'Entregues no mês' },
              { value: 'sem_cronograma', label: 'Sem cronograma' },
            ]}
          />
        </div>

        {loading && <div className="text-center py-16"><p className="text-sm text-gray-400">Carregando...</p></div>}
        {error && <div className="text-center py-16"><p className="text-sm text-red-400">{error}</p></div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">Nenhum projeto encontrado.</p>
          </div>
        )}

        {!loading && !error && paginated.length > 0 && (
          <>
            <div className="flex flex-col gap-2.5">
              {paginated.map(p => <ProjectCard key={p.id} project={p} page={page} />)}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-gray-400">
                  {paginated.length} projeto{paginated.length !== 1 ? 's' : ''} nesta página · página {page} de {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="h-8 px-3 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                    ← Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`h-8 w-8 text-xs rounded-lg border transition-colors ${p === page ? 'bg-primary-600 text-white border-primary-600 font-medium' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="h-8 px-3 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                    Próxima →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}