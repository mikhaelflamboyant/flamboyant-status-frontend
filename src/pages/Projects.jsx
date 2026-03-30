import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { ProjectCard } from '../components/project/ProjectCard'
import { ProjectFilters } from '../components/project/ProjectFilters'
import { useProjects } from '../hooks/useProjects'

export default function Projects() {
  const { projects, loading, error, filters, setFilters, metrics } = useProjects()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-6">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-base font-medium text-gray-900">Projetos ativos</h1>
          <button
            onClick={() => navigate('/projetos/novo')}
            className="text-xs font-medium px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-800 transition-colors"
          >
            + Novo projeto
          </button>
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
          <ProjectFilters filters={filters} onChange={setFilters} />
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
          <div className="flex flex-col gap-2.5">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}