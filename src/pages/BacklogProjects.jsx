import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { projectsService } from '../services/projects.service'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'

export default function BacklogProjects() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [assigningId, setAssigningId] = useState(null)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [saving, setSaving] = useState(false)

  const canAssignOthers = ['GERENTE', 'COORDENADOR', 'ANALISTA_MASTER', 'ANALISTA_TESTADOR'].includes(user?.role)
  const canApprove = ['ANALISTA_MASTER', 'ANALISTA_TESTADOR', 'GERENTE', 'COORDENADOR'].includes(user?.role)

  const fetchProjects = async () => {
    try {
      const res = await projectsService.listBacklog()
      setProjects(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
    if (canAssignOthers) {
      api.get('/users').then(r => setUsers(r.data.filter(u =>
        u.area === 'Tecnologia da Informação' || ['ANALISTA_MASTER', 'ANALISTA_TESTADOR'].includes(u.role)
      ))).catch(() => {})
    }
  }, [])

  const handleAssign = async (projectId, userId) => {
    setSaving(true)
    try {
      await projectsService.assignResponsible(projectId, userId)
      fetchProjects()
      setAssigningId(null)
      setSelectedUserId('')
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao atribuir responsável.')
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async (id) => {
    if (!confirm('Tem certeza que deseja rejeitar e remover esta solicitação?')) return
    try {
      await projectsService.rejectFreshservice(id)
      fetchProjects()
    } catch (err) {
      alert('Erro ao rejeitar.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-base font-medium text-gray-900">Backlog</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Projetos aprovados aguardando atribuição de responsável
            </p>
          </div>
          {canApprove && (
            <button
              onClick={() => navigate('/freshservice')}
              className="text-xs font-medium px-4 h-8 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Solicitações FreshService
            </button>
          )}
        </div>

        {loading && <p className="text-sm text-gray-400 text-center py-16">Carregando...</p>}

        {!loading && projects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">Nenhum projeto em backlog.</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {projects.map(project => (
            <div key={project.id} className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {project.freshservice_ticket_id && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                        #{project.freshservice_ticket_id}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(project.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <h2 className="text-sm font-medium text-gray-900 mb-1">{project.title}</h2>
                  <p className="text-xs text-gray-500 whitespace-pre-wrap line-clamp-2">{project.description}</p>
                  {project.requesters?.filter(r => r.type === 'SOLICITANTE').length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      Solicitante: <span className="font-medium text-gray-600">
                        {project.requesters.filter(r => r.type === 'SOLICITANTE').map(r => r.user?.name || r.manual_name).join(', ')}
                      </span>
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {assigningId !== project.id && (
                    <>
                      <button
                        onClick={() => {
                          setAssigningId(project.id)
                          setSelectedUserId(canAssignOthers ? '' : user.id)
                        }}
                        className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 transition-colors font-medium"
                      >
                        {canAssignOthers ? 'Atribuir responsável' : 'Vincular-me'}
                      </button>
                      {canApprove && (
                        <button
                          onClick={() => handleReject(project.id)}
                          className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Rejeitar
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {assigningId === project.id && (
                <div className="border-t border-gray-100 pt-4 mt-3 flex items-end gap-3">
                  {canAssignOthers ? (
                    <div className="flex flex-col gap-1 flex-1 max-w-xs">
                      <p className="text-xs text-gray-400">Responsável</p>
                      <select
                        value={selectedUserId}
                        onChange={e => setSelectedUserId(e.target.value)}
                        className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                      >
                        <option value="">Selecionar</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name} — {u.area}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Você será atribuído como responsável por este projeto.
                    </p>
                  )}
                  <button
                    onClick={() => handleAssign(project.id, canAssignOthers ? selectedUserId : user.id)}
                    disabled={saving || (canAssignOthers && !selectedUserId)}
                    className="text-xs bg-primary-600 text-white px-4 py-1.5 rounded-lg hover:bg-primary-800 disabled:opacity-50 font-medium"
                  >
                    {saving ? 'Salvando...' : 'Confirmar'}
                  </button>
                  <button
                    onClick={() => { setAssigningId(null); setSelectedUserId('') }}
                    className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}