import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { ProjectCard } from '../components/project/ProjectCard'
import { projectsService } from '../services/projects.service'

export default function GoLiveProjects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectsService.listGoLive().then(r => {
      setProjects(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-6">
        <h1 className="text-base font-medium text-gray-900 mb-6">Projetos em go-live</h1>
        {loading && <p className="text-sm text-gray-400 text-center py-16">Carregando...</p>}
        {!loading && projects.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-16">Nenhum projeto em go-live no momento.</p>
        )}
        <div className="flex flex-col gap-2.5">
          {projects.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      </div>
    </div>
  )
}