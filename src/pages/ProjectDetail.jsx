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

  const fetchProject = async () => {
    try {
      const response = await projectsService.getById(id)
      setProject(response.data)
      setStatusUpdates(response.data.status_updates || [])
      const req = response.data.requirements?.[0] || null
      setRequirement(req)
      setReqContent(req?.content || '')
    } catch (err) {
      setError('Erro ao carregar projeto.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProject() }, [id])

  const isMember = project?.members?.some(m => m.user_id === user?.id)
  const isOwner = project?.owner_id === user?.id
  const canEdit = isOwner || isMember || isPrivileged()

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

      <div className="max-w-5xl mx-auto px-6 py-6">

        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => navigate('/projetos')}
            className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
          >
            ← Projetos
          </button>
          <span className="text-xs text-gray-300">/</span>
          <span className="text-xs text-gray-500 truncate max-w-xs">{project.title}</span>
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
            <Farol value={project.traffic_light} />
          </div>

          <div className="grid grid-cols-4 gap-3 mb-5">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Solicitante</p>
              <p className="text-sm font-medium text-gray-800">{project.requester_name}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Líder</p>
              <p className="text-sm font-medium text-gray-800">{project.owner?.name || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Go-live</p>
              <p className="text-sm font-medium text-gray-800">{goLive}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Orçamento</p>
              <p className="text-sm font-medium text-gray-800">
                {project.budget_planned
                  ? `R$ ${Number(project.budget_planned).toLocaleString('pt-BR')}`
                  : '—'}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-400">Conclusão</p>
              <p className="text-xs font-medium text-gray-600">{project.completion_pct}%</p>
            </div>
            <ProgressBar value={project.completion_pct} color={progressColor} showLabel={false} />
          </div>

          <PhaseStrip currentPhase={project.current_phase} />

          {isPrivileged() && (
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

        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-medium text-gray-900">Requisitos de software</h2>
            {canEdit && !editingReq && (
              <button
                onClick={() => setEditingReq(true)}
                className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
              >
                {requirement ? 'Editar' : '+ Adicionar'}
              </button>
            )}
          </div>

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
        </div>

      </div>
    </div>
  )
}