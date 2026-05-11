import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { projectsService } from '../services/projects.service'
import { useAuth } from '../hooks/useAuth'
import { PeopleSelector } from '../components/project/PeopleSelector'
import { CostSelector } from '../components/project/CostSelector'
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
  const [assignForm, setAssignForm] = useState({
    description: '', execution_type: 'INTERNA',
    start_date: '', start_date_undefined: false,
    go_live: '', go_live_undefined: false,
  })
  const [responsibles, setResponsibles] = useState([])
  const [members, setMembers] = useState([])
  const [costs, setCosts] = useState([])

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

  const handleAssign = async (projectId) => {
    if (responsibles.length === 0) {
      alert('Adicione pelo menos um responsável.')
      return
    }
    if (!assignForm.description) {
      alert('Preencha a descrição do projeto.')
      return
    }
    if (assignForm.execution_type === 'FORNECEDOR_EXTERNO' && costs.length === 0) {
      alert('Projetos com fornecedor externo precisam ter pelo menos um custo.')
      return
    }
    setSaving(true)
    try {
      await projectsService.assignResponsible(projectId, {
        user_id: responsibles.find(r => !String(r.user_id).startsWith('manual_'))?.user_id || null,
        responsible_name: responsibles.find(r => String(r.user_id).startsWith('manual_'))?.name || null,
        responsible_area: responsibles.find(r => String(r.user_id).startsWith('manual_'))?.area || null,
        description: assignForm.description,
        execution_type: assignForm.execution_type,
        start_date: assignForm.start_date_undefined ? null : (assignForm.start_date || null),
        go_live: assignForm.go_live_undefined ? null : (assignForm.go_live || null),
        go_live_undefined: assignForm.go_live_undefined,
        member_ids: members.filter(m => !String(m.user_id).startsWith('manual_')).map(m => m.user_id),
        member_names: members.filter(m => String(m.user_id).startsWith('manual_')).map(m => ({ name: m.name, area: m.area })),
        costs: costs.map(c => ({
          name: c.name,
          budget_planned: parseFloat(String(c.budget_planned).replace(',', '.')),
          budget_actual: c.budget_actual ? parseFloat(String(c.budget_actual).replace(',', '.')) : null,
        })),
      })
      fetchProjects()
      setAssigningId(null)
      setResponsibles([])
      setMembers([])
      setCosts([])
      setAssignForm({ description: '', execution_type: 'INTERNA', start_date: '', start_date_undefined: false, go_live: '', go_live_undefined: false })
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
          <div className="flex items-center gap-2">
            {canApprove && (
              <button
                onClick={() => navigate('/freshservice')}
                className="text-xs font-medium px-4 h-8 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Solicitações FreshService
              </button>
            )}
            {canApprove && (
              <button
                onClick={() => navigate('/projetos/novo', { state: { backlog: true } })}
                className="text-xs font-medium px-4 h-8 rounded-lg bg-primary-600 text-white hover:bg-primary-800 transition-colors"
              >
                + Novo projeto
              </button>
            )}
          </div>
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
                          setAssignForm(f => ({
                            ...f,
                            description: project.description || '',
                            execution_type: project.execution_type || 'INTERNA',
                            start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
                            start_date_undefined: !project.start_date,
                            go_live: project.go_live ? new Date(project.go_live).toISOString().split('T')[0] : '',
                            go_live_undefined: !project.go_live,
                          }))
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
                <div className="border-t border-gray-100 pt-4 mt-3 flex flex-col gap-3">
                  <p className="text-xs font-medium text-gray-600">Preencha as informações para vincular</p>

                  <PeopleSelector
                    label="Responsável *"
                    users={users}
                    selected={responsibles}
                    onChange={setResponsibles}
                    buttonLabel="+ Adicionar responsável"
                    excluded={members}
                  />

                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-gray-400 mb-1">Descrição <span className="text-red-400">*</span></p>
                    <textarea
                      value={assignForm.description}
                      onChange={e => setAssignForm(f => ({...f, description: e.target.value}))}
                      rows={3}
                      placeholder="Descreva o contexto, escopo e objetivos do projeto..."
                      className="px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 resize-none bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-gray-400">Tipo de execução <span className="text-red-400">*</span></p>
                      <select
                        value={assignForm.execution_type}
                        onChange={e => setAssignForm(f => ({...f, execution_type: e.target.value}))}
                        className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                      >
                        <option value="INTERNA">Interna</option>
                        <option value="FORNECEDOR_EXTERNO">Fornecedor externo</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-gray-400">Data de início</p>
                      {!assignForm.start_date_undefined && (
                        <input type="date" value={assignForm.start_date}
                          onChange={e => setAssignForm(f => ({...f, start_date: e.target.value}))}
                          className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                        />
                      )}
                      <label className="flex items-center gap-2 mt-1 cursor-pointer">
                        <input type="checkbox" checked={assignForm.start_date_undefined}
                          onChange={e => setAssignForm(f => ({...f, start_date_undefined: e.target.checked, start_date: ''}))}
                          className="w-3 h-3 accent-primary-600"
                        />
                        <span className="text-xs text-gray-400">Não definida</span>
                      </label>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-gray-400">Go-live</p>
                      {!assignForm.go_live_undefined && (
                        <input type="date" value={assignForm.go_live}
                          onChange={e => setAssignForm(f => ({...f, go_live: e.target.value}))}
                          className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                        />
                      )}
                      <label className="flex items-center gap-2 mt-1 cursor-pointer">
                        <input type="checkbox" checked={assignForm.go_live_undefined}
                          onChange={e => setAssignForm(f => ({...f, go_live_undefined: e.target.checked, go_live: ''}))}
                          className="w-3 h-3 accent-primary-600"
                        />
                        <span className="text-xs text-gray-400">Sem previsão</span>
                      </label>
                    </div>
                  </div>

                  {assignForm.execution_type === 'FORNECEDOR_EXTERNO' && (
                    <CostSelector costs={costs} onChange={setCosts} />
                  )}

                  <PeopleSelector
                    label="Outros envolvidos"
                    users={users}
                    selected={members}
                    onChange={setMembers}
                    buttonLabel="+ Adicionar envolvido"
                    allowEmptyStart
                    excluded={responsibles}
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAssign(project.id)}
                      disabled={saving}
                      className="text-xs bg-primary-600 text-white px-4 py-1.5 rounded-lg hover:bg-primary-800 disabled:opacity-50 font-medium"
                    >
                      {saving ? 'Salvando...' : 'Confirmar'}
                    </button>
                    <button
                      onClick={() => {
                        setAssigningId(null)
                        setResponsibles([])
                        setMembers([])
                        setCosts([])
                        setAssignForm({ description: '', execution_type: 'INTERNA', start_date: '', start_date_undefined: false, go_live: '', go_live_undefined: false })
                      }}
                      className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}