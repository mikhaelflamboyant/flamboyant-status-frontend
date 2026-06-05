import { PDFExportGeral } from '../components/project/PDFExportGeral'
import { PDFExportResumido } from '../components/project/PDFExportResumido'
import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { ProjectCard } from '../components/project/ProjectCard'
import { ProjectKanban } from '../components/project/ProjectKanban'
import { ProjectFilters } from '../components/project/ProjectFilters'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'

export default function Projects() {
  const { projects, allFilteredProjects, loading, error, filters, setFilters, metrics, totalProjects, page, setPage, totalPages, refetch, pageSize, setPageSize } = useProjects()
  const navigate = useNavigate()
  const { user, canCreateProject } = useAuth()
  const [view, setView] = useState(() => localStorage.getItem('projectsView') || 'list')
  const [showGoLiveBanner, setShowGoLiveBanner] = useState(true)

  const isTI = user?.area === 'Tecnologia da Informação'

  const goLiveCritical = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDays = new Date(today)
    sevenDays.setDate(today.getDate() + 7)
    return allFilteredProjects
      .filter(p => p.go_live && new Date(p.go_live) >= today && new Date(p.go_live) <= sevenDays)
      .sort((a, b) => new Date(a.go_live) - new Date(b.go_live))
  }, [allFilteredProjects])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-6">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-base font-medium text-gray-900">Projetos ativos</h1>
          <div className="flex items-center gap-3">
            {isTI && (
              <div className="flex rounded-lg overflow-hidden border border-primary-600 h-8">
                <button
                  onClick={() => { setView('list'); localStorage.setItem('projectsView', 'list') }}
                  className={`px-4 h-8 text-xs font-medium transition-colors ${
                    view === 'list'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  Lista
                </button>
                <button
                  onClick={() => { setView('kanban'); localStorage.setItem('projectsView', 'kanban') }}
                  className={`px-4 h-8 text-xs font-medium transition-colors ${
                    view === 'kanban'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  Kanban
                </button>
              </div>
            )}
            {isTI && (
              <>
                <PDFExportGeral allProjects={allFilteredProjects} />
                <PDFExportResumido allProjects={allFilteredProjects} />
              </>
            )}
            {canCreateProject() && (
              <button
                onClick={() => navigate('/projetos/novo')}
                className="text-xs font-medium px-4 h-8 rounded-lg bg-primary-600 text-white hover:bg-primary-800 transition-colors"
              >
                + Novo projeto
              </button>
            )}
          </div>
        </div>

        {(() => {
          const complexidade = (lista) => ({
            alta: lista.filter(p => p.complexity === 'Alta').length,
            media: lista.filter(p => p.complexity === 'Média').length,
            baixa: lista.filter(p => p.complexity === 'Baixa').length,
          })
          const cTotal = complexidade(allFilteredProjects)
          const cGreen = complexidade(allFilteredProjects.filter(p => p.traffic_light === 'VERDE'))
          const cAmber = complexidade(allFilteredProjects.filter(p => p.traffic_light === 'AMARELO'))
          const cRed = complexidade(allFilteredProjects.filter(p => p.traffic_light === 'VERMELHO'))

          const ComplexLine = ({ c, total }) => {
            const naoDefinida = total - c.alta - c.media - c.baixa
            return (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                {c.alta > 0 && <span className="text-xs text-gray-400">Alta: <span className="text-red-500 font-medium">{c.alta}</span></span>}
                {c.media > 0 && <span className="text-xs text-gray-400">Média: <span className="text-amber-500 font-medium">{c.media}</span></span>}
                {c.baixa > 0 && <span className="text-xs text-gray-400">Baixa: <span className="text-teal-600 font-medium">{c.baixa}</span></span>}
                {naoDefinida > 0 && <span className="text-xs text-gray-300">Não def.: {naoDefinida}</span>}
                {c.alta === 0 && c.media === 0 && c.baixa === 0 && naoDefinida === 0 && (
                  <span className="text-xs text-gray-300">-</span>
                )}
              </div>
            )
          }

          return (
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Total ativo</p>
                <p className="text-2xl font-medium text-gray-900">{metrics.total}</p>
                <ComplexLine c={cTotal} total={allFilteredProjects.length} />
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">No prazo</p>
                <p className="text-2xl font-medium text-teal-600">{metrics.green}</p>
                <ComplexLine c={cGreen} total={allFilteredProjects.filter(p => p.traffic_light === 'VERDE').length} />
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Atenção</p>
                <p className="text-2xl font-medium text-amber-500">{metrics.amber}</p>
                <ComplexLine c={cAmber} total={allFilteredProjects.filter(p => p.traffic_light === 'AMARELO').length} />
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Atrasados</p>
                <p className="text-2xl font-medium text-red-500">{metrics.red}</p>
                <ComplexLine c={cRed} total={allFilteredProjects.filter(p => p.traffic_light === 'VERMELHO').length} />
              </div>
            </div>
          )
        })()}

        <div className="mb-5">
          <ProjectFilters filters={filters} onChange={setFilters} hidePhase={view === 'kanban'} />
        </div>

        {showGoLiveBanner && goLiveCritical.length > 0 && (
          <div className="mb-4 bg-danger-50 border border-danger-100 rounded-xl p-3.5 flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A32D2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div className="flex-1">
              <p className="text-xs font-medium text-danger-800 mb-1">
                {goLiveCritical.length} projeto{goLiveCritical.length !== 1 ? 's' : ''} com go-live nos próximos 7 dias
              </p>
              <p className="text-xs text-danger-600 mb-2">Verifique se estão no prazo e com status atualizado.</p>
              <div className="flex flex-wrap gap-2">
                {goLiveCritical.map(p => {
                  const days = Math.ceil((new Date(p.go_live) - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))
                  return (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/projetos/${p.id}`)}
                      className="flex items-center gap-2 bg-white border border-danger-100 rounded-full px-3 py-1 text-xs text-danger-600 hover:border-danger-400 transition-colors"
                    >
                      <span>{p.title.length > 35 ? p.title.slice(0, 35) + '…' : p.title}</span>
                      <span className="bg-danger-50 text-danger-800 font-medium px-1.5 py-0.5 rounded-full">
                        {days === 0 ? 'hoje' : `${days}d`}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <button
              onClick={() => setShowGoLiveBanner(false)}
              className="shrink-0 text-danger-400 hover:text-danger-600 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">Carregando projetos...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">Nenhum projeto encontrado.</p>
            <p className="text-xs text-gray-300 mt-1">Tente mudar os filtros ou crie um novo projeto.</p>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <>
            {view === 'kanban' && isTI ? (
              <ProjectKanban projects={allFilteredProjects} onProjectUpdate={refetch} />
            ) : (
              <>
                <div className="flex flex-col gap-2.5">
                  {projects.map(project => (
                    <ProjectCard key={project.id} project={project} page={page} />
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-gray-400">
                      {projects.length} projeto{projects.length !== 1 ? 's' : ''} nesta página · página {page} de {totalPages}
                    </p>
                    <select
                      value={pageSize}
                      onChange={e => {
                        const val = e.target.value === 'custom'
                          ? parseInt(prompt('Quantos projetos por página?') || pageSize)
                          : parseInt(e.target.value)
                        if (val > 0) {
                          sessionStorage.setItem('projectsPageSize', val)
                          setPageSize(val)
                          setPage(1)
                        }
                      }}
                      className="h-7 px-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 outline-none focus:border-primary-600"
                    >
                      <option value={10}>10 por página</option>
                      <option value={50}>50 por página</option>
                      <option value={100}>100 por página</option>
                      <option value="custom">Personalizado...</option>
                    </select>
                  </div>
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
              </>
            )}
          </>
        )}

      </div>
    </div>
  )
}