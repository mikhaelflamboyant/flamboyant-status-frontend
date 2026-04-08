import { PDFExport } from '../components/project/PDFExport'
import api from '../services/api'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { PhaseStrip } from '../components/project/PhaseStrip'
import { Farol } from '../components/ui/Farol'
import { Badge } from '../components/ui/Badge'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StatusUpdateCard } from '../components/project/StatusUpdateCard'
import { projectsService } from '../services/projects.service'
import { statusService } from '../services/status.service'
import { risksService } from '../services/risks.service'
import { requirementsService } from '../services/requirements.service'
import { useAuth } from '../hooks/useAuth'
import { tasksService } from '../services/tasks.service'

const PRIORITY_CONFIG = {
  1: { label: 'Prioridade 1', variant: 'green' },
  2: { label: 'Prioridade 2', variant: 'green' },
  3: { label: 'Prioridade 3', variant: 'amber' },
  4: { label: 'Prioridade 4', variant: 'red' },
  5: { label: 'Prioridade 5', variant: 'red' },
}

const FAROL_COLOR = {
  VERDE: 'green',
  AMARELO: 'amber',
  VERMELHO: 'red',
}

function ControlPanel({ project, onSave }) {
  const [form, setForm] = useState({
    traffic_light: project.traffic_light,
    current_phase: project.current_phase,
    completion_pct: project.completion_pct,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        traffic_light: form.traffic_light,
        current_phase: form.current_phase,
        completion_pct: parseInt(form.completion_pct),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-50">
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-400 mb-1.5">Farol</p>
          <select
            value={form.traffic_light}
            onChange={e => setForm(f => ({ ...f, traffic_light: e.target.value }))}
            className="w-full h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
          >
            <option value="VERDE">Verde - no prazo</option>
            <option value="AMARELO">Amarelo - atenção</option>
            <option value="VERMELHO">Vermelho - atrasado</option>
          </select>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1.5">Fase atual</p>
          <select
            value={form.current_phase}
            onChange={e => setForm(f => ({ ...f, current_phase: e.target.value }))}
            className="w-full h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
          >
            <option value="RECEBIDA">Recebida</option>
            <option value="ENTREVISTA_SOLICITANTE">Entrevista com o solicitante</option>
            <option value="LEVANTAMENTO_REQUISITOS">Levantamento de requisitos</option>
            <option value="ANALISE_SOLUCAO">Análise da solução</option>
            <option value="DESENVOLVIMENTO">Desenvolvimento</option>
            <option value="TESTES">Testes</option>
            <option value="VALIDACAO_SOLICITANTE">Validação com o solicitante</option>
            <option value="ENTREGUE">Entregue</option>
          </select>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1.5">Conclusão (%)</p>
          <input
            type="number"
            min="0"
            max="100"
            value={form.completion_pct}
            onChange={e => setForm(f => ({ ...f, completion_pct: e.target.value }))}
            className="w-full h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs bg-primary-600 text-white px-4 py-1.5 rounded-lg hover:bg-primary-800 disabled:opacity-50 transition-colors font-medium"
        >
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isPrivileged } = useAuth()

  const [project, setProject] = useState(null)
  const [statusUpdates, setStatusUpdates] = useState([])
  const [requirement, setRequirement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showStatusForm, setShowStatusForm] = useState(false)
  const [statusForm, setStatusForm] = useState({ description: '', highlights: '', next_steps: '' })
  const [statusLoading, setStatusLoading] = useState(false)
  const [editingReq, setEditingReq] = useState(false)
  const [reqContent, setReqContent] = useState('')
  const [reqLoading, setReqLoading] = useState(false)
  const [reqTab, setReqTab] = useState('conteudo')
  const [tasks, setTasks] = useState([])
  const [taskTab, setTaskTab] = useState('pendentes')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignee_id: '', due_date: '' })
  const [taskLoading, setTaskLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [toast, setToast] = useState('')

  const fetchProject = async () => {
    try {
      const response = await projectsService.getById(id)
      setProject(response.data)
      setStatusUpdates(response.data.status_updates || [])
      const req = response.data.requirements?.[0] || null
      setRequirement(req)
      setReqContent(req?.content || '')
      setReqTab('conteudo')
      const isFromTI = user?.area === 'Tecnologia da Informação' || user?.role === 'ANALISTA_MASTER'
        if (isFromTI) {
          const [tasksRes, usersRes] = await Promise.all([
            tasksService.list(id),
            api.get('/users')
          ])
          setTasks(tasksRes.data)
          setUsers(usersRes.data)
        }
    } catch (err) {
      if (err.response?.status === 404) {
        setToast('Projeto não encontrado ou foi excluído.')
        setTimeout(() => navigate('/projetos'), 3000)
      } else {
        setError('Erro ao carregar projeto.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProject() }, [id])

  const isMember = project?.members?.some(m => m.user_id === user?.id) ?? false
  const isOwner = project?.owner_id === user?.id ?? false
  const isResponsible = project?.requesters?.some(
    r => r.user_id === user?.id && r.type === 'RESPONSAVEL'
  ) ?? false
  const isRequester = project?.requesters?.some(
    r => r.user_id === user?.id && r.type === 'SOLICITANTE'
  ) ?? false
  const isFromTI = user?.area === 'Tecnologia da Informação' || user?.role === 'ANALISTA_MASTER'
  const canEdit = (isFromTI || user?.role === 'ANALISTA_MASTER') && (isResponsible || isRequester || user?.role === 'ANALISTA_MASTER')
  const canDelete = (isFromTI || user?.role === 'ANALISTA_MASTER') && (isResponsible || isRequester || user?.role === 'ANALISTA_MASTER')
  const canManageTasks = isFromTI && (
    user?.role === 'ANALISTA_MASTER' ||
    user?.role === 'GERENTE' ||
    user?.role === 'COORDENADOR' ||
    isResponsible ||
    isRequester ||
    isMember
  )

  const handleCreateStatus = async (e) => {
    e.preventDefault()
    setStatusLoading(true)
    try {
      await statusService.create(id, statusForm)
      setStatusForm({ description: '', highlights: '', next_steps: '' })
      setShowStatusForm(false)
      fetchProject()
    } catch (err) {
      console.error(err)
    } finally {
      setStatusLoading(false)
    }
  }

  const handleAddRisk = async (statusUpdateId, data) => {
    await risksService.create(statusUpdateId, data)
    fetchProject()
  }

  const handleUpdateRisk = async (statusUpdateId, riskId, data) => {
    await risksService.update(statusUpdateId, riskId, data)
    fetchProject()
  }

  const handleDeleteRisk = async (statusUpdateId, riskId) => {
    await risksService.delete(statusUpdateId, riskId)
    fetchProject()
  }

  const handleSaveRequirement = async () => {
    setReqLoading(true)
    try {
      if (requirement) {
        await requirementsService.update(id, { content: reqContent })
      } else {
        await requirementsService.create(id, { content: reqContent })
      }
      setEditingReq(false)
      fetchProject()
    } catch (err) {
      console.error(err)
    } finally {
      setReqLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.')) return
    try {
      await projectsService.delete(id)
      navigate('/projetos')
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao excluir projeto.')
    }
  }

  const handleCreateTask = async () => {
    if (!taskForm.title) return
    setTaskLoading(true)
    try {
      await tasksService.create(id, { ...taskForm, phase: project?.current_phase || null })
      setTaskForm({ title: '', description: '', assignee_id: '', due_date: '' })
      setShowTaskForm(false)
      fetchProject()
    } catch (err) {
      console.error(err)
    } finally {
      setTaskLoading(false)
    }
  }

  const handleCompleteTask = async (taskId) => {
    try {
      await tasksService.complete(id, taskId)
      fetchProject()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Excluir esta tarefa?')) return
    try {
      await tasksService.delete(id, taskId)
      fetchProject()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-400">Carregando projeto...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-red-400">{error || 'Projeto não encontrado.'}</p>
        </div>
      </div>
    )
  }

  const priority = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG[3]
  const progressColor = FAROL_COLOR[project.traffic_light] || 'primary'
  const goLive = new Date(project.go_live).toLocaleDateString('pt-BR')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <span>⚠️</span>
          <span>{toast}</span>
          <span className="text-gray-400">Redirecionando...</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-6">

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
            >
              ← Voltar
            </button>
            <span className="text-xs text-gray-300">/</span>
            <span className="text-xs text-gray-500 truncate max-w-xs">{project.title}</span>
          </div>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              Excluir projeto
            </button>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-base font-medium text-gray-900 mb-2">{project.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="purple">{project.area}</Badge>
                <Badge variant="gray">
                  {project.execution_type === 'INTERNA' ? 'Interna' : 'Fornecedor externo'}
                </Badge>
                <Badge variant={priority.variant}>{priority.label}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isFromTI && (
                <PDFExport project={project} statusUpdates={statusUpdates} />
              )}
              <Farol value={project.traffic_light} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-2">Solicitante(s)</p>
              {project.requesters?.filter(r => r.type === 'SOLICITANTE').length > 0 ? (
                <div className="flex flex-col gap-1">
                  {project.requesters
                    .filter(r => r.type === 'SOLICITANTE')
                    .map(r => (
                      <div key={r.id} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{r.user.area}</span>
                        <div className="w-px h-3 bg-gray-200" />
                        <span className="text-sm font-medium text-gray-800">{r.user.name}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-800">{project.requester_name || '—'}</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-2">Responsável(is)</p>
              {project.requesters?.filter(r => r.type === 'RESPONSAVEL').length > 0 ? (
                <div className="flex flex-col gap-1">
                  {project.requesters
                    .filter(r => r.type === 'RESPONSAVEL')
                    .map(r => (
                      <div key={r.id} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{r.user.area}</span>
                        <div className="w-px h-3 bg-gray-200" />
                        <span className="text-sm font-medium text-gray-800">{r.user.name}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-800">{project.owner?.name || '—'}</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Go-live</p>
              <p className="text-sm font-medium text-gray-800">{goLive}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Orçamento</p>
              {project.budget_planned ? (
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-gray-800">
                    Planejado: R$ {Number(project.budget_planned).toLocaleString('pt-BR')}
                  </p>
                  <p className={`text-sm font-medium ${
                    project.budget_actual > project.budget_planned
                      ? 'text-red-500'
                      : 'text-teal-600'
                  }`}>
                    Realizado: {project.budget_actual
                      ? `R$ ${Number(project.budget_actual).toLocaleString('pt-BR')}`
                      : '—'}
                  </p>
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-800">—</p>
              )}
            </div>
          </div>

          {project.description && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-gray-400">Conclusão</p>
                <p className="text-xs font-medium text-gray-600">{project.completion_pct}%</p>
              </div>
              <ProgressBar value={project.completion_pct} color={progressColor} showLabel={false} />
            </div>
          )}

          <PhaseStrip currentPhase={project.current_phase} />

          {(user?.area === 'Tecnologia da Informação' || user?.role === 'ANALISTA_MASTER') && (
            <ControlPanel
              project={project}
              onSave={async (data) => {
                await projectsService.update(id, data)
                if (data.current_phase === 'ENTREGUE' || data.completion_pct === 100) {
                  navigate('/projetos')
                } else {
                  fetchProject()
                }
              }}
            />
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-medium text-gray-900">Status report</h2>
            {canEdit && (
              <button
                onClick={() => setShowStatusForm(!showStatusForm)}
                className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 transition-colors"
              >
                + Novo status
              </button>
            )}
          </div>

          {showStatusForm && (
            <form onSubmit={handleCreateStatus} className="border border-gray-100 rounded-xl p-4 mb-5 bg-gray-50 flex flex-col gap-3">
              <p className="text-xs font-medium text-gray-600">Nova atualização</p>
              <div>
                <p className="text-xs text-gray-400 mb-1">Status geral</p>
                <textarea
                  value={statusForm.description}
                  onChange={e => setStatusForm({ ...statusForm, description: e.target.value })}
                  rows={2}
                  placeholder="Como está o projeto essa semana?"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 resize-none bg-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Destaques do período</p>
                  <textarea
                    value={statusForm.highlights}
                    onChange={e => setStatusForm({ ...statusForm, highlights: e.target.value })}
                    rows={3}
                    placeholder="O que foi feito essa semana?"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 resize-none bg-white"
                    required
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Próximos passos</p>
                  <textarea
                    value={statusForm.next_steps}
                    onChange={e => setStatusForm({ ...statusForm, next_steps: e.target.value })}
                    rows={3}
                    placeholder="O que será feito na próxima semana?"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 resize-none bg-white"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={statusLoading}
                  className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 disabled:opacity-50"
                >
                  {statusLoading ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatusForm(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {statusUpdates.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">
              Nenhuma atualização registrada ainda.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {statusUpdates.map(update => (
              <StatusUpdateCard
                key={update.id}
                update={update}
                canEdit={canEdit}
                onAddRisk={handleAddRisk}
                onUpdateRisk={handleUpdateRisk}
                onDeleteRisk={handleDeleteRisk}
              />
            ))}
          </div>
        </div>

        {isFromTI && (
          <div className="bg-white border border-gray-100 rounded-xl p-6 mb-4">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-medium text-gray-900">Tarefas</h2>
                <div className="flex gap-1">
                  <button
                    onClick={() => setTaskTab('pendentes')}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${taskTab === 'pendentes' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Pendentes {tasks.filter(t => !t.completed).length > 0 && `(${tasks.filter(t => !t.completed).length})`}
                  </button>
                  <button
                    onClick={() => setTaskTab('concluidas')}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${taskTab === 'concluidas' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Concluídas {tasks.filter(t => t.completed).length > 0 && `(${tasks.filter(t => t.completed).length})`}
                  </button>
                </div>
              </div>
              {canManageTasks && (
                <button
                  onClick={() => setShowTaskForm(!showTaskForm)}
                  className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 transition-colors"
                >
                  + Nova tarefa
                </button>
              )}
            </div>

            {showTaskForm && (
              <div className="border border-gray-100 rounded-xl p-4 mb-5 bg-gray-50 flex flex-col gap-3">
                <p className="text-xs font-medium text-gray-600">Nova tarefa</p>
                <input
                  placeholder="Título da tarefa *"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                />
                <textarea
                  placeholder="Descrição (opcional)"
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={2}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 resize-none bg-white"
                />
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-gray-400">Responsável</p>
                    <select
                      value={taskForm.assignee_id}
                      onChange={e => setTaskForm({ ...taskForm, assignee_id: e.target.value })}
                      className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                    >
                      <option value="">Selecionar</option>
                      {project?.requesters?.filter(r => r.type === 'RESPONSAVEL').map(r => (
                        <option key={r.user_id} value={r.user_id}>{r.user.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-gray-400">Fase vinculada</p>
                    <div className="h-8 px-3 text-xs border border-gray-100 rounded-lg bg-gray-50 flex items-center text-gray-500">
                      {project?.current_phase || '—'}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-gray-400">Prazo</p>
                    <input
                      type="date"
                      value={taskForm.due_date}
                      onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                      className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateTask}
                    disabled={taskLoading}
                    className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 disabled:opacity-50"
                  >
                    {taskLoading ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => setShowTaskForm(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {tasks.filter(t => taskTab === 'pendentes' ? !t.completed : t.completed).length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">
                  {taskTab === 'pendentes' ? 'Nenhuma tarefa pendente.' : 'Nenhuma tarefa concluída.'}
                </p>
              ) : (
                tasks.filter(t => taskTab === 'pendentes' ? !t.completed : t.completed).map(task => (
                  <div key={task.id} className={`border rounded-xl p-4 ${task.completed ? 'border-teal-100 bg-teal-50/30' : 'border-gray-100 bg-white'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          disabled={task.author_id !== user?.id}
                          className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            task.completed
                              ? 'bg-teal-500 border-teal-500'
                              : 'border-gray-300 hover:border-primary-400'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          {task.completed && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {task.assignee && (
                              <span className="text-xs text-gray-400">→ {task.assignee.name}</span>
                            )}
                            {task.phase && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{task.phase}</span>
                            )}
                            {task.due_date && (
                              <span className={`text-xs ${new Date(task.due_date) < new Date() && !task.completed ? 'text-red-500' : 'text-gray-400'}`}>
                                {new Date(task.due_date).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                            <span className="text-xs text-gray-300">por {task.author.name}</span>
                          </div>
                        </div>
                      </div>
                      {canManageTasks && (
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="hover:opacity-70 transition-opacity shrink-0"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {(user?.area === 'Tecnologia da Informação' || user?.role === 'ANALISTA_MASTER') && (
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-medium text-gray-900">Requisitos de software</h2>
                <div className="flex gap-1">
                  <button
                    onClick={() => setReqTab('conteudo')}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                      reqTab === 'conteudo'
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Conteúdo
                  </button>
                  <button
                    onClick={() => setReqTab('historico')}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                      reqTab === 'historico'
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Histórico {requirement?.history?.length > 0 && `(${requirement.history.length})`}
                  </button>
                </div>
              </div>
              {canEdit && !editingReq && reqTab === 'conteudo' && (
                <>
                  {requirement ? (
                    <button
                      onClick={() => setEditingReq(true)}
                      className="hover:opacity-70 transition-opacity"
                      title="Editar requisitos"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingReq(true)}
                      className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 transition-colors font-medium"
                    >
                      + Adicionar
                    </button>
                  )}
                </>
              )}
            </div>

            {reqTab === 'conteudo' && (
              <>
                {editingReq ? (
                  <div className="flex flex-col gap-3">
                    <textarea
                      value={reqContent}
                      onChange={e => setReqContent(e.target.value)}
                      rows={10}
                      placeholder="Documente os requisitos do projeto aqui..."
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-600 resize-none font-mono bg-gray-50"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveRequirement}
                        disabled={reqLoading}
                        className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 disabled:opacity-50"
                      >
                        {reqLoading ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button
                        onClick={() => setEditingReq(false)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {requirement ? (
                      <>
                        <div
                          className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: requirement.content }}
                        />
                        <p className="text-xs text-gray-300 mt-4">
                          Última edição: {new Date(requirement.updated_at).toLocaleDateString('pt-BR')} · {requirement.author?.name}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-8">
                        Nenhum requisito cadastrado ainda.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {reqTab === 'historico' && (
              <div className="flex flex-col gap-3">
                {!requirement?.history?.length ? (
                  <p className="text-xs text-gray-400 text-center py-8">
                    Nenhuma alteração registrada ainda.
                  </p>
                ) : (
                  <>
                    <div className="border border-primary-100 rounded-xl p-4 bg-primary-50/20">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-600">Versão atual</span>
                        <span className="text-xs text-gray-400">
                          {new Date(requirement.updated_at).toLocaleDateString('pt-BR')} às {new Date(requirement.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="font-mono text-xs bg-white rounded-lg p-3 max-h-48 overflow-y-auto">
                        {requirement.content.split('\n').map((line, i) => (
                          <div key={i} className="px-1 text-gray-600">{line || ' '}</div>
                        ))}
                      </div>
                    </div>

                    {requirement.history.map((entry, index) => {
                      const curr = entry.content_snapshot
                      const next = index === 0 ? requirement.content : requirement.history[index - 1]?.content_snapshot || ''
                      const currLines = curr.split('\n')
                      const nextLines = next.split('\n')

                      return (
                        <div key={entry.id} className="border border-gray-100 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-gray-600">{entry.editor?.name}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(entry.edited_at).toLocaleDateString('pt-BR')} às {new Date(entry.edited_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="font-mono text-xs bg-gray-50 rounded-lg p-3 flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                            {currLines.map((line, i) => {
                              const isRemoved = !nextLines.includes(line) && line.trim() !== ''
                              return (
                                <div
                                  key={i}
                                  className={`px-1 rounded ${isRemoved ? 'bg-red-50 text-red-700' : 'text-gray-600'}`}
                                >
                                  {isRemoved ? '- ' : '  '}{line || ' '}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}