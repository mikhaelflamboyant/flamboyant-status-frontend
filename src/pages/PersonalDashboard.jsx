import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import api from '../services/api'
import { CheckCircle2, Clock, AlertTriangle, Check, Layers, CheckSquare } from 'lucide-react'
import { scopeService } from '../services/scope.service'
import { tasksService } from '../services/tasks.service'

function getGoLiveColor(goLiveDate) {
  if (!goLiveDate) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.ceil((new Date(goLiveDate) - now) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'vermelho'
  if (diff <= 3) return 'amarelo-escuro'
  if (diff <= 10) return 'amarelo-claro'
  return null
}

const GO_LIVE_STYLES = {
  'vermelho':       { dot: '#E24B4A', bg: '#FCEBEB', text: '#791F1F', label: 'Vencido', icon: 'triangle' },
  'amarelo-escuro': { dot: '#EF9F27', bg: '#FAEEDA', text: '#633806', label: 'Próximo', icon: 'clock' },
  'amarelo-claro':  { dot: '#EF9F27', bg: '#FAEEDA', text: '#633806', label: 'Em breve', icon: 'clock' },
}

const STATUS_TAG_STYLES = {
  verde:    { bg: '#E1F5EE', text: '#085041', label: 'Em dia', icon: 'check' },
  amarelo:  { bg: '#FAEEDA', text: '#633806', label: 'Atenção', icon: 'clock' },
  vermelho: { bg: '#FCEBEB', text: '#791F1F', label: 'Pendente', icon: 'triangle' },
}

function MetricCard({ label, value, color, textColor, icon: Icon, onClick }) {
  return (
    <div
      className={`bg-white border border-gray-100 rounded-xl p-4 ${onClick ? 'cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all' : ''}`}
      style={color ? { background: color, borderColor: 'transparent' } : {}}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon size={13} style={{ color: textColor }} className="shrink-0" />}
        <p className="text-xs" style={{ color: textColor || '#6B7280' }}>{label}</p>
      </div>
      <p className="text-2xl font-medium" style={{ color: textColor || '#111827' }}>{value}</p>
    </div>
  )
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'

const formatRelative = (d) => {
  if (!d) return ''
  const diff = Math.floor((new Date() - new Date(d)) / (1000 * 60 * 60))
  if (diff < 1) return 'agora mesmo'
  if (diff < 24) return `há ${diff}h`
  const days = Math.floor(diff / 24)
  return `há ${days} dia${days > 1 ? 's' : ''}`
}

function getUrgency(dateStr) {
  if (!dateStr) return { status: 'futuro', label: '', tone: 'neutro' }

  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const diffDays = Math.round((date - today) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const label = diffDays === -1 ? 'venceu ontem' : `venceu há ${Math.abs(diffDays)} dias`
    return { status: 'vencido', label, tone: 'vermelho' }
  }
  if (diffDays === 0) {
    return { status: 'hoje', label: 'vence hoje', tone: 'ambar' }
  }
  const label = `vence ${date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`
  return { status: 'futuro', label, tone: 'neutro' }
}

const URGENCY_STYLES = {
  vermelho: { text: '#791F1F', icon: 'triangle' },
  ambar:    { text: '#633806', icon: 'clock' },
  neutro:   { text: '#9CA3AF', icon: null },
}

const rdToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
const todoDiffDays = (date) => Math.round((new Date(new Date(date).toDateString()) - rdToday()) / 86400000)

function todoUrgency(date) {
  if (!date) return { tone: 'neutro', label: 'sem prazo', rank: 3 }
  const d = todoDiffDays(date)
  if (d < 0) return { tone: 'vermelho', label: d === -1 ? 'venceu ontem' : `venceu há ${Math.abs(d)} dias`, rank: 0 }
  if (d === 0) return { tone: 'ambar', label: 'vence hoje', rank: 1 }
  if (d === 1) return { tone: 'neutro', label: 'vence amanhã', rank: 2 }
  return { tone: 'neutro', label: 'vence ' + new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' }), rank: 2 }
}

const TODO_TONE = { vermelho: 'text-red-600', ambar: 'text-amber-600', neutro: 'text-gray-400' }

function TodoCheckbox({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`w-[18px] h-[18px] shrink-0 rounded-[5px] border-[1.5px] flex items-center justify-center transition-colors disabled:opacity-50 ${
        checked ? 'bg-teal-400 border-teal-400' : 'bg-white border-gray-300 hover:border-primary-400'
      }`}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  )
}

const TODO_STAGE_LABEL = {
  PLANEJAMENTO: 'Planejamento',
  EXECUCAO: 'Em execução',
  GO_LIVE: 'Go-live',
  SUPORTE: 'Suporte pós go-live',
}

function TodoRow({ item, onToggle, saving }) {
  const u = item.done ? null : todoUrgency(item.end_date)
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors">
      <TodoCheckbox checked={item.done} disabled={saving} onChange={() => onToggle(item)} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${item.done ? 'text-gray-300 line-through' : 'text-gray-700'}`}>
          {item.title}
        </p>
        {item.type === 'scope' && item.stage && (
          <p className="text-xs text-gray-400 truncate">{TODO_STAGE_LABEL[item.stage] || item.stage}</p>
        )}
        {item.type === 'task' && item.scope_item?.title && (
          <p className="text-xs text-gray-400 truncate">Atividade: {item.scope_item.title}</p>
        )}
      </div>
      {item.done ? (
        <span className="inline-flex items-center gap-1 text-[11px] text-teal-600 shrink-0">
          <Check size={12} /> concluída
        </span>
      ) : (
        <span className={`inline-flex items-center gap-1 text-xs shrink-0 ${u.tone === 'neutro' ? 'font-normal' : 'font-medium'} ${TODO_TONE[u.tone]}`}>
          {u.tone === 'vermelho' && <AlertTriangle size={12} />}
          {u.tone === 'ambar' && <Clock size={12} />}
          {u.label}
        </span>
      )}
    </div>
  )
}

function TodoSection({ icon: SectionIcon, title, items, emptyText, onToggle, savingId }) {
  const pending = items.filter(i => !i.done).length
  const doneCount = items.length - pending

  const groups = []
  const map = {}
  items.forEach(i => {
    const pid = i.project?.id ?? 'sem'
    if (!map[pid]) { map[pid] = { project: i.project, items: [] }; groups.push(map[pid]) }
    map[pid].items.push(i)
  })
  groups.forEach(g => g.items.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    if (a.done) return 0
    const ua = todoUrgency(a.end_date), ub = todoUrgency(b.end_date)
    if (ua.rank !== ub.rank) return ua.rank - ub.rank
    return new Date(a.end_date) - new Date(b.end_date)
  }))

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SectionIcon size={16} className="text-primary-600" />
          <h2 className="text-sm font-medium text-gray-900">{title}</h2>
        </div>
        <span className="text-xs text-gray-400">
          {pending} pendente{pending !== 1 ? 's' : ''}{doneCount > 0 ? ` · ${doneCount} concluída${doneCount !== 1 ? 's' : ''}` : ''}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center gap-2 bg-teal-50 text-teal-800 text-xs font-medium px-3 py-2.5 rounded-lg">
          <Check size={14} className="text-teal-600" /> {emptyText}
        </div>
      ) : (
        <div className="flex flex-col gap-[18px]">
          {groups.map(g => {
            const gp = g.items.filter(i => !i.done).length
            return (
              <div key={g.project?.id ?? 'sem'}>
                <div className="flex items-center gap-2 px-2.5 pb-1.5 mb-0.5 border-b border-gray-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                  <span className="flex-1 min-w-0 text-xs font-semibold text-gray-900 truncate">{g.project?.title || 'Sem projeto'}</span>
                  <span className="text-[11px] text-gray-300">{gp} pendente{gp !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-col gap-px pt-1">
                  {g.items.map(i => (
                    <TodoRow key={`${i.type}-${i.id}`} item={i} onToggle={onToggle} saving={savingId === `${i.type}-${i.id}`} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ShapeIcon({ shape, size = 13, className = '', color }) {
  const style = color ? { color } : undefined
  if (shape === 'check') return <CheckCircle2 size={size} style={style} className={`shrink-0 ${!color ? 'text-teal-500' : ''} ${className}`} />
  if (shape === 'clock') return <Clock size={size} style={style} className={`shrink-0 ${!color ? 'text-amber-500' : ''} ${className}`} />
  if (shape === 'triangle') return <AlertTriangle size={size} style={style} className={`shrink-0 ${!color ? 'text-red-500' : ''} ${className}`} />
  return null
}

function getCurrentWeekRangeLabel() {
  const now = new Date()
  const day = now.getDay() // 0=dom, 6=sáb
  const diffToSaturday = day === 6 ? 0 : -(day + 1)
  const start = new Date(now)
  start.setDate(now.getDate() + diffToSaturday)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const fmt = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const dow = (d) => d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')

  return `${dow(start)} ${fmt(start)} – ${dow(end)} ${fmt(end)}`
}

function getCurrentWeekBounds() {
  const now = new Date()
  const day = now.getDay()
  const diffToSaturday = day === 6 ? 0 : -(day + 1)
  const start = new Date(now)
  start.setDate(now.getDate() + diffToSaturday)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(0, 0, 0, 0)
  return { start, end }
}

function classifyByDate(dateStr) {
  if (!dateStr) return null
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { end: weekEnd } = getCurrentWeekBounds()
  if (date < today) return 'vencido'
  if (date <= weekEnd) return 'vencendo'
  return null
}

function classifyStatusReport(p) {
  if (p.launched_this_week) return null

  const { start: weekStart } = getCurrentWeekBounds()
  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setDate(weekStart.getDate() - 7)

  const last = p.last_status_at ? new Date(p.last_status_at) : null
  const missedLastWeekToo = !last || last < lastWeekStart

  if (missedLastWeekToo) return 'vencido'

  const day = new Date().getDay()
  if (day === 4 || day === 5) return 'vencendo'

  return null
}

const ACTION_TYPE_LABELS = { golive: 'Go-live vencido', status: 'Status report pendente', scope: 'Atividade', tasks: 'Tarefa' }

const PHASE_OPTIONS = [
  { key: 'RECEBIDA', label: 'Recebida' },
  { key: 'ENTREVISTA_SOLICITANTE', label: 'Entrevista' },
  { key: 'LEVANTAMENTO_REQUISITOS', label: 'Levantamento de requisitos' },
  { key: 'ANALISE_SOLUCAO', label: 'Análise da solução' },
  { key: 'DESENVOLVIMENTO', label: 'Desenvolvimento' },
  { key: 'TESTES', label: 'Testes' },
  { key: 'VALIDACAO_SOLICITANTE', label: 'Validação com solicitante' },
]

/* ---------- Fase 9: Skeletons ---------- */

function SkeletonBar({ w = 'w-40', h = 'h-3' }) {
  return <div className={`${w} ${h} rounded bg-gray-200 animate-pulse`} />
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse shrink-0" />
        <SkeletonBar w="w-48" />
      </div>
      <SkeletonBar w="w-20" />
    </div>
  )
}

function SkeletonCard({ rows = 3 }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <SkeletonBar w="w-56" h="h-3.5" />
        <SkeletonBar w="w-16" />
      </div>
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <>
      {/* faixa */}
      <div className="mb-4">
        <SkeletonBar w="w-32" h="h-2.5" />
        <div className="mt-2 border border-gray-100 rounded-xl bg-white p-4 flex flex-col gap-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
      {/* cards de métrica */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
            <SkeletonBar w="w-28" h="h-2.5" />
            <div className="mt-2"><SkeletonBar w="w-10" h="h-6" /></div>
          </div>
        ))}
      </div>
      {/* tabs */}
      <div className="flex gap-1 mb-5">
        <SkeletonBar w="w-20" h="h-8" />
        <SkeletonBar w="w-20" h="h-8" />
      </div>
      {/* listas */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </>
  )
}

export default function PersonalDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pendentes')
  const [filterProject, setFilterProject] = useState('')
  const [filterPhase, setFilterPhase] = useState('')
  const [projects, setProjects] = useState([])
  const [actionType, setActionType] = useState('todos')
  const [actionUrgency, setActionUrgency] = useState('todas')
  const [doneMap, setDoneMap] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [todoToast, setTodoToast] = useState('')

  const buildQuery = () => {
    const params = new URLSearchParams()
    if (filterProject) params.set('project_id', filterProject)
    if (filterPhase) params.set('phase', filterPhase)
    return params.toString() ? `?${params.toString()}` : ''
  }

  useEffect(() => {
    setLoading(true)
    api.get(`/personal/dashboard${buildQuery()}`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filterProject, filterPhase])

  useEffect(() => {
    api.get('/personal/projects')
      .then(r => setProjects(r.data || []))
      .catch(() => {})
  }, [])

  const showSkeleton = loading

  const counts = data?.counts || {}
  const goLive = data?.goLive || []
  const feed = data?.feed || []

  const statusReports = (data?.statusReports || []).filter(p =>
    tab === 'pendentes' ? !p.launched_this_week : p.launched_this_week
  )
  const byEndDate = (a, b) => {
    const da = a.end_date ? new Date(a.end_date).getTime() : Infinity
    const db = b.end_date ? new Date(b.end_date).getTime() : Infinity
    return da - db
  }

  const scopeItems = (data?.scopeItems || [])
    .filter(i => i?.project)
    .filter(i => tab === 'pendentes' ? !i.completion_date : !!i.completion_date)
    .sort(byEndDate)
  const tasks = (data?.tasks || [])
    .filter(t => t?.project)
    .filter(t => tab === 'pendentes' ? !t.completed : t.completed)
    .sort(byEndDate)

  const actionItems = (() => {
    const items = []

    ;(data?.goLiveAll || []).forEach(p => {
      const urgency = classifyByDate(p.go_live)
      if (!urgency) return
      const u = getUrgency(p.go_live)
      items.push({
        key: `golive-${p.id}`,
        type: 'golive',
        title: p.title,
        subtitle: 'Go-live vencido',
        label: u.label,
        tone: urgency === 'vencido' ? 'vermelho' : 'ambar',
        urgency,
        sortDate: p.go_live,
        onClick: () => navigate('/painel/pessoal/go-live'),
      })
    })

    ;(data?.statusReportsAll || []).forEach(p => {
      const urgency = classifyStatusReport(p)
      if (!urgency) return
      items.push({
        key: `status-${p.project_id}`,
        type: 'status',
        title: p.project_title,
        subtitle: 'Status report pendente',
        label: 'pendente',
        tone: urgency === 'vencido' ? 'vermelho' : 'ambar',
        urgency,
        sortDate: null,
        onClick: () => navigate('/painel/pessoal/status-reports'),
      })
    })

    return items.sort((a, b) => {
      if (a.urgency !== b.urgency) return a.urgency === 'vencido' ? -1 : 1
      const da = a.sortDate ? new Date(a.sortDate).getTime() : Infinity
      const db = b.sortDate ? new Date(b.sortDate).getTime() : Infinity
      return da - db
    })
  })()

  const actionTotalCount = actionItems.length
  const actionOverdueCount = actionItems.filter(i => i.urgency === 'vencido').length

  const filteredActionItems = actionItems
    .filter(i => actionType === 'todos' || i.type === actionType)
    .filter(i => actionUrgency === 'todas' || i.urgency === (actionUrgency === 'vencidas' ? 'vencido' : 'vencendo'))

  const toggleTodo = async (item) => {
    if (item.done) return
    const key = `${item.type}-${item.id}`
    setDoneMap(prev => ({ ...prev, [key]: true }))
    setSavingId(key)
    try {
      if (item.type === 'task') {
        await tasksService.complete(item.project.id, item.id)
      } else {
        await scopeService.update(item.project.id, item.id, {
          completion_date: new Date().toISOString().split('T')[0],
          completion_pct: 100,
        })
      }
      setTodoToast(`"${item.title}" concluída — atualizada no projeto.`)
      clearTimeout(window.__pdToast)
      window.__pdToast = setTimeout(() => setTodoToast(''), 3000)
    } catch (err) {
      console.error(err)
      setDoneMap(prev => { const n = { ...prev }; delete n[key]; return n })
      setTodoToast('Não foi possível concluir. Tente novamente.')
      clearTimeout(window.__pdToast)
      window.__pdToast = setTimeout(() => setTodoToast(''), 3000)
    } finally {
      setSavingId(null)
    }
  }

  const scopeTodo = (tab === 'pendentes' ? (data?.scopeItemsAll || []) : (data?.scopeItemsDoneWeek || []))
    .filter(i => i?.project)
    .map(i => ({ ...i, type: 'scope', done: tab === 'concluidos' ? true : !!doneMap[`scope-${i.id}`] }))

  const tasksTodo = (tab === 'pendentes' ? (data?.tasksAll || []) : (data?.tasksDoneWeek || []))
    .filter(t => t?.project)
    .map(t => ({ ...t, type: 'task', done: tab === 'concluidos' ? true : !!doneMap[`task-${t.id}`] }))

  const sections = [
    {
      key: 'golive',
      title: 'Projetos com go-live próximo',
      hasItems: goLive.length > 0,
      countLabel: counts.goLive > 0 ? `${Math.min(goLive.length, 3)} de ${counts.goLive}` : null,
      showViewAll: counts.goLive > 0,
      onViewAll: () => navigate('/painel/pessoal/go-live'),
      emptyText: 'Nenhum projeto com go-live nos próximos 10 dias.',
      render: () => (
        <div className="flex flex-col gap-1.5">
          {goLive.map(p => {
            const color = getGoLiveColor(p.go_live)
            const style = GO_LIVE_STYLES[color] || null
            return (
              <div
                key={p.id}
                onClick={() => navigate(`/projetos/${p.id}`)}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {style && <div style={{ width: 7, height: 7, borderRadius: '50%', background: style.dot, flexShrink: 0 }} />}
                  <span className="text-xs text-gray-800 truncate">{p.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {style && (
                    <span className="inline-flex items-center gap-1" style={{ fontSize: '11px', fontWeight: 500, background: style.bg, color: style.text, padding: '2px 8px', borderRadius: '20px' }}>
                      <ShapeIcon shape={style.icon} size={11} color={style.text} />
                      {style.label}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{formatDate(p.go_live)}</span>
                </div>
              </div>
            )
          })}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status reports da semana',
      hasItems: statusReports.length > 0,
      countLabel: (() => {
        const total = tab === 'pendentes' ? counts.statusReportsPending : counts.statusReportsCompleted
        return total > 0 ? `${statusReports.length} de ${total}` : null
      })(),
      showViewAll: true,
      onViewAll: () => navigate('/painel/pessoal/status-reports'),
      emptyText: tab === 'pendentes' ? 'Todos os status reports estão em dia.' : 'Nenhum status report lançado esta semana ainda.',
      render: () => (
        <div className="flex flex-col gap-1.5">
          {statusReports.map(p => {
            const style = STATUS_TAG_STYLES[p.tag] || STATUS_TAG_STYLES.verde
            return (
              <div
                key={p.project_id}
                onClick={() => navigate(`/projetos/${p.project_id}`)}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <span className="text-xs text-gray-800 truncate flex-1">{p.project_title}</span>
                <span className="inline-flex items-center gap-1" style={{ fontSize: '11px', fontWeight: 500, background: style.bg, color: style.text, padding: '2px 8px', borderRadius: '20px', flexShrink: 0 }}>
                  <ShapeIcon shape={style.icon} size={11} color={style.text} />
                  {style.label}
                </span>
              </div>
            )
          })}
        </div>
      ),
    },
    {
      key: 'scope',
      title: 'Atividades do cronograma · esta semana',
      hasItems: scopeItems.length > 0,
      countLabel: counts.scopeItems > 0 ? `${Math.min(scopeItems.length, 3)} de ${counts.scopeItems}` : null,
      showViewAll: true,
      onViewAll: () => navigate('/painel/pessoal/atividades'),
      emptyText: tab === 'pendentes' ? 'Nenhuma atividade pendente esta semana.' : 'Nenhuma atividade concluída esta semana.',
      render: () => (
        <div className="flex flex-col gap-1.5">
          {scopeItems.map(i => {
            const u = tab === 'pendentes' ? getUrgency(i.end_date) : null
            const st = u ? URGENCY_STYLES[u.tone] : null
            return (
              <div
                key={i.id}
                onClick={() => i.project?.id && navigate(`/projetos/${i.project.id}`)}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800 truncate">{i.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{i.project?.title}</p>
                </div>
                {u && u.status !== 'futuro' ? (
                  <span className="text-xs shrink-0 ml-3 inline-flex items-center gap-1 font-medium" style={{ color: st.text }}>
                    <ShapeIcon shape={st.icon} size={12} />
                    {u.label}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 shrink-0 ml-3">Conclusão em {formatDate(i.end_date)}</span>
                )}
              </div>
            )
          })}
        </div>
      ),
    },
    {
      key: 'tasks',
      title: 'Tarefas · esta semana',
      hasItems: tasks.length > 0,
      countLabel: counts.tasks > 0 ? `${Math.min(tasks.length, 3)} de ${counts.tasks}` : null,
      showViewAll: true,
      onViewAll: () => navigate('/painel/pessoal/tarefas'),
      emptyText: tab === 'pendentes' ? 'Nenhuma tarefa pendente esta semana.' : 'Nenhuma tarefa concluída esta semana.',
      render: () => (
        <div className="flex flex-col gap-1.5">
          {tasks.map(t => {
            const u = tab === 'pendentes' ? getUrgency(t.end_date) : null
            const st = u ? URGENCY_STYLES[u.tone] : null
            return (
              <div
                key={t.id}
                onClick={() => t.project?.id && navigate(`/projetos/${t.project.id}`)}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-xs truncate ${t.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{t.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.project?.title}</p>
                </div>
                {u && u.status !== 'futuro' ? (
                  <span className="text-xs shrink-0 ml-3 inline-flex items-center gap-1 font-medium" style={{ color: st.text }}>
                    <ShapeIcon shape={st.icon} size={12} />
                    {u.label}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 shrink-0 ml-3">Conclusão em {formatDate(t.end_date)}</span>
                )}
              </div>
            )
          })}
        </div>
      ),
    },
    {
      key: 'feed',
      title: 'Atividade recente · últimos 7 dias',
      hasItems: feed.length > 0,
      countLabel: counts.feed > 0 ? `${Math.min(feed.length, 3)} de ${counts.feed}` : null,
      showViewAll: true,
      onViewAll: () => navigate('/painel/pessoal/feed'),
      emptyText: 'Nenhuma atividade nos últimos 7 dias.',
      render: () => (
        <div className="flex flex-col gap-1.5">
          {feed.map(f => (
            <div
              key={f.id}
              onClick={() => f.project?.id && navigate(`/projetos/${f.project.id}`)}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: f.is_own ? '#888780' : '#185FA5', flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800 truncate">
                    <span style={{ fontWeight: 500, color: f.is_own ? '#444441' : '#0C447C' }}>
                      {f.is_own ? 'Você' : f.user?.name}
                    </span>
                    {' · '}{f.project?.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatRelative(f.created_at)}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400 shrink-0 ml-3">{f.is_own ? 'sua ação' : 'outro usuário'}</span>
            </div>
          ))}
        </div>
      ),
    },
  ]

  const visibleSections = sections.filter(s => !['scope', 'tasks'].includes(s.key))
  const sortedSections = [...visibleSections].sort((a, b) => (a.hasItems === b.hasItems ? 0 : a.hasItems ? -1 : 1))
  const allEmpty = actionItems.length === 0 && visibleSections.every(s => !s.hasItems)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {todoToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
          <Check size={14} className="text-teal-300" /> {todoToast}
        </div>
      )}
      <div className="max-w-6xl mx-auto px-6 py-6">

        <div className="flex items-baseline gap-2 mb-4 flex-wrap">
          <h1 className="text-base font-medium text-gray-900">Painel pessoal</h1>
          <span className="text-xs text-gray-400">Semana: {getCurrentWeekRangeLabel()}</span>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <select
            value={filterProject}
            onChange={e => { setFilterProject(e.target.value); setTab('pendentes') }}
            className="h-8 px-3 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 outline-none focus:border-primary-600 transition-colors"
          >
            <option value="">Todos os projetos</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>

          <select
            value={filterPhase}
            onChange={e => { setFilterPhase(e.target.value); setTab('pendentes') }}
            className="h-8 px-3 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 outline-none focus:border-primary-600 transition-colors"
          >
            <option value="">Todas as fases</option>
            {PHASE_OPTIONS.map(p => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>

          {(filterProject || filterPhase) && (
            <button
              onClick={() => { setFilterProject(''); setFilterPhase('') }}
              className="h-8 px-3 text-xs border border-gray-200 rounded-lg bg-white text-gray-400 hover:text-gray-600 transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {showSkeleton ? (
          <DashboardSkeleton />
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-y-1.5">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Precisa de ação hoje</p>
                {actionItems.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {[
                      ['todos', 'Todos'], ['golive', 'Go-live'], ['status', 'Status report'],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setActionType(key)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${actionType === key ? 'border-primary-600 bg-primary-50 text-primary-800 font-medium' : 'border-gray-200 bg-white text-gray-500'}`}
                      >
                        {label}
                      </button>
                    ))}
                    <span className="w-px h-4 bg-gray-200 mx-1" />
                    {[
                      ['todas', 'Todas'], ['vencidas', 'Vencidas'], ['vencendo', 'Vencendo'],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setActionUrgency(key)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${actionUrgency === key ? 'border-primary-600 bg-primary-50 text-primary-800 font-medium' : 'border-gray-200 bg-white text-gray-500'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {actionItems.length === 0 ? (
                <div className="border border-teal-100 rounded-xl bg-teal-50 px-4 py-2.5 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-teal-500 shrink-0" />
                  <span className="text-xs font-medium text-teal-800">Tudo em dia</span>
                </div>
              ) : (
                <div className="border border-red-100 rounded-xl overflow-hidden">
                  <div className="bg-red-50 px-4 py-2.5 flex items-center justify-between gap-2 border-b border-red-100">
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-red-800">
                      <AlertTriangle size={14} className="text-red-500 shrink-0" />
                      {actionTotalCount} item(ns) · {actionOverdueCount} vencido(s)
                    </span>
                    {filteredActionItems.length > 5 && (
                      <span className="text-xs text-red-400">Projetos</span>
                    )}
                  </div>
                  {filteredActionItems.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6 bg-white">Nenhum item neste filtro.</p>
                  ) : (
                    <div className="bg-white flex flex-col overflow-y-auto" style={{ maxHeight: '290px' }}>
                      {filteredActionItems.map(item => {
                        const st = URGENCY_STYLES[item.tone] || URGENCY_STYLES.neutro
                        return (
                          <div
                            key={item.key}
                            onClick={item.onClick}
                            className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="mt-0.5">
                                <ShapeIcon shape={st.icon || 'triangle'} size={14} />
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-800 truncate">{item.title}</p>
                                <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {item.label && (
                                <span className="text-xs font-medium" style={{ color: st.text }}>{item.label}</span>
                              )}
                              <span className="text-gray-300 text-xs">→</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <TodoSection
                icon={Layers}
                title="Atividades do cronograma · esta semana"
                items={scopeTodo}
                emptyText={tab === 'pendentes' ? 'Nenhuma atividade pendente nesta semana.' : 'Nenhuma atividade concluída nesta semana.'}
                onToggle={toggleTodo}
                savingId={savingId}
              />
              <TodoSection
                icon={CheckSquare}
                title="Tarefas · esta semana"
                items={tasksTodo}
                emptyText={tab === 'pendentes' ? 'Nenhuma tarefa pendente nesta semana.' : 'Nenhuma tarefa concluída nesta semana.'}
                onToggle={toggleTodo}
                savingId={savingId}
              />
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <MetricCard
                label="Status reports pendentes"
                value={counts.statusReportsPending ?? 0}
                color={counts.statusReportsPending > 0 ? '#FCEBEB' : undefined}
                textColor={counts.statusReportsPending > 0 ? '#791F1F' : undefined}
                icon={counts.statusReportsPending > 0 ? AlertTriangle : undefined}
                onClick={() => navigate('/painel/pessoal/status-reports')}
              />
              <MetricCard
                label="Atividades esta semana"
                value={counts.scopeItems ?? 0}
                onClick={() => navigate('/painel/pessoal/atividades')}
              />
              <MetricCard
                label="Tarefas esta semana"
                value={counts.tasks ?? 0}
                onClick={() => navigate('/painel/pessoal/tarefas')}
              />
              <MetricCard
                label="Go-live próximo"
                value={counts.goLive ?? 0}
                color={counts.goLive > 0 ? '#FAEEDA' : undefined}
                textColor={counts.goLive > 0 ? '#633806' : undefined}
                icon={counts.goLive > 0 ? Clock : undefined}
                onClick={() => navigate('/painel/pessoal/go-live')}
              />
            </div>

            <div className="flex gap-1 mb-5">
              <button
                onClick={() => setTab('pendentes')}
                className={`text-xs px-4 py-2 rounded-lg font-medium transition-colors border ${
                  tab === 'pendentes'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setTab('concluidos')}
                className={`text-xs px-4 py-2 rounded-lg font-medium transition-colors border ${
                  tab === 'concluidos'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Concluídos
              </button>
            </div>

            {allEmpty ? (
              <div className="bg-white border border-gray-100 rounded-xl px-4 py-12 flex flex-col items-center gap-2">
                <CheckCircle2 size={22} className="text-teal-500" />
                <p className="text-sm font-medium text-gray-700">Tudo em dia por aqui</p>
                <p className="text-xs text-gray-400">Nenhuma pendência nos seus projetos esta semana.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sortedSections.map(s => (
                  <div key={s.key} className="bg-white border border-gray-100 rounded-xl p-4">
                    {s.hasItems ? (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-medium text-gray-500">
                            {s.title}
                            {s.countLabel && <span className="text-gray-400 font-normal ml-1.5">{s.countLabel}</span>}
                          </p>
                          {s.showViewAll && (
                            <button
                              onClick={s.onViewAll}
                              className="text-xs text-primary-600 hover:text-primary-800 transition-colors font-medium"
                            >
                              Ver todos →
                            </button>
                          )}
                        </div>
                        {s.render()}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 py-0.5">
                        <CheckCircle2 size={13} className="text-teal-400 shrink-0" />
                        <span className="text-xs text-gray-400">{s.title} - {s.emptyText}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}