import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import api from '../services/api'
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

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
  'vermelho':       { dot: '#E24B4A', bg: '#FCEBEB', text: '#791F1F', label: 'Vencido' },
  'amarelo-escuro': { dot: '#EF9F27', bg: '#FAEEDA', text: '#633806', label: 'Próximo' },
  'amarelo-claro':  { dot: '#EF9F27', bg: '#FAEEDA', text: '#633806', label: 'Em breve' },
}

const STATUS_TAG_STYLES = {
  verde:    { bg: '#E1F5EE', text: '#085041', label: 'Em dia' },
  amarelo:  { bg: '#FAEEDA', text: '#633806', label: 'Atenção' },
  vermelho: { bg: '#FCEBEB', text: '#791F1F', label: 'Pendente' },
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
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

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

function ShapeIcon({ shape, size = 13, className = '' }) {
  if (shape === 'check') return <CheckCircle2 size={size} className={`text-teal-500 shrink-0 ${className}`} />
  if (shape === 'clock') return <Clock size={size} className={`text-amber-500 shrink-0 ${className}`} />
  if (shape === 'triangle') return <AlertTriangle size={size} className={`text-red-500 shrink-0 ${className}`} />
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

const PHASE_OPTIONS = [
  { key: 'RECEBIDA', label: 'Recebida' },
  { key: 'ENTREVISTA_SOLICITANTE', label: 'Entrevista' },
  { key: 'LEVANTAMENTO_REQUISITOS', label: 'Levantamento de requisitos' },
  { key: 'ANALISE_SOLUCAO', label: 'Análise da solução' },
  { key: 'DESENVOLVIMENTO', label: 'Desenvolvimento' },
  { key: 'TESTES', label: 'Testes' },
  { key: 'VALIDACAO_SOLICITANTE', label: 'Validação com solicitante' },
]

export default function PersonalDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pendentes')
  const [filterProject, setFilterProject] = useState('')
  const [filterPhase, setFilterPhase] = useState('')
  const [projects, setProjects] = useState([])

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

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Carregando painel...</p>
      </div>
    </div>
  )

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

    // Go-live vencido (só o que já passou da data)
    goLive.forEach(p => {
      const u = getUrgency(p.go_live)
      if (u.status === 'vencido') {
        items.push({
          key: `golive-${p.id}`,
          title: p.title,
          subtitle: 'Go-live vencido',
          label: u.label,
          tone: u.tone,
          sortDate: p.go_live,
          onClick: () => navigate('/painel/pessoal/go-live'),
        })
      }
    })

    // Status report pendente (tag vermelha = atrasado)
    ;(data?.statusReports || []).forEach(p => {
      if (p.tag === 'vermelho' && !p.launched_this_week) {
        items.push({
          key: `status-${p.project_id}`,
          title: p.project_title,
          subtitle: 'Status report pendente',
          label: '',
          tone: 'vermelho',
          sortDate: null,
          onClick: () => navigate('/painel/pessoal/status-reports'),
        })
      }
    })

    // Atividades atrasadas (vencidas)
    ;(data?.scopeItems || [])
      .filter(i => i?.project && !i.completion_date)
      .forEach(i => {
        const u = getUrgency(i.end_date)
        if (u.status === 'vencido') {
          items.push({
            key: `scope-${i.id}`,
            title: i.title,
            subtitle: `Atividade atrasada · ${i.project?.title}`,
            label: u.label,
            tone: u.tone,
            sortDate: i.end_date,
            onClick: () => navigate('/painel/pessoal/atividades'),
          })
        }
      })

    // Tarefas atrasadas (vencidas)
    ;(data?.tasks || [])
      .filter(t => t?.project && !t.completed)
      .forEach(t => {
        const u = getUrgency(t.end_date)
        if (u.status === 'vencido') {
          items.push({
            key: `task-${t.id}`,
            title: t.title,
            subtitle: `Tarefa atrasada · ${t.project?.title}`,
            label: u.label,
            tone: u.tone,
            sortDate: t.end_date,
            onClick: () => navigate('/painel/pessoal/tarefas'),
          })
        }
      })

    // Ordenação: vencido primeiro (data mais antiga no topo); sem data por último
    return items.sort((a, b) => {
      const da = a.sortDate ? new Date(a.sortDate).getTime() : Infinity
      const db = b.sortDate ? new Date(b.sortDate).getTime() : Infinity
      return da - db
    })
  })()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
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

        {actionItems.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Precisa de ação hoje</p>
            <div className="border border-red-100 rounded-xl overflow-hidden">
              <div className="bg-red-50 px-4 py-2.5 flex items-center gap-2 border-b border-red-100">
                <AlertTriangle size={14} className="text-red-500 shrink-0" />
                <span className="text-xs font-medium text-red-800">
                  {actionItems.length} {actionItems.length === 1 ? 'item precisa' : 'itens precisam'} de ação
                </span>
              </div>
              <div className="bg-white flex flex-col">
                {actionItems.map(item => {
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
            </div>
          </div>
        )}

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

        <div className="flex flex-col gap-3">

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500">Projetos com go-live próximo</p>
              {counts.goLive > 0 && (
                <button
                  onClick={() => navigate('/painel/pessoal/go-live')}
                  className="text-xs text-primary-600 hover:text-primary-800 transition-colors font-medium"
                >
                  Ver todos →
                </button>
              )}
            </div>
            {goLive.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Nenhum projeto com go-live nos próximos 10 dias.</p>
            ) : (
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
                          <span style={{ fontSize: '11px', fontWeight: 500, background: style.bg, color: style.text, padding: '2px 8px', borderRadius: '20px' }}>
                            {style.label}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{formatDate(p.go_live)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500">Status reports da semana</p>
              <button
                onClick={() => navigate('/painel/pessoal/status-reports')}
                className="text-xs text-primary-600 hover:text-primary-800 transition-colors font-medium"
              >
                Ver todos →
              </button>
            </div>
            {statusReports.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                {tab === 'pendentes' ? 'Todos os status reports estão em dia.' : 'Nenhum status report lançado esta semana ainda.'}
              </p>
            ) : (
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
                      <span style={{ fontSize: '11px', fontWeight: 500, background: style.bg, color: style.text, padding: '2px 8px', borderRadius: '20px', flexShrink: 0 }}>
                        {style.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500">Atividades do cronograma · esta semana</p>
              <button
                onClick={() => navigate('/painel/pessoal/atividades')}
                className="text-xs text-primary-600 hover:text-primary-800 transition-colors font-medium"
              >
                Ver todos →
              </button>
            </div>
            {scopeItems.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                {tab === 'pendentes' ? 'Nenhuma atividade pendente esta semana.' : 'Nenhuma atividade concluída esta semana.'}
              </p>
            ) : (
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
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500">Tarefas · esta semana</p>
              <button
                onClick={() => navigate('/painel/pessoal/tarefas')}
                className="text-xs text-primary-600 hover:text-primary-800 transition-colors font-medium"
              >
                Ver todos →
              </button>
            </div>
            {tasks.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                {tab === 'pendentes' ? 'Nenhuma tarefa pendente esta semana.' : 'Nenhuma tarefa concluída esta semana.'}
              </p>
            ) : (
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
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500">Atividade recente · últimos 7 dias</p>
              <button
                onClick={() => navigate('/painel/pessoal/feed')}
                className="text-xs text-primary-600 hover:text-primary-800 transition-colors font-medium"
              >
                Ver todos →
              </button>
            </div>
            {feed.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Nenhuma atividade nos últimos 7 dias.</p>
            ) : (
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
            )}
          </div>

        </div>
      </div>
    </div>
  )
}