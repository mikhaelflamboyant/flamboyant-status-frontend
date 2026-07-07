import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { managementService } from '../services/management.service'
import { scopeService } from '../services/scope.service'
import { useAuth } from '../hooks/useAuth'
import {
  AlertTriangle, Clock, CalendarX, CheckCircle2,
  ChevronRight, ChevronDown, ArrowRight, Search,
} from 'lucide-react'

const PHASE_LABELS = {
  RECEBIDA: 'Recebida',
  ENTREVISTA_SOLICITANTE: 'Entrevista',
  LEVANTAMENTO_REQUISITOS: 'Levantamento',
  ANALISE_SOLUCAO: 'Análise da solução',
  DESENVOLVIMENTO: 'Desenvolvimento',
  TESTES: 'Testes',
  VALIDACAO_SOLICITANTE: 'Validação',
  ENTREGUE: 'Entregue',
  SUPORTE: 'Suporte pós go-live',
}

const STAGE_LABELS = {
  PLANEJAMENTO: 'Planejamento',
  EXECUCAO: 'Execução',
  GO_LIVE: 'Go-live',
  SUPORTE: 'Suporte pós go-live',
}

const STAGE_ORDER = ['PLANEJAMENTO', 'EXECUCAO', 'GO_LIVE', 'SUPORTE']

const FAROL_COLORS = {
  VERDE: { bg: '#E1F5EE', text: '#085041', dot: '#1D9E75', label: 'verde' },
  AMARELO: { bg: '#FAEEDA', text: '#633806', dot: '#EF9F27', label: 'atenção' },
  VERMELHO: { bg: '#FCEBEB', text: '#791F1F', dot: '#E24B4A', label: 'atraso' },
}

const LEVELS = [
  { key: 'A', label: 'Estratégico', badge: 'bg-primary-50 text-primary-900', bar: '#534AB7' },
  { key: 'B', label: 'Performance', badge: 'bg-blue-50 text-blue-900', bar: '#185FA5' },
  { key: 'C', label: 'Compliance', badge: 'bg-amber-50 text-amber-900', bar: '#EF9F27' },
  { key: 'D', label: 'Inovação', badge: 'bg-teal-50 text-teal-900', bar: '#1D9E75' },
  { key: 'null', label: 'Não definido', badge: 'bg-gray-100 text-gray-500', bar: '#B4B2A9' },
]

function FarolIcon({ value, size = 14 }) {
  if (value === 'VERDE') return <CheckCircle2 size={size} className="text-teal-500 shrink-0" />
  if (value === 'AMARELO') return <Clock size={size} className="text-amber-500 shrink-0" />
  return <AlertTriangle size={size} className="text-red-500 shrink-0" />
}

function Metric({ label, value, sub, onClick }) {
  return (
    <div
      className={`bg-white border border-gray-100 rounded-xl p-4 ${onClick ? 'cursor-pointer hover:border-gray-300 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-medium text-gray-900 tracking-tight tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function Alert({ label, value, sub, icon: Icon, tone, onClick }) {
  return (
    <div className={`rounded-xl p-4 ${onClick ? 'cursor-pointer' : ''} ${tone}`} onClick={onClick}>
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
          <Icon size={15} />
          {label}
        </span>
      </div>
      <p className="text-2xl font-medium tabular-nums">{value}</p>
      {sub && <p className="text-xs opacity-80 mt-1">{sub}</p>}
    </div>
  )
}

function Section({ title, right, children }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</p>
        {right}
      </div>
      {children}
    </div>
  )
}

function GoLiveChart({ data }) {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    return {
      label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      count: data[d.toISOString().slice(0, 7)] || 0,
    }
  })
  const max = Math.max(...months.map(m => m.count), 3)
  return (
    <div>
      <div className="flex items-end gap-3 h-28 border-b border-gray-200">
        {months.map(m => {
          const peak = m.count >= 3
          const pct = m.count > 0 ? Math.max((m.count / max) * 100, 8) : 0
          return (
            <div key={m.label} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
              <span className={`text-xs font-medium ${peak ? 'text-red-500' : m.count ? 'text-gray-500' : 'text-gray-300'}`}>{m.count}</span>
              <div
                className={`w-full rounded-t ${m.count ? (peak ? 'bg-red-500' : 'bg-primary-600') : 'bg-gray-100'}`}
                style={{ height: `${pct}%`, minHeight: m.count ? 6 : 2 }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-3 mt-1.5">
        {months.map(m => (
          <span key={m.label} className="flex-1 text-center text-xs text-gray-400">{m.label}</span>
        ))}
      </div>
    </div>
  )
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `há ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  return `há ${Math.floor(hours / 24)}d`
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Sem previsão')

const farolDist = (projects) =>
  projects.reduce((acc, p) => ({ ...acc, [p.traffic_light]: (acc[p.traffic_light] || 0) + 1 }), {})

const initials = (name) => name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || ''

function RejectModal({ projectTitle, onConfirm, onCancel }) {
  const [reason, setReason] = useState('')
  return (
    <div className="mt-3 border border-red-100 rounded-xl bg-red-50 p-4">
      <p className="text-xs font-medium text-red-800 mb-1">Rejeitar cronograma — {projectTitle}</p>
      <p className="text-xs text-red-600 mb-3">Descreva o motivo para o solicitante.</p>
      <textarea
        className="w-full text-xs border border-red-200 rounded-lg p-2.5 bg-white resize-none outline-none focus:border-red-400 transition-colors"
        rows={3}
        placeholder="Motivo da rejeição..."
        value={reason}
        onChange={e => setReason(e.target.value)}
      />
      <div className="flex gap-2 mt-2 justify-end">
        <button
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => onConfirm(reason)}
          disabled={!reason.trim()}
          className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          style={{ background: '#A32D2D', color: '#fff' }}
        >
          Confirmar rejeição
        </button>
      </div>
    </div>
  )
}

function ApprovalsTab() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState({})
  const [rejectingId, setRejectingId] = useState(null)
  const [actionLoading, setActionLoading] = useState({})
  const [filterProject, setFilterProject] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [order, setOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { order, page, page_size: PAGE_SIZE }
      if (filterProject) params.project_id = filterProject
      if (filterUser) params.user_id = filterUser
      const res = await managementService.getApprovals(params)
      setData(res.data)
    } catch {
      setError('Erro ao carregar aprovações.')
    } finally {
      setLoading(false)
    }
  }, [filterProject, filterUser, order, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [filterProject, filterUser, order])

  const toggleExpanded = (pid) => setExpanded(prev => ({ ...prev, [pid]: !prev[pid] }))

  const handleApprove = async (projectId, projectTitle, items) => {
    setActionLoading(prev => ({ ...prev, [projectId]: true }))
    try {
      await scopeService.approveItems(projectId, items.map(i => i.id))
      await load()
    } catch {
    } finally {
      setActionLoading(prev => ({ ...prev, [projectId]: false }))
    }
  }

  const handleReject = async (projectId, items, reason) => {
    setActionLoading(prev => ({ ...prev, [projectId]: true }))
    setRejectingId(null)
    try {
      await scopeService.rejectItems(projectId, items.map(i => i.id))
      await load()
    } catch {
    } finally {
      setActionLoading(prev => ({ ...prev, [projectId]: false }))
    }
  }

  if (loading) return <div className="flex justify-center py-16"><p className="text-sm text-gray-400">Carregando aprovações...</p></div>
  if (error) return <div className="flex justify-center py-16"><p className="text-sm text-red-400">{error}</p></div>

  const { projects = [], total = 0, total_pages = 0, filter_options = {} } = data || {}

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          className="h-8 px-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 outline-none focus:border-primary-600"
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
        >
          <option value="">Todos os projetos</option>
          {(filter_options.projects || []).map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        <select
          className="h-8 px-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 outline-none focus:border-primary-600"
          value={filterUser}
          onChange={e => setFilterUser(e.target.value)}
        >
          <option value="">Todos os usuários</option>
          {(filter_options.users || []).map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <select
          className="h-8 px-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 outline-none focus:border-primary-600"
          value={order}
          onChange={e => setOrder(e.target.value)}
        >
          <option value="desc">Mais recentes primeiro</option>
          <option value="asc">Mais antigos primeiro</option>
        </select>
        {total > 0 && (
          <span className="text-xs text-gray-400 ml-auto">
            {total} projeto{total !== 1 ? 's' : ''} com aprovação pendente
          </span>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-8 text-center">
          <p className="text-sm text-gray-400">Nenhum cronograma aguardando aprovação.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {projects.map(proj => {
            const isExpanded = expanded[proj.project_id]
            const isLoading = actionLoading[proj.project_id]
            const isRejecting = rejectingId === proj.project_id

            const byStage = {}
            for (const item of proj.items) {
              const s = item.stage || 'PLANEJAMENTO'
              if (!byStage[s]) byStage[s] = []
              byStage[s].push(item)
            }

            return (
              <div key={proj.project_id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpanded(proj.project_id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-medium text-gray-800 truncate">{proj.project_title}</span>
                    <span className="text-xs bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full shrink-0">
                      {proj.items.length} atividade{proj.items.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs bg-violet-50 text-violet-800 px-2.5 py-0.5 rounded-full shrink-0">
                      Aguardando aprovação
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-xs text-gray-400">
                      {proj.submitted_by?.name} · {timeAgo(proj.latest_updated_at)}
                    </span>
                    <span className="text-xs text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    {STAGE_ORDER.filter(s => byStage[s]?.length > 0).map(stage => (
                      <div key={stage} className="mb-4 last:mb-0">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                          {STAGE_LABELS[stage]}
                        </p>
                        <div className="flex flex-col divide-y divide-gray-50">
                          {byStage[stage].map(item => {
                            const hasDateChange = item.pending_start_date || item.pending_end_date
                            const hasTitleChange = item.pending_title && item.pending_title !== item.title
                            return (
                              <div key={item.id} className="flex items-center gap-4 py-2">
                                <span className="text-xs text-gray-800 flex-1 min-w-0 truncate">
                                  {hasTitleChange ? (
                                    <>
                                      <span className="line-through text-gray-400 mr-1">{item.title}</span>
                                      <span>{item.pending_title}</span>
                                    </>
                                  ) : item.title}
                                </span>
                                <div className="flex items-center gap-1 shrink-0 text-xs">
                                  {hasDateChange ? (
                                    <>
                                      <span className="line-through text-gray-400">{formatDate(item.start_date)} → {formatDate(item.end_date)}</span>
                                      <span className="text-gray-300 mx-1">›</span>
                                      <span className="font-medium text-gray-800">{formatDate(item.pending_start_date ?? item.start_date)} → {formatDate(item.pending_end_date ?? item.end_date)}</span>
                                    </>
                                  ) : (
                                    <span className="text-gray-400">{formatDate(item.start_date)} → {formatDate(item.end_date)}</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center gap-2 pt-3 mt-1 border-t border-gray-100">
                      <button
                        onClick={() => handleApprove(proj.project_id, proj.project_title, proj.items)}
                        disabled={isLoading}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                        style={{ background: '#0F6E56', color: '#fff' }}
                      >
                        {isLoading ? 'Processando...' : 'Aprovar cronograma'}
                      </button>
                      <button
                        onClick={() => setRejectingId(isRejecting ? null : proj.project_id)}
                        disabled={isLoading}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                        style={{ background: '#A32D2D', color: '#fff' }}
                      >
                        Rejeitar
                      </button>
                      <button
                        onClick={() => navigate(`/projetos/${proj.project_id}`, { state: { from: '/painel?tab=aprovacoes' } })}
                        className="text-xs text-primary-600 hover:text-primary-800 transition-colors ml-auto"
                      >
                        Ver projeto →
                      </button>
                    </div>

                    {isRejecting && (
                      <RejectModal
                        projectTitle={proj.project_title}
                        onConfirm={(reason) => handleReject(proj.project_id, proj.items, reason)}
                        onCancel={() => setRejectingId(null)}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            Página {page} de {total_pages} · {total} projeto{total !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 px-3 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              ← Anterior
            </button>
            {Array.from({ length: total_pages }, (_, i) => i + 1).map(p => (
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
              onClick={() => setPage(p => Math.min(total_pages, p + 1))}
              disabled={page === total_pages}
              className="h-8 px-3 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NivelEstrategico({ byLevel, projects }) {
  const [view, setView] = useState('dist')
  const [filter, setFilter] = useState('')
  const total = Object.values(byLevel).reduce((a, b) => a + b, 0)
  const filtered = projects.filter((p) => !filter || (p.level || 'null') === filter)

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500">Distribuição por nível estratégico</p>
        <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg">
          {[['dist', 'Distribuição'], ['list', 'Lista']].map(([k, lbl]) => (
            <button
              key={k}
              onClick={() => setView(k)}
              className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${view === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div className="h-60">
        {view === 'dist' ? (
          <div className="flex flex-col justify-center h-full gap-2.5">
            {LEVELS.map((l) => {
              const count = byLevel[l.key] || 0
              const pct = total ? Math.round((count / total) * 100) : 0
              return (
                <div key={l.key} className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-8 text-center shrink-0 ${l.badge}`}>{l.key === 'null' ? '—' : l.key}</span>
                  <span className="text-xs text-gray-700 w-24 shrink-0">{l.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: l.bar }} />
                  </div>
                  <span className="text-xs font-medium text-gray-900 w-5 text-right">{count}</span>
                </div>
              )
            })}
            <p className="text-xs text-gray-400 mt-0.5">{total} projetos ativos no total</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex flex-wrap gap-1 mb-2">
              {[{ key: '', label: 'Todos' }, ...LEVELS.map((l) => ({ key: l.key, label: l.key === 'null' ? 'Não def.' : l.key }))].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${filter === f.key ? 'border-primary-600 bg-primary-50 text-primary-800' : 'border-gray-200 bg-white text-gray-500'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-0.5 pr-1">
              {filtered.map((p) => {
                const l = LEVELS.find((x) => x.key === (p.level || 'null'))
                return (
                  <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full w-6 text-center shrink-0 ${l.badge}`}>{p.level || '—'}</span>
                    <FarolIcon value={p.traffic_light} size={12} />
                    <span className="text-xs text-gray-700 flex-1 min-w-0 truncate">{p.title}</span>
                    <span className="text-xs text-gray-400 shrink-0">{p.unit}</span>
                  </div>
                )
              })}
              {filtered.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Nenhum projeto neste nível.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ProjectDropdown({ label, count, pill, list, open, onToggle, showFarol, onRowClick }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-2.5">
      <div className={`flex items-center justify-between px-4 py-3 cursor-pointer ${open ? 'border-b border-gray-100' : ''}`} onClick={onToggle}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-900">{label}</span>
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${pill}`}>{count} projeto{count !== 1 ? 's' : ''}</span>
        </div>
        {open ? <ChevronDown size={16} className="text-gray-300" /> : <ChevronRight size={16} className="text-gray-300" />}
      </div>
      {open && (
        <div className="p-2">
          <div className="flex items-center gap-2.5 px-2.5 pt-1 pb-1.5">
            {showFarol && <span className="w-3.5 shrink-0" />}
            <span className="flex-1 text-[10px] text-gray-300">Título do projeto</span>
            <span className="w-28 shrink-0 text-[10px] text-gray-300">Unidade de negócio</span>
            <span className="w-20 shrink-0 text-right text-[10px] text-gray-300">Go-live</span>
          </div>
          {list.map((p) => (
            <div
              key={p.id}
              onClick={() => onRowClick?.(p)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-gray-50 cursor-pointer"
            >
              {showFarol && <FarolIcon value={p.traffic_light} size={13} />}
              <span className="flex-1 min-w-0 text-xs text-gray-700 truncate">{p.title}</span>
              <span className="w-28 shrink-0 text-xs text-gray-400">{p.area}</span>
              <span className="w-20 shrink-0 text-right text-xs text-gray-400">
                {p.go_live ? new Date(p.go_live).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Sem previsão'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const COMPLEXITY_COLORS = {
  Alta: '#E24B4A',
  'Média': '#EF9F27',
  Baixa: '#1D9E75',
}

const complexityDist = (projects) =>
  projects.reduce((acc, p) => {
    if (p.complexity) acc[p.complexity] = (acc[p.complexity] || 0) + 1
    return acc
  }, {})

function ResponsaveisTable({ responsaveis, onProjectClick }) {
  const [q, setQ] = useState('')
  const [sortDesc, setSortDesc] = useState(true)
  const [semProjetos, setSemProjetos] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const maxLoad = Math.max(1, ...responsaveis.map((p) => p.projects_count))
  const rows = responsaveis
    .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    .filter((p) => !semProjetos || p.projects_count === 0)
    .sort((a, b) => (sortDesc ? b.projects_count - a.projects_count : a.projects_count - b.projects_count))

  const loadColor = (n) => (n >= 7 ? 'bg-red-400' : n >= 4 ? 'bg-amber-400' : 'bg-teal-400')
  const th = 'text-[11px] font-semibold text-gray-400 uppercase tracking-wide'
  const cols = 'grid-cols-[2fr_1.4fr_1.2fr_1.4fr_1.6fr_24px]'

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="text-gray-300 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar responsável…"
            className="h-8 min-w-[220px] pl-7 pr-2.5 text-xs text-gray-700 border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
          />
        </div>
        <button
          onClick={() => setSemProjetos((v) => !v)}
          className={`h-8 flex items-center px-2.5 text-xs font-medium rounded-lg border transition-colors ${semProjetos ? 'border-primary-600 bg-primary-50 text-primary-800' : 'border-gray-200 bg-white text-gray-500'}`}
        >
          Sem projetos
        </button>
        <span className="ml-auto text-xs text-gray-400">{rows.length} responsáve{rows.length === 1 ? 'l' : 'is'}</span>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className={`grid ${cols} gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50`}>
          <span className={th}>Responsável</span>
          <span className={th}>Área</span>
          <button onClick={() => setSortDesc((s) => !s)} className={`${th} inline-flex items-center gap-1 text-left`}>
            Carga {sortDesc ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
          <span className={th}>Complexidade</span>
          <span className={th}>Distribuição de farol</span>
          <span />
        </div>

        {rows.map((person) => {
          const d = farolDist(person.projects)
          const open = expanded === person.id
          return (
            <div key={person.id} className="border-b border-gray-50 last:border-0">
              <div
                onClick={() => setExpanded(open ? null : person.id)}
                className={`grid ${cols} gap-3 px-4 py-2.5 items-center cursor-pointer hover:bg-gray-50`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-primary-50 text-primary-800 flex items-center justify-center text-xs font-medium shrink-0">{initials(person.name)}</div>
                  <p className="text-xs font-medium text-gray-700 truncate">{person.name}</p>
                </div>
                <span className="text-xs text-gray-500">{person.area}</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 max-w-[70px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${loadColor(person.projects_count)}`} style={{ width: `${(person.projects_count / maxLoad) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-900 tabular-nums">{person.projects_count}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const dist = complexityDist(person.projects)
                    const keys = ['Alta', 'Média', 'Baixa'].filter(k => dist[k])
                    if (keys.length === 0) return <span className="text-gray-300 text-xs">—</span>
                    return keys.map(k => (
                      <span key={k} className="inline-flex items-center gap-1 text-xs text-gray-600">
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: COMPLEXITY_COLORS[k], display: 'inline-block', flexShrink: 0 }} />
                        {dist[k]}
                      </span>
                    ))
                  })()}
                </div>
                <div className="flex items-center gap-2.5">
                  {person.projects_count === 0 ? (
                    <span className="text-[11px] text-gray-300">Sem vínculo</span>
                  ) : (
                    ['VERDE', 'AMARELO', 'VERMELHO'].filter((k) => d[k]).map((k) => (
                      <span key={k} className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <FarolIcon value={k} size={13} />
                        {d[k]}
                      </span>
                    ))
                  )}
                </div>
                <span className="flex justify-end text-gray-300">
                  {person.projects_count > 0 && (open ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                </span>
              </div>

              {open && person.projects_count > 0 && (
                <div className="px-4 pt-1 pb-3 bg-gray-50 flex flex-col gap-0.5">
                  <div className="flex items-center gap-2.5 pr-2.5 pb-1.5">
                    <span className="w-7 shrink-0" />
                    <span className="flex-1 text-[10px] text-gray-300">Título do projeto</span>
                    <span className="w-32 shrink-0 text-[10px] text-gray-300">Fase</span>
                    <span className="w-20 shrink-0 text-[10px] text-gray-300">Go-live</span>
                  </div>
                  {person.projects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onProjectClick?.(p)}
                      className="flex items-center gap-2.5 pr-2.5 py-1.5 rounded-md hover:bg-white cursor-pointer"
                    >
                      <span className="w-7 flex justify-center shrink-0">
                        <FarolIcon value={p.traffic_light} size={13} />
                      </span>
                      <span className="flex-1 min-w-0 text-xs text-gray-700 truncate">{p.title}</span>
                      <span className="w-32 shrink-0 text-xs text-gray-400 truncate">{PHASE_LABELS[p.current_phase] || p.current_phase}</span>
                      <span className="w-20 shrink-0 text-xs text-gray-400">{fmtDate(p.go_live)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {rows.length === 0 && <p className="text-center text-sm text-gray-400 py-10">Nenhum responsável encontrado.</p>}
      </div>
    </div>
  )
}

export default function Management() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'analise')
  const [dashboard, setDashboard] = useState(null)
  const [usersData, setUsersData] = useState(null)
  const [activeProjectsList, setActiveProjectsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openCart, setOpenCart] = useState('ativos')
  const [pendingCount, setPendingCount] = useState(null)

  const TI_AREA = 'Tecnologia da Informação'
  const canAccess = ['ANALISTA_MASTER', 'ANALISTA_TESTADOR', 'GERENTE', 'COORDENADOR'].includes(user?.role) &&
    (user?.area === TI_AREA || ['ANALISTA_MASTER', 'ANALISTA_TESTADOR'].includes(user?.role))

  useEffect(() => {
    if (!canAccess) { navigate('/projetos'); return }
    const load = async () => {
      try {
        const [dashRes, usersRes, approvalsRes] = await Promise.all([
          managementService.getDashboard(),
          managementService.getUsers(),
          managementService.getApprovals({ page: 1, page_size: 1 }),
        ])
        setDashboard(dashRes.data)
        setActiveProjectsList(dashRes.data.active_projects || [])
        setUsersData(usersRes.data)
        setPendingCount(approvalsRes.data.total || 0)
      } catch (err) {
        setError('Erro ao carregar painel de gestão.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex items-center justify-center py-20"><p className="text-sm text-gray-400">Carregando painel...</p></div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex items-center justify-center py-20"><p className="text-sm text-red-400">{error}</p></div>
    </div>
  )

  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long' })

  const strategicProjects = (activeProjectsList || []).map(p => ({ ...p, unit: p.area }))
  const responsaveis = (usersData?.responsaveis || []).map(r => ({ ...r, projects_count: r.carga }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-6">

        <h1 className="text-base font-medium text-gray-900 mb-1">Painel de gestão</h1>
        <p className="text-xs text-gray-400 mb-6">Visão consolidada dos projetos e da carteira</p>

        <div className="flex gap-1 mb-5">
          <button
            onClick={() => setActiveTab('analise')}
            className={`text-xs px-4 py-2 rounded-lg font-medium transition-colors border ${
              activeTab === 'analise'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            Análise
          </button>
          <button
            onClick={() => setActiveTab('aprovacoes')}
            className={`flex items-center gap-2 text-xs px-4 py-2 rounded-lg font-medium transition-colors border ${
              activeTab === 'aprovacoes'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            Aprovações
            {pendingCount > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                activeTab === 'aprovacoes'
                  ? 'bg-white text-primary-600'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'analise' && (
          <>
            {/* ETAPA 3.1 — Precisa de atenção */}
            <Section title="Precisa de atenção">
              <div className="grid grid-cols-5 gap-3">
                <Alert
                  label="Atrasados" value={dashboard.totals.overdue}
                  sub="farol vermelho ou vencido" icon={AlertTriangle}
                  tone="bg-red-50 text-red-600"
                  onClick={() => navigate('/projetos?farol=VERMELHO')}
                />
                <Alert
                  label="Sem status" value={dashboard.totals.no_recent_status}
                  sub="sem update há +7 dias" icon={Clock}
                  tone="bg-amber-50 text-amber-600"
                  onClick={() => navigate('/projetos?filtro=sem_status')}
                />
                <Alert
                  label="Sem go-live" value={dashboard.totals.no_go_live}
                  sub="sem previsão" icon={CalendarX}
                  tone="bg-amber-50 text-amber-600"
                  onClick={() => navigate('/projetos?filtro=sem_golive')}
                />
                <Alert
                  label={`Entregues em ${currentMonth}`} value={dashboard.totals.delivered_this_month}
                  sub="concluídos no mês" icon={CheckCircle2}
                  tone="bg-teal-50 text-teal-600"
                  onClick={() => navigate('/projetos/arquivados?filtro=entregues_mes')}
                />
                <Alert
                  label={`Cancelados em ${currentMonth}`} value={dashboard.totals.cancelled_this_month}
                  sub="cancelados no mês" icon={AlertTriangle}
                  tone="bg-red-50 text-red-600"
                  onClick={() => navigate('/projetos/cancelados?filtro=cancelados_mes')}
                />
              </div>
            </Section>

            {/* ETAPA 3.2 — Visão geral */}
            <Section title="Visão geral">
              <div className="grid grid-cols-4 gap-3">
                <Metric label="Projetos ativos" value={dashboard.totals.active} onClick={() => navigate('/projetos')} />
                <Metric label="Finalizados" value={dashboard.totals.archived} onClick={() => navigate('/projetos/arquivados')} />
                <Metric label="Backlog" value={dashboard.totals.backlog} onClick={() => navigate('/projetos/backlog')} />
                <Metric label="Em execução" value={dashboard.totals.in_execution} sub="dev · testes · validação" onClick={() => {
                  sessionStorage.setItem('projectFilters', JSON.stringify({
                    search: '', traffic_light: [], phases: ['DESENVOLVIMENTO', 'TESTES', 'VALIDACAO_SOLICITANTE'],
                    areas: [], levels: [], filtro: '', responsible_ids: [], requester_ids: [],
                  }))
                  navigate('/projetos')
                }} />
                <Metric label="Go-live" value={dashboard.totals.go_live} onClick={() => navigate('/projetos/go-live')} />
                <Metric label="Suporte pós go-live" value={dashboard.totals.support ?? dashboard.totals.go_live} sub="projetos em suporte" onClick={() => navigate('/projetos/go-live')} />
                <Metric label="Conclusão média" value={`${dashboard.totals.avg_completion}%`} />
                <Metric label="Funcionários sem projetos" value={dashboard.totals.users_without_projects} sub="sem vínculo ativo" />
              </div>
            </Section>

            {/* ETAPA 3.3 — Distribuição */}
            <Section title="Distribuição">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 mb-3">Por farol</p>
                  <div className="flex flex-col gap-2.5">
                    {[['VERDE', 'No prazo'], ['AMARELO', 'Atenção'], ['VERMELHO', 'Atrasado']].map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2">
                        <FarolIcon value={key} />
                        <span className="flex-1 text-xs text-gray-700">{label}</span>
                        <span className="text-xs font-medium text-gray-900">{dashboard.by_farol[key] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 mb-3">Por unidade de negócio</p>
                  <div className="flex flex-col gap-1.5">
                    {Object.entries(dashboard.by_unit).filter(([, v]) => v > 0).map(([unit, count]) => (
                      <div key={unit} className="flex justify-between text-xs">
                        <span className="text-gray-700">{unit}</span>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 mb-3">Por fase</p>
                  <div className="flex flex-col gap-1.5">
                    {Object.entries(PHASE_LABELS).map(([key, label]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-medium text-gray-900">{dashboard.by_phase[key] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* ETAPA 3.4 — Indicadores (PDTI) */}
            <Section title="Indicadores">
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-medium text-gray-500">Indicador PDTI - Projetos no prazo</p>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    dashboard.totals.pdti_total > 0 && (dashboard.totals.pdti_on_time / dashboard.totals.pdti_total) >= 0.8
                      ? 'bg-teal-50 text-teal-800' : 'bg-red-50 text-red-600'
                  }`}>Meta: 80%</span>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-medium text-gray-900">
                    {dashboard.totals.pdti_total > 0 ? Math.round((dashboard.totals.pdti_on_time / dashboard.totals.pdti_total) * 100) : 0}%
                  </span>
                  <span className="text-xs text-gray-400">{dashboard.totals.pdti_on_time} de {dashboard.totals.pdti_total} projetos no prazo</span>
                </div>
                <div className="relative">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${dashboard.totals.pdti_total > 0 ? Math.round((dashboard.totals.pdti_on_time / dashboard.totals.pdti_total) * 100) : 0}%` }}
                      className={`h-full rounded-full transition-all ${dashboard.totals.pdti_total > 0 && (dashboard.totals.pdti_on_time / dashboard.totals.pdti_total) >= 0.8 ? 'bg-teal-400' : 'bg-red-400'}`}
                    />
                  </div>
                  <div className="absolute -top-1 w-px h-3.5 bg-gray-400" style={{ left: '80%' }} />
                  <span className="absolute top-4 -translate-x-1/2 text-[11px] text-gray-400" style={{ left: '80%' }}>meta 80%</span>
                </div>
                <div className="h-4" />
              </div>
            </Section>

            {/* ETAPA 3.5 — Análise da carteira */}
            <Section title="Análise da carteira de projetos">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <NivelEstrategico
                  byLevel={dashboard.by_level}
                  projects={strategicProjects}
                />
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 mb-3">
                    Tempo médio de entrega
                    {dashboard.avg_delivery_global && (
                      <span className="text-gray-400 font-normal"> · média geral: {dashboard.avg_delivery_global} dias</span>
                    )}
                  </p>
                  {Object.keys(dashboard.avg_delivery_by_unit).length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Nenhum projeto entregue ainda.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {Object.entries(dashboard.avg_delivery_by_unit).sort(([, a], [, b]) => a - b).map(([unit, days]) => (
                        <div key={unit} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                          <span className="text-xs text-gray-700">{unit}</span>
                          <span className="text-xs font-medium text-gray-900">{days} dias</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-medium text-gray-500">Linha do tempo - go-lives nos próximos 6 meses</p>
                  <span className="text-xs text-gray-400">{Object.values(dashboard.go_live_timeline).reduce((a, b) => a + b, 0)} projetos com go-live definido</span>
                </div>
                <GoLiveChart data={dashboard.go_live_timeline} />
              </div>
            </Section>

            <div className="mt-8 mb-8">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Todos os projetos ({(dashboard.totals.active || 0) + (dashboard.totals.backlog || 0) + (dashboard.totals.go_live || 0) + (dashboard.totals.archived || 0)})
              </p>

              <ProjectDropdown
                label="Backlog"
                count={dashboard.totals.backlog}
                pill="bg-gray-100 text-gray-500"
                list={dashboard.backlog_projects || []}
                open={openCart === 'backlog'}
                onToggle={() => setOpenCart(openCart === 'backlog' ? null : 'backlog')}
                onRowClick={(p) => navigate(`/projetos/${p.id}`)}
              />

              <ProjectDropdown
                label="Ativos"
                count={dashboard.totals.active}
                pill="bg-primary-50 text-primary-800"
                list={activeProjectsList || []}
                showFarol
                open={openCart === 'ativos'}
                onToggle={() => setOpenCart(openCart === 'ativos' ? null : 'ativos')}
                onRowClick={(p) => navigate(`/projetos/${p.id}`)}
              />

              <ProjectDropdown
                label="Go-live"
                count={dashboard.totals.go_live}
                pill="bg-teal-50 text-teal-800"
                list={dashboard.go_live_projects || []}
                showFarol
                open={openCart === 'golive'}
                onToggle={() => setOpenCart(openCart === 'golive' ? null : 'golive')}
                onRowClick={(p) => navigate(`/projetos/${p.id}`)}
              />

              <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => navigate('/projetos/arquivados')}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">Finalizados</span>
                  <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full">{dashboard.totals.archived} projetos</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600">Ver todos <ArrowRight size={13} /></span>
              </div>
            </div>

            <Section title="Responsáveis por projeto">
              <ResponsaveisTable
                responsaveis={responsaveis}
                onProjectClick={(p) => navigate(`/projetos/${p.id}`)}
              />
            </Section>
          </>
        )}

        {activeTab === 'aprovacoes' && <ApprovalsTab />}

      </div>
    </div>
  )
}