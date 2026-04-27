import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { ProjectCard } from '../components/project/ProjectCard'
import { projectsService } from '../services/projects.service'

const PAGE_SIZE = 10

const selectCls = 'h-8 px-3 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 outline-none focus:border-primary-600 transition-colors cursor-pointer'

export default function GoLiveProjects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    projectsService.listGoLive().then(r => {
      setProjects(r.data)
      setLoading(false)
    }).catch(() => {
      setError('Erro ao carregar projetos em go-live.')
      setLoading(false)
    })
  }, [])

  useEffect(() => { setPage(1) }, [search, filtro])

  const filtered = useMemo(() => {
    return projects.filter(p => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.area.toLowerCase().includes(search.toLowerCase())

      const matchFiltro = (() => {
        if (!filtro) return true
        if (filtro === 'go_live_proximo') {
          if (!p.go_live) return false
          const diff = (new Date(p.go_live) - new Date()) / (1000 * 60 * 60 * 24)
          return diff >= 0 && diff <= 30
        }
        if (filtro === 'go_live_atrasado') {
          if (!p.go_live) return false
          return new Date(p.go_live) < new Date()
        }
        return true
      })()

      return matchSearch && matchFiltro
    })
  }, [projects, search, filtro])

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
          <h1 className="text-base font-medium text-gray-900">Projetos em go-live</h1>
          <button onClick={() => navigate('/projetos')} className="text-xs text-primary-600 hover:text-primary-800">
            ← Voltar para ativos
          </button>
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          <input
            type="text"
            placeholder="Buscar por nome ou área..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 px-3 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 outline-none focus:border-primary-600 min-w-200px"
          />
          <select
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            className={selectCls}
          >
            <option value="">Filtros especiais</option>
            <option value="go_live_proximo">Go-live nos próximos 30 dias</option>
            <option value="go_live_atrasado">Go-live atrasado</option>
          </select>
        </div>

        {loading && <div className="text-center py-16"><p className="text-sm text-gray-400">Carregando...</p></div>}
        {error && <div className="text-center py-16"><p className="text-sm text-red-400">{error}</p></div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">Nenhum projeto em go-live encontrado.</p>
          </div>
        )}

        {!loading && !error && paginated.length > 0 && (
          <>
            <div className="flex flex-col gap-2.5">
              {paginated.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-gray-400">
                  {paginated.length} projeto{paginated.length !== 1 ? 's' : ''} nesta página · página {page} de {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 px-3 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    ← Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-8 w-8 text-xs rounded-lg border transition-colors ${
                        p === page
                          ? 'bg-primary-600 text-white border-primary-600 font-medium'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-8 px-3 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
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