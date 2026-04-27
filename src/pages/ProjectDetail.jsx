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
import { scopeService } from '../services/scope.service'
import { LEVEL_CONFIG } from '../utils/pdfStyles'
// import { MarkdownEditor } from '../components/ui/MarkdownEditor'
// import { MarkdownContent } from '../components/ui/MarkdownContent'

const STAGES = [
  { key: 'PLANEJAMENTO', label: '1. Planejamento' },
  { key: 'EXECUCAO', label: '2. Execução' },
  { key: 'GO_LIVE', label: '3. Go-live' },
  { key: 'SUPORTE', label: '4. Suporte pós go-live' },
]

const FAROL_COLOR = {
  VERDE: 'green',
  AMARELO: 'amber',
  VERMELHO: 'red',
}

function ControlPanel({ project, scopeItems = [], onSave }) {
  const [form, setForm] = useState({
    traffic_light: project.traffic_light,
    current_phase: project.current_phase,
    completion_pct: project.completion_pct,
  })
  const [saving, setSaving] = useState(false)

  const stageComplete = (stageKey) => {
    const approved = scopeItems.filter(s => s.status === 'APROVADO')
    const items = approved.filter(s => s.stage === stageKey)
    if (items.length === 0) return true
    return items.every(s => s.completion_date !== null)
  }

  const phaseBlocked = (phase) => {
    const rules = {
      DESENVOLVIMENTO: !stageComplete('PLANEJAMENTO'),
      ENTREGUE: !stageComplete('EXECUCAO'),
      SUPORTE: !stageComplete('GO_LIVE'),
    }
    return rules[phase] || false
  }

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
            <option value="DESENVOLVIMENTO" disabled={phaseBlocked('DESENVOLVIMENTO')}>
              Desenvolvimento{phaseBlocked('DESENVOLVIMENTO') ? ' 🔒' : ''}
            </option>
            <option value="TESTES">Testes</option>
            <option value="VALIDACAO_SOLICITANTE">Validação com o solicitante</option>
            <option value="ENTREGUE" disabled={phaseBlocked('ENTREGUE')}>
              Entregue{phaseBlocked('ENTREGUE') ? ' 🔒' : ''}
            </option>
            <option value="SUPORTE" disabled={phaseBlocked('SUPORTE')}>
              Suporte pós go-live{phaseBlocked('SUPORTE') ? ' 🔒' : ''}
            </option>
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
  const [statusForm, setStatusForm] = useState({ description: '', highlights: [''], next_steps: [''], reported_by_name: '' })
  const [statusLoading, setStatusLoading] = useState(false)
  const [editingReq, setEditingReq] = useState(false)
  const [reqContent, setReqContent] = useState('')
  const [reqLoading, setReqLoading] = useState(false)
  const [reqTab, setReqTab] = useState('conteudo')
  const [tasks, setTasks] = useState([])
  const [taskTab, setTaskTab] = useState('pendentes')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignee_id: '', start_date: '', end_date: '', scope_item_id: null })
  const [taskLoading, setTaskLoading] = useState(false)
  const [scopeItems, setScopeItems] = useState([])
  const [showScopeForm, setShowScopeForm] = useState(false)
  const [scopeForm, setScopeForm] = useState({ title: '', description: '', stage: '', start_date: '', end_date: '', completion_pct: 0, completion_date: '' })
  const [scopeLoading, setScopeLoading] = useState(false)
  const [expandedScope, setExpandedScope] = useState({})
  const [editingScopeItem, setEditingScopeItem] = useState(null)
  const [editScopeForm, setEditScopeForm] = useState({})
  const [users, setUsers] = useState([])
  const [toast, setToast] = useState('')
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [selectedPendingIds, setSelectedPendingIds] = useState([])
  const [editingGoLive, setEditingGoLive] = useState(false)
  const [goLiveValue, setGoLiveValue] = useState('')

  const fetchProject = async () => {
    try {
      const response = await projectsService.getById(id)
      setProject(response.data)
      setStatusUpdates(response.data.status_updates || [])
      const req = response.data.requirements?.[0] || null
      setRequirement(req)
      setReqContent(req?.content || '')
      setReqTab('conteudo')
      const isFromTI = user?.area === 'Tecnologia da Informação' || ['ANALISTA_MASTER', 'ANALISTA_TESTADOR'].includes(user?.role)
      if (isFromTI) {
        const [tasksRes, usersRes] = await Promise.all([
          tasksService.list(id),
          api.get('/users')
        ])
        setTasks(tasksRes.data)
        const scopeRes = await scopeService.list(id)
        setScopeItems(scopeRes.data)
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
  const isResponsible = project?.requesters?.some(r => r.user_id === user?.id && r.type === 'RESPONSAVEL') ?? false
  const isRequester = project?.requesters?.some(r => r.user_id === user?.id && r.type === 'SOLICITANTE') ?? false
  const isFromTI = user?.area === 'Tecnologia da Informação' || ['ANALISTA_MASTER', 'ANALISTA_TESTADOR'].includes(user?.role)
  const canEdit = ['ANALISTA_MASTER', 'ANALISTA_TESTADOR'].includes(user?.role) || isResponsible || isRequester
  const canDelete = ['ANALISTA_MASTER', 'ANALISTA_TESTADOR'].includes(user?.role) || isResponsible || isRequester
  const canApproveScope = isFromTI && ['ANALISTA_MASTER', 'ANALISTA_TESTADOR', 'GERENTE', 'COORDENADOR'].includes(user?.role)
  const canManageTasks = isFromTI && (
    ['ANALISTA_MASTER', 'ANALISTA_TESTADOR'].includes(user?.role) ||
    user?.role === 'GERENTE' ||
    user?.role === 'COORDENADOR' ||
    isResponsible || isRequester || isMember
  )

  const handleCreateStatus = async (e) => {
    e.preventDefault()
    setStatusLoading(true)
    try {
      await statusService.create(id, {
        ...statusForm,
        highlights: statusForm.highlights.join('\n'),
        next_steps: statusForm.next_steps.join('\n'),
        reported_by_name: statusForm.reported_by_name || null,
      })
      setStatusForm({ description: '', highlights: [''], next_steps: [''] })
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
      await tasksService.create(id, {
        ...taskForm,
        phase: project?.current_phase || null,
        due_date: taskForm.end_date || null,
      })
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

  const handleCreateScopeItem = async () => {
    if (!scopeForm.title) return
    setScopeLoading(true)
    try {
      await scopeService.create(id, scopeForm)
      setScopeForm({ title: '', description: '', phase: '', start_date: '', end_date: '', completion_pct: 0 })
      setShowScopeForm(false)
      fetchProject()
    } catch (err) {
      console.error(err)
    } finally {
      setScopeLoading(false)
    }
  }

  const handleRequestApproval = async () => {
    try {
      await scopeService.requestApproval(id)
      fetchProject()
    } catch (err) {
      console.error(err)
    }
  }

  const handleApproveScope = async () => {
    try {
      await scopeService.approve(id)
      fetchProject()
    } catch (err) {
      console.error(err)
    }
  }

  const handleRejectScope = async () => {
    try {
      await scopeService.reject(id)
      fetchProject()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteScopeItem = async (scopeId) => {
    if (!confirm('Excluir esta atividade do escopo?')) return
    try {
      await scopeService.delete(id, scopeId)
      fetchProject()
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateScopeItem = async () => {
    if (!editScopeForm.title) return
    try {
      await scopeService.update(id, editingScopeItem, editScopeForm)
      setEditingScopeItem(null)
      setEditScopeForm({})
      fetchProject()
    } catch (err) {
      console.error(err)
    }
  }

  const handleApproveItems = async () => {
    if (selectedPendingIds.length === 0) return
    try {
      await scopeService.approveItems(id, selectedPendingIds)
      setShowPendingModal(false)
      setSelectedPendingIds([])
      fetchProject()
    } catch (err) {
      console.error(err)
    }
  }

  const handleRejectItems = async () => {
    if (selectedPendingIds.length === 0) return
    try {
      await scopeService.rejectItems(id, selectedPendingIds)
      setShowPendingModal(false)
      setSelectedPendingIds([])
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

  const progressColor = FAROL_COLOR[project.traffic_light] || 'primary'
  const goLive = project.go_live ? new Date(project.go_live).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Sem previsão'

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

      {showPendingModal && (() => {
        const pendingItems = scopeItems.filter(s =>
          s.status === 'AGUARDANDO_APROVACAO' || s.pending_action
        )
        const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'

        return (
          <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowPendingModal(false) }}
          >
            <div className="bg-white rounded-xl border border-gray-100 w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Pendências do cronograma</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{pendingItems.length} item{pendingItems.length !== 1 ? 's' : ''} aguardando aprovação</p>
                </div>
                <button onClick={() => setShowPendingModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-3">
                {pendingItems.map(item => {
                  const isSelected = selectedPendingIds.includes(item.id)
                  const isNew = item.status === 'AGUARDANDO_APROVACAO' && !item.pending_action
                  const isEdit = item.pending_action === 'EDITAR'
                  const isDelete = item.pending_action === 'EXCLUIR'

                  const tagCls = isNew
                    ? 'bg-blue-50 text-blue-600'
                    : isEdit ? 'bg-amber-50 text-amber-600'
                    : 'bg-red-50 text-red-500'
                  const tagLabel = isNew ? 'Novo' : isEdit ? 'Edição' : 'Exclusão'

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedPendingIds(prev =>
                        prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id]
                      )}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-lg border transition-colors ${
                        isSelected ? 'border-primary-300 bg-primary-50/40' : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                            <polyline points="1,5 4,8 9,2" stroke="white" strokeWidth="1.5"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagCls}`}>{tagLabel}</span>
                          <span className="text-xs font-medium text-gray-800 truncate">{item.title}</span>
                        </div>

                        {isNew && (
                          <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                            <span>Etapa: <span className="text-gray-700">{item.stage || '—'}</span></span>
                            <span>Início: <span className="text-gray-700">{formatDate(item.start_date)}</span></span>
                            <span>Fim: <span className="text-gray-700">{formatDate(item.end_date)}</span></span>
                          </div>
                        )}

                        {isEdit && (
                          <div className="flex flex-col gap-1 text-xs">
                            {item.pending_title && item.pending_title !== item.title && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">Título:</span>
                                <span className="line-through text-red-400">{item.title}</span>
                                <span className="text-gray-300">→</span>
                                <span className="text-teal-600 font-medium">{item.pending_title}</span>
                              </div>
                            )}
                            {item.pending_start_date && formatDate(item.pending_start_date) !== formatDate(item.start_date) && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">Início:</span>
                                <span className="line-through text-red-400">{formatDate(item.start_date)}</span>
                                <span className="text-gray-300">→</span>
                                <span className="text-teal-600 font-medium">{formatDate(item.pending_start_date)}</span>
                              </div>
                            )}
                            {item.pending_end_date && formatDate(item.pending_end_date) !== formatDate(item.end_date) && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">Fim:</span>
                                <span className="line-through text-red-400">{formatDate(item.end_date)}</span>
                                <span className="text-gray-300">→</span>
                                <span className="text-teal-600 font-medium">{formatDate(item.pending_end_date)}</span>
                              </div>
                            )}
                            {item.pending_completion_pct !== null && item.pending_completion_pct !== item.completion_pct && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">%:</span>
                                <span className="line-through text-red-400">{item.completion_pct}%</span>
                                <span className="text-gray-300">→</span>
                                <span className="text-teal-600 font-medium">{item.pending_completion_pct}%</span>
                              </div>
                            )}
                            {item.pending_description && item.pending_description !== item.description && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">Descrição alterada</span>
                              </div>
                            )}
                          </div>
                        )}

                        {isDelete && (
                          <p className="text-xs text-red-400">Esta atividade será excluída permanentemente.</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <p className="text-xs text-gray-400">
                  {selectedPendingIds.length} de {pendingItems.length} selecionado{selectedPendingIds.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPendingIds(
                      selectedPendingIds.length === pendingItems.length ? [] : pendingItems.map(i => i.id)
                    )}
                    className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {selectedPendingIds.length === pendingItems.length ? 'Desmarcar todos' : 'Selecionar todos'}
                  </button>
                  <button
                    onClick={handleRejectItems}
                    disabled={selectedPendingIds.length === 0}
                    className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
                  >
                    Rejeitar selecionados
                  </button>
                  <button
                    onClick={handleApproveItems}
                    disabled={selectedPendingIds.length === 0}
                    className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 disabled:opacity-40 transition-colors font-medium"
                  >
                    Aprovar selecionados
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      <div className="max-w-6xl mx-auto px-6 py-6">

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/projetos')}
              className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
            >
              ← Projetos
            </button>
            <span className="text-xs text-gray-300">/</span>
            <span className="text-xs text-gray-500 truncate max-w-xs">{project.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => navigate(`/projetos/${id}/editar`)}
                className="text-xs text-primary-600 hover:text-primary-800 border border-primary-200 hover:border-primary-400 px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                Editar projeto
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                Excluir projeto
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-base font-medium text-gray-900 mb-2">{project.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="purple">{project.area}</Badge>
                {project.business_unit && <Badge variant="violet">{project.business_unit}</Badge>}
                <Badge variant="gray">
                  {project.execution_type === 'INTERNA' ? 'Interna' : 'Fornecedor externo'}
                </Badge>
                {project.level ? (
                  <span style={{
                    background: LEVEL_CONFIG[project.level]?.bg,
                    color: LEVEL_CONFIG[project.level]?.text,
                  }} className="text-xs px-2.5 py-1 rounded-full font-medium">
                    {LEVEL_CONFIG[project.level]?.label}
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full">
                    Não definido
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isFromTI && <PDFExport project={project} statusUpdates={statusUpdates} />}
              <Farol value={project.traffic_light} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-2">Solicitante(s)</p>
              {project.requesters?.filter(r => r.type === 'SOLICITANTE').length > 0 ? (
                <div className="flex flex-col gap-1">
                  {project.requesters.filter(r => r.type === 'SOLICITANTE').map(r => (
                    <div key={r.id} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{r.user?.area || r.manual_area}</span>
                      <div className="w-px h-3 bg-gray-200" />
                      <span className="text-sm font-medium text-gray-800">{r.user?.name || r.manual_name}</span>
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
                  {project.requesters.filter(r => r.type === 'RESPONSAVEL').map(r => (
                    <div key={r.id} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{r.user?.area || r.manual_area}</span>
                      <div className="w-px h-3 bg-gray-200" />
                      <span className="text-sm font-medium text-gray-800">{r.user?.name || r.manual_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-800">{project.owner?.name || '—'}</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Data de início</p>
              <p className="text-sm font-medium text-gray-800">
                {project.start_date ? new Date(project.start_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-400">Go-live</p>
                {canEdit && !editingGoLive && (
                  <button
                    onClick={() => { setEditingGoLive(true); setGoLiveValue(project.go_live ? project.go_live.split('T')[0] : '') }}
                    className="hover:opacity-70 transition-opacity"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                )}
              </div>
              {editingGoLive ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="date"
                    value={goLiveValue}
                    onChange={e => setGoLiveValue(e.target.value)}
                    className="h-7 px-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white flex-1"
                  />
                  <button
                    onClick={async () => {
                      await projectsService.update(id, { go_live: goLiveValue || null })
                      setEditingGoLive(false)
                      fetchProject()
                    }}
                    className="text-xs bg-primary-600 text-white px-2 py-1 rounded-lg hover:bg-primary-800"
                  >
                    Salvar
                  </button>
                  <button onClick={() => setEditingGoLive(false)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-800">{goLive}</p>
              )}
              {project.go_live_history?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1.5">Histórico de alterações</p>
                  <div className="flex flex-col gap-1">
                    {project.go_live_history.map(h => (
                      <div key={h.id} className="flex items-center gap-1.5 text-xs text-gray-400">
                        <span>{new Date(h.previous_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                        <span>→</span>
                        <span className="text-gray-600 font-medium">{new Date(h.new_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                        <span>·</span>
                        <span>{h.changed_by_user?.name}</span>
                        <span>·</span>
                        <span>{new Date(h.changed_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Custos</p>
              {project.costs?.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {project.costs.map(c => (
                    <div key={c.id} className="flex flex-col gap-0.5">
                      <p className="text-xs text-gray-500 font-medium">{c.name}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          Planejado: <span className="font-medium text-gray-700">R$ {Number(c.budget_planned).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </span>
                        {c.budget_actual && (
                          <span className="text-xs text-gray-400">
                            Realizado: <span className={`font-medium ${Number(c.budget_actual) > Number(c.budget_planned) ? 'text-red-500' : 'text-teal-600'}`}>
                              R$ {Number(c.budget_actual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-800">—</p>
              )}
            </div>
          </div>

          {project.description && (
            <div className="bg-gray-50 rounded-lg p-3 mb-5">
              <p className="text-xs text-gray-400 mb-1">Descrição</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-400">Conclusão</p>
              <p className="text-xs font-medium text-gray-600">{project.completion_pct}%</p>
            </div>
            <ProgressBar value={project.completion_pct} color={progressColor} showLabel={false} />
          </div>

          <PhaseStrip currentPhase={project.current_phase} />

          {['ANALISTA_MASTER', 'ANALISTA_TESTADOR', 'GERENTE', 'COORDENADOR'].includes(user?.role) && (
            <ControlPanel
              project={project}
              scopeItems={scopeItems}
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
                <p className="text-xs text-gray-400 mb-1">
                  Autor do status <span className="text-gray-300">(opcional — preencha se estiver cadastrando por outra pessoa)</span>
                </p>
                <select
                  value={statusForm.reported_by_name || ''}
                  onChange={e => setStatusForm({ ...statusForm, reported_by_name: e.target.value })}
                  className="w-full h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white mb-3"
                >
                  <option value="">Eu mesmo ({user?.name})</option>
                  {project?.requesters?.filter(r => r.user_id !== user?.id || r.manual_name).map(r => (
                    <option key={r.id} value={r.user?.name || r.manual_name}>
                      {r.user?.name || r.manual_name} ({r.type === 'SOLICITANTE' ? 'Solicitante' : 'Responsável'})
                    </option>
                  ))}
                  {project?.members?.filter(m => m.user_id !== user?.id || m.manual_name).map(m => (
                    <option key={m.id} value={m.user?.name || m.manual_name}>
                      {m.user?.name || m.manual_name} (Envolvido)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Status geral</p>
                <textarea
                  value={statusForm.description}
                  onChange={e => setStatusForm({ ...statusForm, description: e.target.value })}
                  rows={2}
                  maxLength={1000}
                  placeholder="Como está o projeto essa semana?"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 resize-none bg-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Destaques do período</p>
                  {statusForm.highlights.map((item, i) => (
                    <div key={i} className="flex items-center gap-1 mb-1">
                      <input
                        value={item}
                        maxLength={300}
                        onChange={e => {
                          const arr = [...statusForm.highlights]
                          arr[i] = e.target.value
                          setStatusForm({ ...statusForm, highlights: arr })
                        }}
                        placeholder={`Item ${i + 1}`}
                        className="flex-1 h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                      />
                      <button type="button" onClick={() => {
                        setStatusForm({ ...statusForm, highlights: statusForm.highlights.filter((_, idx) => idx !== i) })
                      }} className="hover:opacity-70 transition-opacity shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => setStatusForm({ ...statusForm, highlights: [...statusForm.highlights, ''] })}
                    className="text-xs text-primary-600 hover:text-primary-800 mt-1">
                    {statusForm.highlights.length === 0 ? '+ Adicionar item' : '+ Adicionar'}
                  </button>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Próximos passos</p>
                  {statusForm.next_steps.map((item, i) => (
                    <div key={i} className="flex items-center gap-1 mb-1">
                      <input
                        value={item}
                        maxLength={300}
                        onChange={e => {
                          const arr = [...statusForm.next_steps]
                          arr[i] = e.target.value
                          setStatusForm({ ...statusForm, next_steps: arr })
                        }}
                        placeholder={`Item ${i + 1}`}
                        className="flex-1 h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                      />
                      <button type="button" onClick={() => {
                        setStatusForm({ ...statusForm, next_steps: statusForm.next_steps.filter((_, idx) => idx !== i) })
                      }} className="hover:opacity-70 transition-opacity shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => setStatusForm({ ...statusForm, next_steps: [...statusForm.next_steps, ''] })}
                    className="text-xs text-primary-600 hover:text-primary-800 mt-1">
                    {statusForm.next_steps.length === 0 ? '+ Adicionar item' : '+ Adicionar'}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={statusLoading}
                  className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 disabled:opacity-50">
                  {statusLoading ? 'Salvando...' : 'Salvar'}
                </button>
                <button type="button" onClick={() => setShowStatusForm(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {statusUpdates.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">Nenhuma atualização registrada ainda.</p>
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
                onUpdateStatus={async (statusId, data) => {
                  await statusService.update(id, statusId, data)
                  fetchProject()
                }}
                onDeleteStatus={async (statusId) => {
                  await statusService.delete(id, statusId)
                  fetchProject()
                }}
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
                  <button onClick={() => setTaskTab('pendentes')}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${taskTab === 'pendentes' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                    Pendentes {tasks.filter(t => !t.completed).length > 0 && `(${tasks.filter(t => !t.completed).length})`}
                  </button>
                  <button onClick={() => setTaskTab('concluidas')}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${taskTab === 'concluidas' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                    Concluídas {tasks.filter(t => t.completed).length > 0 && `(${tasks.filter(t => t.completed).length})`}
                  </button>
                </div>
              </div>
              {canManageTasks && (
                <button onClick={() => setShowTaskForm(!showTaskForm)}
                  className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 transition-colors">
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
                <div className="grid grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-gray-400">Responsável</p>
                    <select
                      value={taskForm.assignee_id}
                      onChange={e => setTaskForm({ ...taskForm, assignee_id: e.target.value })}
                      className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                    >
                      <option value="">Selecionar</option>
                      {project?.requesters?.filter(r => r.type === 'RESPONSAVEL' && r.user_id).map(r => (
                        <option key={r.user_id} value={r.user_id}>{r.user?.name || r.manual_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-gray-400">Atividade do escopo</p>
                    <select
                      value={taskForm.scope_item_id || ''}
                      onChange={e => setTaskForm({ ...taskForm, scope_item_id: e.target.value || null })}
                      className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                    >
                      <option value="">Nenhuma</option>
                      {scopeItems.map(s => (
                        <option key={s.id} value={s.id}>{s.display_title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-gray-400">Data de início</p>
                    <input type="date" value={taskForm.start_date}
                      onChange={e => setTaskForm({ ...taskForm, start_date: e.target.value })}
                      className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-gray-400">Data de conclusão</p>
                    <input type="date" value={taskForm.end_date || ''}
                      onChange={e => setTaskForm({ ...taskForm, end_date: e.target.value })}
                      className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreateTask} disabled={taskLoading}
                    className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 disabled:opacity-50">
                    {taskLoading ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button onClick={() => setShowTaskForm(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">
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
                            task.completed ? 'bg-teal-500 border-teal-500' : 'border-gray-300 hover:border-primary-400'
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
                            <p className="text-xs text-gray-400 mt-0.5 whitespace-pre-wrap">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {task.assignee && <span className="text-xs text-gray-400">→ {task.assignee.name}</span>}
                            {task.phase && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{task.phase}</span>}
                            {task.start_date && (
                              <span className="text-xs text-gray-400">
                                {new Date(task.start_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                              </span>
                            )}
                            {task.start_date && task.end_date && <span className="text-xs text-gray-300">→</span>}
                            {task.end_date && (
                              <span className={`text-xs ${new Date(task.end_date) < new Date() && !task.completed ? 'text-red-500' : 'text-gray-400'}`}>
                                {new Date(task.end_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                              </span>
                            )}
                            {task.start_date && task.end_date && (
                              <span className="text-xs text-gray-300">
                                ({Math.ceil((new Date(task.end_date) - new Date(task.start_date)) / (1000 * 60 * 60 * 24))} dias)
                              </span>
                            )}
                            <span className="text-xs text-gray-300">por {task.author.name}</span>
                          </div>
                        </div>
                      </div>
                      {canManageTasks && (
                        <button onClick={() => handleDeleteTask(task.id)} className="hover:opacity-70 transition-opacity shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
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

        {isFromTI && (
          <div className="bg-white border border-gray-100 rounded-xl p-6 mb-4">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-medium text-gray-900">Cronograma</h2>
                {scopeItems.length > 0 && (() => {
                  const allApproved = scopeItems.every(s => s.status === 'APROVADO')
                  const anyPending = scopeItems.some(s => s.status === 'AGUARDANDO_APROVACAO')
                  const anyPendingAction = scopeItems.some(s => s.pending_action)
                  if (allApproved && !anyPendingAction) return <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full">Aprovado</span>
                  if (anyPending) return <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">Aguardando aprovação</span>
                  if (anyPendingAction) return <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">Alteração pendente</span>
                  return <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">Rascunho</span>
                })()}
              </div>
              <div className="flex items-center gap-2">
                {canApproveScope && scopeItems.some(s => s.status === 'AGUARDANDO_APROVACAO' || s.pending_action) && (
                  <button
                    onClick={() => { setShowPendingModal(true); setSelectedPendingIds([]) }}
                    className="text-xs border border-amber-200 text-amber-600 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors">
                    Ver pendências
                  </button>
                )}
                {canEdit && scopeItems.some(s => s.status === 'RASCUNHO') && (
                  <button onClick={handleRequestApproval}
                    className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                    Solicitar aprovação
                  </button>
                )}
                {canEdit && (
                  <button onClick={() => setShowScopeForm(!showScopeForm)}
                    className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 transition-colors">
                    + Nova atividade
                  </button>
                )}
                {canApproveScope && scopeItems.some(s => s.status === 'AGUARDANDO_APROVACAO' || s.pending_action) && (
                  <div className="flex gap-1">
                    <button onClick={handleApproveScope}
                      className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-800 transition-colors">
                      Aprovar
                    </button>
                    <button onClick={handleRejectScope}
                      className="text-xs bg-red-400 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {showScopeForm && (
              <div className="border border-gray-100 rounded-xl p-4 mb-5 bg-gray-50 flex flex-col gap-3">
                <p className="text-xs font-medium text-gray-600">Nova atividade</p>
                <input
                  placeholder="Título da atividade *"
                  value={scopeForm.title}
                  onChange={e => setScopeForm({ ...scopeForm, title: e.target.value })}
                  className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                />
                <textarea
                  placeholder="Descrição da atividade (opcional)"
                  value={scopeForm.description}
                  onChange={e => setScopeForm({ ...scopeForm, description: e.target.value })}
                  rows={2}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 resize-none bg-white"
                />
                <div className="grid grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-gray-400">Etapa *</p>
                    <select
                      value={scopeForm.stage || ''}
                      onChange={e => setScopeForm({ ...scopeForm, stage: e.target.value })}
                      className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                    >
                      <option value="">Selecionar</option>
                      {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-gray-400">Data de início</p>
                    <input type="date" value={scopeForm.start_date}
                      onChange={e => setScopeForm({ ...scopeForm, start_date: e.target.value })}
                      className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-gray-400">Data de fim</p>
                    <input type="date" value={scopeForm.end_date}
                      onChange={e => setScopeForm({ ...scopeForm, end_date: e.target.value })}
                      className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-gray-400">% inicial</p>
                    <input type="number" min="0" max="100" value={scopeForm.completion_pct}
                      onChange={e => setScopeForm({ ...scopeForm, completion_pct: parseInt(e.target.value) || 0 })}
                      className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreateScopeItem} disabled={scopeLoading}
                    className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 disabled:opacity-50">
                    {scopeLoading ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button onClick={() => setShowScopeForm(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {scopeItems.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Nenhuma atividade cadastrada ainda.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {STAGES.map(stage => {
                  const stageItems = scopeItems.filter(s => s.stage === stage.key)
                  const allDone = stageItems.length > 0 && stageItems.every(s => s.completion_date)
                  const hasItems = stageItems.length > 0
                  const doneCnt = stageItems.filter(s => s.completion_date).length
                  const isExpanded = expandedScope[`stage_${stage.key}`] !== false

                  return (
                    <div key={stage.key} className="border border-gray-100 rounded-xl overflow-hidden">
                      <div
                        className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => setExpandedScope(prev => ({ ...prev, [`stage_${stage.key}`]: !isExpanded }))}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          allDone ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
                        }`}>
                          {allDone && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <polyline points="1,5 4,8 9,2" stroke="white" strokeWidth="1.5"/>
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-800 flex-1">{stage.label}</span>
                        {hasItems && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            allDone ? 'bg-teal-50 text-teal-700' :
                            doneCnt > 0 ? 'bg-amber-50 text-amber-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {allDone ? 'Concluído' : doneCnt > 0 ? 'Em andamento' : 'Não iniciado'}
                          </span>
                        )}
                        {!hasItems && <span className="text-xs text-gray-300">Sem atividades</span>}
                        <span className="text-xs text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                      </div>

                      {isExpanded && (
                        <div className="px-4 py-3 bg-white flex flex-col gap-2">
                          {stageItems.length === 0 ? (
                            <p className="text-xs text-gray-300 text-center py-3">Nenhuma atividade nesta etapa.</p>
                          ) : (
                            <>
                              <div className="grid gap-0 px-2 py-1" style={{ gridTemplateColumns: '1fr 90px 90px 90px 55px 28px' }}>
                                <span className="text-xs text-gray-400">Atividade</span>
                                <span className="text-xs text-gray-400">Início</span>
                                <span className="text-xs text-gray-400">Fim</span>
                                <span className="text-xs text-gray-400">Conclusão</span>
                                <span className="text-xs text-gray-400">%</span>
                                <span></span>
                              </div>
                              {stageItems.map(item => {
                                const isItemExpanded = expandedScope[item.id]
                                const completedTasks = item.tasks?.filter(t => t.completed).length || 0
                                const totalTasks = item.tasks?.length || 0
                                const autoProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : null
                                const progress = autoProgress ?? item.display_completion_pct

                                return (
                                  <div key={item.id} className="border border-gray-100 rounded-lg overflow-hidden">
                                    <div
                                      className="grid items-center px-3 py-2.5 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                      style={{ gridTemplateColumns: '1fr 90px 90px 90px 55px 28px' }}
                                      onClick={() => setExpandedScope(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div
                                          onClick={e => {
                                            e.stopPropagation()
                                            if (canEdit && item.status !== 'AGUARDANDO_APROVACAO' && !item.pending_action) {
                                              const newDate = item.completion_date ? '' : new Date().toISOString().split('T')[0]
                                              scopeService.update(id, item.id, { completion_date: newDate }).then(fetchProject)
                                            }
                                          }}
                                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                                            item.completion_date ? 'bg-teal-500 border-teal-500' : 'border-gray-300 hover:border-teal-400'
                                          }`}
                                        >
                                          {item.completion_date && (
                                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                                              <polyline points="1,5 4,8 9,2" stroke="white" strokeWidth="1.5"/>
                                            </svg>
                                          )}
                                        </div>
                                        <span className="text-xs font-medium text-gray-800">{item.display_title}</span>
                                        {item.showing_pending && <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">Pendente</span>}
                                      </div>
                                      <span className="text-xs text-gray-400">
                                        {item.display_start_date ? new Date(item.display_start_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {item.display_end_date ? new Date(item.display_end_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'}
                                      </span>
                                      <span className={`text-xs font-medium ${item.completion_date ? 'text-teal-600' : 'text-gray-300'}`}>
                                        {item.completion_date ? new Date(item.completion_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'}
                                      </span>
                                      <span className={`text-xs font-medium ${progress === 100 ? 'text-teal-600' : progress > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                                        {progress}%
                                      </span>
                                      <span className="text-xs text-gray-400 text-center">{isItemExpanded ? '▼' : '▶'}</span>
                                    </div>

                                    {isItemExpanded && (
                                      <div className="px-4 py-3 border-t border-gray-100 bg-white">
                                        <p className="text-xs font-medium text-gray-500 mb-1">Descrição</p>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{item.display_description || '—'}</p>
                                        <p className="text-xs text-gray-400 mb-3">
                                          {totalTasks > 0 ? `${completedTasks} de ${totalTasks} tarefas concluídas` : 'Nenhuma tarefa vinculada'}
                                        </p>
                                        {canEdit && item.status !== 'AGUARDANDO_APROVACAO' && !item.pending_action && (
                                          editingScopeItem === item.id ? (
                                            <div className="flex flex-col gap-2 mt-2">
                                              <input
                                                value={editScopeForm.title || ''}
                                                onChange={e => setEditScopeForm({ ...editScopeForm, title: e.target.value })}
                                                placeholder="Título"
                                                className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                                              />
                                              <textarea
                                                value={editScopeForm.description || ''}
                                                onChange={e => setEditScopeForm({ ...editScopeForm, description: e.target.value })}
                                                rows={2}
                                                placeholder="Descrição"
                                                className="px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 resize-none bg-white"
                                              />
                                              <div className="grid grid-cols-4 gap-2">
                                                <div className="flex flex-col gap-1">
                                                  <p className="text-xs text-gray-400">Etapa</p>
                                                  <select
                                                    value={editScopeForm.stage || ''}
                                                    onChange={e => setEditScopeForm({ ...editScopeForm, stage: e.target.value })}
                                                    className="h-8 px-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                                                  >
                                                    <option value="">Selecionar</option>
                                                    {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                                  </select>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                  <p className="text-xs text-gray-400">Início</p>
                                                  <input type="date" value={editScopeForm.start_date || ''}
                                                    onChange={e => setEditScopeForm({ ...editScopeForm, start_date: e.target.value })}
                                                    className="h-8 px-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                                                  />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                  <p className="text-xs text-gray-400">Fim</p>
                                                  <input type="date" value={editScopeForm.end_date || ''}
                                                    onChange={e => setEditScopeForm({ ...editScopeForm, end_date: e.target.value })}
                                                    className="h-8 px-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                                                  />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                  <p className="text-xs text-gray-400">Conclusão</p>
                                                  <input type="date" value={editScopeForm.completion_date || ''}
                                                    onChange={e => setEditScopeForm({ ...editScopeForm, completion_date: e.target.value })}
                                                    className="h-8 px-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                                                  />
                                                </div>
                                              </div>
                                              <div className="flex gap-2">
                                                <button onClick={handleUpdateScopeItem}
                                                  className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800">
                                                  Salvar
                                                </button>
                                                <button onClick={() => { setEditingScopeItem(null); setEditScopeForm({}) }}
                                                  className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">
                                                  Cancelar
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex gap-2">
                                              <button
                                                onClick={() => {
                                                  setEditingScopeItem(item.id)
                                                  setEditScopeForm({
                                                    title: item.display_title,
                                                    description: item.display_description || '',
                                                    stage: item.stage || '',
                                                    start_date: item.display_start_date ? new Date(item.display_start_date).toISOString().split('T')[0] : '',
                                                    end_date: item.display_end_date ? new Date(item.display_end_date).toISOString().split('T')[0] : '',
                                                    completion_date: item.completion_date ? new Date(item.completion_date).toISOString().split('T')[0] : '',
                                                    completion_pct: item.display_completion_pct || 0,
                                                  })
                                                }}
                                                className="hover:opacity-70 transition-opacity" title="Editar">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                </svg>
                                              </button>
                                              <button
                                                onClick={() => handleDeleteScopeItem(item.id)}
                                                className="hover:opacity-70 transition-opacity" title="Excluir">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                                                </svg>
                                              </button>
                                            </div>
                                          )
                                        )}
                                        {item.pending_action === 'EXCLUIR' && (
                                          <p className="text-xs text-red-400">Exclusão aguardando aprovação do gestor</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                              <p className="text-xs text-gray-400 px-2 pt-1">{doneCnt} de {stageItems.length} atividades concluídas</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-400">
                {scopeItems.length} atividade{scopeItems.length !== 1 ? 's' : ''} · {scopeItems.filter(s => s.completion_date).length} concluída{scopeItems.filter(s => s.completion_date).length !== 1 ? 's' : ''}
              </span>
              {scopeItems.length > 0 && (
                <span className="text-xs font-medium text-gray-700">
                  Progresso geral: {Math.round(scopeItems.reduce((acc, s) => {
                    const total = s.tasks?.length || 0
                    const done = s.tasks?.filter(t => t.completed).length || 0
                    return acc + (total > 0 ? (done / total) * 100 : s.display_completion_pct || 0)
                  }, 0) / scopeItems.length)}%
                </span>
              )}
            </div>
          </div>
        )}

        {isFromTI && (
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-medium text-gray-900">Requisitos de software</h2>
                <div className="flex gap-1">
                  <button onClick={() => setReqTab('conteudo')}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${reqTab === 'conteudo' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                    Conteúdo
                  </button>
                  <button onClick={() => setReqTab('historico')}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${reqTab === 'historico' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                    Histórico {requirement?.history?.length > 0 && `(${requirement.history.length})`}
                  </button>
                </div>
              </div>
              {canEdit && !editingReq && reqTab === 'conteudo' && (
                <>
                  {requirement ? (
                    <button onClick={() => setEditingReq(true)} className="hover:opacity-70 transition-opacity" title="Editar requisitos">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  ) : (
                    <button onClick={() => setEditingReq(true)}
                      className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 transition-colors font-medium">
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
                      <button onClick={handleSaveRequirement} disabled={reqLoading}
                        className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 disabled:opacity-50">
                        {reqLoading ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button onClick={() => setEditingReq(false)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {requirement ? (
                      <>
                        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{requirement.content}</div>
                        <p className="text-xs text-gray-300 mt-4">
                          Última edição: {new Date(requirement.updated_at).toLocaleDateString('pt-BR')} · {requirement.author?.name}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-8">Nenhum requisito cadastrado ainda.</p>
                    )}
                  </div>
                )}
              </>
            )}

            {reqTab === 'historico' && (
              <div className="flex flex-col gap-3">
                {!requirement?.history?.length ? (
                  <p className="text-xs text-gray-400 text-center py-8">Nenhuma alteração registrada ainda.</p>
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
                                <div key={i} className={`px-1 rounded ${isRemoved ? 'bg-red-50 text-red-700' : 'text-gray-600'}`}>
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