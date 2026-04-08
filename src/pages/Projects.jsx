import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { ProjectCard } from '../components/project/ProjectCard'
import { ProjectKanban } from '../components/project/ProjectKanban'
import { ProjectFilters } from '../components/project/ProjectFilters'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'

export default function Projects() {
  const { projects, loading, error, filters, setFilters, metrics, totalProjects, page, setPage, totalPages, refetch } = useProjects()
  const navigate = useNavigate()
  const { user, canCreateProject } = useAuth()
  const [view, setView] = useState(() => localStorage.getItem('projectsView') || 'list')

  const isTI = user?.area === 'Tecnologia da Informação'

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

        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Total ativo</p>
            <p className="text-2xl font-medium text-gray-900">{metrics.total}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">No prazo</p>
            <p className="text-2xl font-medium text-teal-600">{metrics.green}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Atenção</p>
            <p className="text-2xl font-medium text-amber-500">{metrics.amber}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Atrasados</p>
            <p className="text-2xl font-medium text-red-500">{metrics.red}</p>
          </div>
        </div>

        <div className="mb-5">
          <ProjectFilters filters={filters} onChange={setFilters} hidePhase={view === 'kanban'} />
        </div>

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
              <ProjectKanban projects={projects} onProjectUpdate={refetch} />
            ) : (
              <>
                <div className="flex flex-col gap-2.5">
                  {projects.map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-gray-400">
                    {projects.length} projeto{projects.length !== 1 ? 's' : ''} nesta página · página {page} de {totalPages}
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
              </>
            )}
          </>
        )}

      </div>
    </div>
  )
}