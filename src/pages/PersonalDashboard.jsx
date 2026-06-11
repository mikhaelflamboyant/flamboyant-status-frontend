import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import api from '../services/api'

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

function MetricCard({ label, value, color, textColor, onClick }) {
  return (
    <div
      className={`bg-white border border-gray-100 rounded-xl p-4 ${onClick ? 'cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all' : ''}`}
      style={color ? { background: color, borderColor: 'transparent' } : {}}
      onClick={onClick}
    >
      <p className="text-xs mb-1" style={{ color: textColor || '#6B7280' }}>{label}</p>
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

export default function PersonalDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pendentes')

  useEffect(() => {
    api.get('/personal/dashboard')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
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
  const scopeItems = (data?.scopeItems || []).filter(i =>
    tab === 'pendentes' ? !i.completion_date : !!i.completion_date
  )
  const tasks = (data?.tasks || []).filter(t =>
    tab === 'pendentes' ? !t.completed : t.completed
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-6">

        <h1 className="text-base font-medium text-gray-900 mb-4">Painel pessoal</h1>

        {/* Cards de resumo */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <MetricCard
            label="Status reports pendentes"
            value={counts.statusReportsPending ?? 0}
            color={counts.statusReportsPending > 0 ? '#FCEBEB' : undefined}
            textColor={counts.statusReportsPending > 0 ? '#791F1F' : undefined}
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
            onClick={() => navigate('/painel/pessoal/go-live')}
          />
        </div>

        {/* Toggle Pendentes / Concluídos */}
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

          {/* 1. Go-live próximo */}
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

          {/* 2. Status reports */}
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

          {/* 3. Atividades do cronograma */}
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
                {scopeItems.map(i => (
                  <div
                    key={i.id}
                    onClick={() => navigate(`/projetos/${i.project.id}`)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 truncate">{i.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{i.project.title}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-3">Conclusão em {formatDate(i.end_date)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Tarefas */}
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
                {tasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/projetos/${t.project.id}`)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate ${t.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{t.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.project.title}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-3">Conclusão em {formatDate(t.end_date)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Feed */}
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