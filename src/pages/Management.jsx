import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { managementService } from '../services/management.service'
import { useAuth } from '../hooks/useAuth'

const PHASE_LABELS = {
  RECEBIDA: 'Recebida',
  ENTREVISTA_SOLICITANTE: 'Entrevista',
  LEVANTAMENTO_REQUISITOS: 'Levantamento',
  ANALISE_SOLUCAO: 'Análise da solução',
  DESENVOLVIMENTO: 'Desenvolvimento',
  TESTES: 'Testes',
  VALIDACAO_SOLICITANTE: 'Validação',
  ENTREGUE: 'Entregue',
}

const FAROL_COLORS = {
  VERDE: { bg: '#E1F5EE', text: '#085041', dot: '#1D9E75', label: 'verde' },
  AMARELO: { bg: '#FAEEDA', text: '#633806', dot: '#EF9F27', label: 'atenção' },
  VERMELHO: { bg: '#FCEBEB', text: '#791F1F', dot: '#E24B4A', label: 'atraso' },
}

function MetricCard({ label, value, color, textColor, sub, onClick }) {
  return (
    <div
      className={`bg-white border border-gray-100 rounded-xl p-4 ${onClick ? 'cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all' : ''}`}
      style={color ? { background: color, borderColor: 'transparent' } : {}}
      onClick={onClick}
    >
      <p className="text-xs mb-1" style={{ color: textColor || '#6B7280' }}>{label}</p>
      <p className="text-2xl font-medium" style={{ color: textColor || '#111827' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: textColor || '#9CA3AF' }}>{sub}</p>}
    </div>
  )
}

function GoLiveChart({ data }) {
  const months = []
  const today = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
    const key = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    months.push({ key, label, count: data[key] || 0 })
  }
  const max = Math.max(...months.map(m => m.count), 3)

  return (
    <div className="flex items-end gap-3 h-32">
      {months.map(m => {
        const pct = m.count > 0 ? Math.max((m.count / max) * 100, 8) : 0
        const isPeak = m.count >= 3
        return (
          <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
            {m.count > 0 && (
              <span className={`text-xs font-medium ${isPeak ? 'text-red-500' : 'text-gray-600'}`}>
                {m.count}
              </span>
            )}
            <div className="w-full flex items-end" style={{ height: '80px' }}>
              <div
                style={{
                  width: '100%',
                  height: `${pct}%`,
                  background: isPeak ? '#E24B4A' : '#534AB7',
                  borderRadius: '4px 4px 0 0',
                  minHeight: m.count > 0 ? '6px' : '0',
                  transition: 'height 0.3s ease'
                }}
              />
            </div>
            <span className="text-xs text-gray-400 text-center">{m.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function Management() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [usersData, setUsersData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedUnits, setExpandedUnits] = useState({})
  const [expandedUsers, setExpandedUsers] = useState({})
  const noProjectsRef = useRef(null)

  const TI_AREA = 'Tecnologia da Informação'
  const canAccess = ['ANALISTA_MASTER', 'ANALISTA_TESTADOR', 'GERENTE', 'COORDENADOR'].includes(user?.role) &&
    (user?.area === TI_AREA || ['ANALISTA_MASTER', 'ANALISTA_TESTADOR'].includes(user?.role))

  useEffect(() => {
    if (!canAccess) { navigate('/projetos'); return }
    const load = async () => {
      try {
        const [dashRes, usersRes] = await Promise.all([
          managementService.getDashboard(),
          managementService.getUsers(),
        ])
        setDashboard(dashRes.data)
        setUsersData(usersRes.data)
      } catch (err) {
        setError('Erro ao carregar painel de gestão.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toggleUnit = (unit) => setExpandedUnits(prev => ({ ...prev, [unit]: !prev[unit] }))
  const toggleUser = (userId) => setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }))
  const initials = (name) => name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-6">

        <h1 className="text-base font-medium text-gray-900 mb-6">Painel de gestão</h1>

        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Visão geral</p>

        <div className="grid grid-cols-4 gap-3 mb-3">
          <MetricCard label="Projetos ativos" value={dashboard.totals.active} onClick={() => navigate('/projetos')} />
          <MetricCard label="Finalizados" value={dashboard.totals.archived} onClick={() => navigate('/projetos/arquivados')} />
          <MetricCard label="Atrasados" value={dashboard.totals.overdue} color="#FCEBEB" textColor="#791F1F" onClick={() => navigate('/projetos?farol=VERMELHO')} />
          <MetricCard label="Conclusão média" value={`${dashboard.totals.avg_completion}%`} />
        </div>

        <div className="grid grid-cols-4 gap-3 mb-5">
          <MetricCard
            label="Sem status recente"
            value={dashboard.totals.no_recent_status}
            color="#FAEEDA" textColor="#633806"
            sub="sem update há +7 dias"
            onClick={() => navigate('/projetos?filtro=sem_status')}
          />
          <MetricCard
            label="Sem go-live"
            value={dashboard.totals.no_go_live}
            color="#FAEEDA" textColor="#633806"
            sub="sem previsão definida"
            onClick={() => navigate('/projetos?filtro=sem_golive')}
          />
          <MetricCard
            label={`Entregues em ${currentMonth}`}
            value={dashboard.totals.delivered_this_month}
            color="#E1F5EE" textColor="#085041"
            sub="concluídos no mês atual"
            onClick={() => navigate('/projetos/arquivados?filtro=entregues_mes')}
          />
          <MetricCard
            label="Funcionários sem projetos"
            value={dashboard.totals.users_without_projects}
            sub="sem vínculo ativo"
            onClick={() => noProjectsRef.current?.scrollIntoView({ behavior: 'smooth' })}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 mb-3">Por farol</p>
            <div className="flex flex-col gap-2">
              {[['VERDE', 'No prazo'], ['AMARELO', 'Atenção'], ['VERMELHO', 'Atrasado']].map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: FAROL_COLORS[key].dot, flexShrink: 0 }} />
                  <span className="text-xs text-gray-700 flex-1">{label}</span>
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

        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Indicador PDTI - Projetos no prazo</p>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              dashboard.totals.active > 0 && (dashboard.by_farol.VERDE / dashboard.totals.active) >= 0.8
                ? 'bg-teal-50 text-teal-700'
                : 'bg-red-50 text-red-600'
            }`}>
              Meta: 80%
            </span>
          </div>
          <div className="flex items-end gap-3 mb-2">
            <p className="text-2xl font-medium text-gray-900">
              {dashboard.totals.active > 0
                ? Math.round((dashboard.by_farol.VERDE / dashboard.totals.active) * 100)
                : 0}%
            </p>
            <p className="text-xs text-gray-400 mb-1">
              {dashboard.by_farol.VERDE} de {dashboard.totals.active} projetos no prazo
            </p>
          </div>
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              style={{ width: `${dashboard.totals.active > 0 ? Math.round((dashboard.by_farol.VERDE / dashboard.totals.active) * 100) : 0}%` }}
              className={`h-full rounded-full transition-all ${
                dashboard.totals.active > 0 && (dashboard.by_farol.VERDE / dashboard.totals.active) >= 0.8
                  ? 'bg-teal-500'
                  : 'bg-red-400'
              }`}
            />
            <div className="absolute top-0 h-full" style={{ left: '80%' }}>
              <div className="w-px h-full bg-gray-400 opacity-50" />
            </div>
          </div>
          <div className="flex justify-end mt-0.5">
            <span className="text-xs text-gray-400" style={{ marginRight: '18%' }}>80%</span>
          </div>
        </div>

        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3 mt-8">Análise da carteira de projetos</p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 mb-3">Distribuição por nível estratégico</p>
            {(() => {
              const levels = [
                { key: 'A', label: 'A — Estratégico', bg: '#EEEDFE', text: '#26215C', bar: '#534AB7' },
                { key: 'B', label: 'B — Performance', bg: '#E6F1FB', text: '#042C53', bar: '#185FA5' },
                { key: 'C', label: 'C — Compliance', bg: '#FAEEDA', text: '#412402', bar: '#EF9F27' },
                { key: 'D', label: 'D — Inovação', bg: '#E1F5EE', text: '#04342C', bar: '#1D9E75' },
                { key: 'null', label: 'Não definido', bg: '#F1EFE8', text: '#444441', bar: '#B4B2A9' },
              ]
              const total = Object.values(dashboard.by_level).reduce((a, b) => a + b, 0)
              return (
                <div className="flex flex-col gap-2">
                  {levels.map(l => {
                    const count = dashboard.by_level[l.key] || 0
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0
                    return (
                      <div key={l.key} className="flex items-center gap-2">
                        <span style={{ background: l.bg, color: l.text }} className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0" title={l.label}>
                          {l.label.split(' — ')[0]}
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div style={{ width: `${pct}%`, background: l.bar }} className="h-full rounded-full transition-all" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 min-w-[16px] text-right">{count}</span>
                      </div>
                    )
                  })}
                  <p className="text-xs text-gray-400 mt-1">{total} projetos ativos no total</p>
                </div>
              )
            })()}
          </div>

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
                {Object.entries(dashboard.avg_delivery_by_unit)
                  .sort(([, a], [, b]) => a - b)
                  .map(([unit, days]) => (
                    <div key={unit} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-700">{unit}</span>
                      <span className="text-xs font-medium text-gray-900">{days} dias</span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium text-gray-500">Linha do tempo - go-lives nos próximos 6 meses</p>
            <span className="text-xs text-gray-400">{Object.values(dashboard.go_live_timeline).reduce((a, b) => a + b, 0)} projetos com go-live definido</span>
          </div>
          <GoLiveChart data={dashboard.go_live_timeline} />
        </div>

        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Funcionários por unidade de negócio</p>

        <div className="flex flex-col gap-3">
          {Object.entries(usersData.by_area).map(([unit, users]) => (
            <div key={unit} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleUnit(unit)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-800">{unit}</span>
                  <span className="text-xs bg-violet-50 text-violet-800 px-2.5 py-0.5 rounded-full">
                    {users.length} funcionário{users.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{expandedUnits[unit] ? '▼' : '▶'}</span>
              </div>

              {expandedUnits[unit] && (
                <div className="p-3 flex flex-col gap-2">
                  {users.map(u => (
                    <div key={u.id} className="border border-gray-100 rounded-xl overflow-hidden">
                      <div
                        className="flex items-center justify-between px-3 py-2.5 bg-white border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleUser(u.id)}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center text-xs font-medium text-primary-800 shrink-0">
                            {initials(u.name)}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-800">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-gray-700">{u.projects_count} projeto{u.projects_count !== 1 ? 's' : ''}</span>
                          <div className="flex gap-1">
                            {Object.entries(
                              u.projects.reduce((acc, p) => {
                                acc[p.traffic_light] = (acc[p.traffic_light] || 0) + 1
                                return acc
                              }, {})
                            ).sort(([a], [b]) => {
                              const order = { VERDE: 0, AMARELO: 1, VERMELHO: 2 }
                              return (order[a] ?? 3) - (order[b] ?? 3)
                            }).map(([farol, count]) => {
                              const fc = FAROL_COLORS[farol]
                              if (!fc) return null
                              return (
                                <span key={farol} style={{ background: fc.bg, color: fc.text }} className="text-xs px-1.5 py-0.5 rounded">
                                  {count} {fc.label}
                                </span>
                              )
                            })}
                          </div>
                          <span className="text-xs text-gray-400">{expandedUsers[u.id] ? '▼' : '▶'}</span>
                        </div>
                      </div>

                      {expandedUsers[u.id] && (
                        <div className="px-3 py-2 flex flex-col gap-1.5 bg-white">
                          {u.projects.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-3">Nenhum projeto vinculado.</p>
                          ) : (
                            u.projects.map(p => {
                              const fc = FAROL_COLORS[p.traffic_light]
                              return (
                                <div
                                  key={p.id}
                                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                  onClick={() => navigate(`/projetos/${p.id}`)}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: fc?.dot || '#888', flexShrink: 0 }} />
                                    <span className="text-xs text-gray-800 truncate">{p.title}</span>
                                  </div>
                                  <div className="flex items-center gap-4 shrink-0">
                                    <span className="text-xs text-gray-400">{PHASE_LABELS[p.current_phase] || p.current_phase}</span>
                                    <span className="text-xs text-gray-400">
                                      {p.go_live ? new Date(p.go_live).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Sem previsão'}
                                    </span>
                                    <span className="text-xs text-primary-600 font-medium">Ver →</span>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {usersData.without_projects && Object.keys(usersData.without_projects).length > 0 && (
          <div ref={noProjectsRef} className="mt-8">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Funcionários sem projetos ({dashboard.totals.users_without_projects})
            </p>
            <div className="flex flex-col gap-3">
              {Object.entries(usersData.without_projects).map(([unit, users]) => (
                <div key={unit} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div
                    className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleUnit(`no_projects_${unit}`)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-800">{unit}</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full">
                        {users.length} funcionário{users.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {expandedUnits[`no_projects_${unit}`] ? '▼' : '▶'}
                    </span>
                  </div>
                  {expandedUnits[`no_projects_${unit}`] && (
                    <div className="p-3 flex flex-col gap-2">
                      {users.map(u => (
                        <div key={u.id} className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 rounded-lg">
                          <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center text-xs font-medium text-primary-800 shrink-0">
                            {initials(u.name)}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-800">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}