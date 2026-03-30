import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { ProjectCard } from '../components/project/ProjectCard'
import { projectsService } from '../services/projects.service'

export default function ArchivedProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await projectsService.listArchived()
        setProjects(response.data)
      } catch (err) {
        setError('Erro ao carregar projetos finalizados.')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.area.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-6">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-base font-medium text-gray-900">Projetos finalizados</h1>
          <button
            onClick={() => navigate('/projetos')}
            className="text-xs text-primary-600 hover:text-primary-800"
          >
            ← Voltar para ativos
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nome ou área..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 px-3 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 outline-none focus:border-primary-600 min-w-[200px]"
          />
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">Carregando projetos...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">Nenhum projeto finalizado encontrado.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="flex flex-col gap-3">
            {filtered.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}