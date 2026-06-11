import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import api from '../services/api'

const TI_AREA = 'Tecnologia da Informação'

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
  'vermelho':      { border: '#A32D2D', bg: '#FCEBEB', text: '#501313', label: 'Vencido' },
  'amarelo-escuro': { border: '#BA7517', bg: '#FAC775', text: '#412402', label: 'Próximo' },
  'amarelo-claro':  { border: '#EF9F27', bg: '#FAEEDA', text: '#633806', label: 'Em breve' },
}

const STATUS_TAG_STYLES = {
  verde:    { bg: '#E8F5E9', text: '#2E7D32', label: 'Em dia' },
  amarelo:  { bg: '#FAC775', text: '#412402', label: 'Atenção' },
  vermelho: { bg: '#FCEBEB', text: '#501313', label: 'Pendente' },
}

function SectionHeader({ icon, title, count, linkTo, navigate }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className={`ti ${icon}`} style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }} aria-hidden="true" />
        <span style={{ fontSize: '13px', fontWeight: 500 }}>{title}</span>
        {count > 0 && (
          <span style={{ fontSize: '11px', background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', padding: '2px 8px', borderRadius: '20px' }}>
            {count}
          </span>
        )}
      </div>
      {linkTo && (
        <button
          onClick={() => navigate(linkTo)}
          style={{ fontSize: '12px', color: 'var(--color-text-info)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Ver todos →
        </button>
      )}
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '16px 0' }}>
      {text}
    </p>
  )
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-400">Carregando painel...</p>
        </div>
      </div>
    )
  }

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

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'
  const formatRelative = (d) => {
    if (!d) return ''
    const diff = Math.floor((new Date() - new Date(d)) / (1000 * 60 * 60))
    if (diff < 1) return 'agora mesmo'
    if (diff < 24) return `há ${diff}h`
    const days = Math.floor(diff / 24)
    return `há ${days} dia${days > 1 ? 's' : ''}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-6">

        <div className="mb-6">
          <h1 className="text-base font-medium text-gray-900 mb-1">Painel pessoal</h1>
          <p className="text-xs text-gray-400">O que precisa da sua atenção nos projetos sob sua responsabilidade</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
          <div style={{ background: counts.statusReportsPending > 0 ? 'var(--color-background-danger)' : 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '14px' }}>
            <p style={{ fontSize: '12px', color: counts.statusReportsPending > 0 ? 'var(--color-text-danger)' : 'var(--color-text-secondary)', margin: '0 0 6px' }}>Status reports pendentes</p>
            <p style={{ fontSize: '24px', fontWeight: 500, color: counts.statusReportsPending > 0 ? 'var(--color-text-danger)' : 'var(--color-text-primary)', margin: 0 }}>{counts.statusReportsPending ?? 0}</p>
          </div>
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '14px' }}>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>Atividades esta semana</p>
            <p style={{ fontSize: '24px', fontWeight: 500, margin: 0 }}>{counts.scopeItems ?? 0}</p>
          </div>
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '14px' }}>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>Tarefas esta semana</p>
            <p style={{ fontSize: '24px', fontWeight: 500, margin: 0 }}>{counts.tasks ?? 0}</p>
          </div>
          <div style={{ background: counts.goLive > 0 ? 'var(--color-background-warning)' : 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '14px' }}>
            <p style={{ fontSize: '12px', color: counts.goLive > 0 ? 'var(--color-text-warning)' : 'var(--color-text-secondary)', margin: '0 0 6px' }}>Go-live próximo</p>
            <p style={{ fontSize: '24px', fontWeight: 500, color: counts.goLive > 0 ? 'var(--color-text-warning)' : 'var(--color-text-primary)', margin: 0 }}>{counts.goLive ?? 0}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setTab('pendentes')}
            style={{
              fontSize: '12px', fontWeight: 500, padding: '5px 16px',
              borderRadius: 'var(--border-radius-md)', border: 'none', cursor: 'pointer',
              background: tab === 'pendentes' ? '#534AB7' : 'var(--color-background-secondary)',
              color: tab === 'pendentes' ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            Pendentes
          </button>
          <button
            onClick={() => setTab('concluidos')}
            style={{
              fontSize: '12px', fontWeight: 500, padding: '5px 16px',
              borderRadius: 'var(--border-radius-md)', border: 'none', cursor: 'pointer',
              background: tab === 'concluidos' ? '#534AB7' : 'var(--color-background-secondary)',
              color: tab === 'concluidos' ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            Concluídos
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <SectionHeader icon="ti-rocket" title="Projetos com go-live próximo" count={counts.goLive} linkTo="/painel/pessoal/go-live" navigate={navigate} />
            {goLive.length === 0
              ? <EmptyState text="Nenhum projeto com go-live nos próximos 10 dias." />
              : goLive.map(p => {
                  const color = getGoLiveColor(p.go_live)
                  const style = GO_LIVE_STYLES[color] || null
                  return (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/projetos/${p.id}`)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 12px', marginBottom: '6px', cursor: 'pointer',
                        border: `0.5px solid var(--color-border-tertiary)`,
                        borderLeft: style ? `3px solid ${style.border}` : '0.5px solid var(--color-border-tertiary)',
                        borderRadius: 0,
                      }}
                    >
                      <span style={{ fontSize: '13px' }}>{p.title}</span>
                      {style && (
                        <span style={{ fontSize: '11px', fontWeight: 500, background: style.bg, color: style.text, padding: '3px 10px', borderRadius: '20px' }}>
                          {style.label} · {formatDate(p.go_live)}
                        </span>
                      )}
                    </div>
                  )
                })
            }
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <SectionHeader icon="ti-file-text" title="Status reports da semana" count={tab === 'pendentes' ? counts.statusReportsPending : undefined} linkTo="/painel/pessoal/status-reports" navigate={navigate} />
            {statusReports.length === 0
              ? <EmptyState text={tab === 'pendentes' ? 'Todos os status reports estão em dia.' : 'Nenhum status report lançado esta semana ainda.'} />
              : statusReports.map(p => {
                  const style = STATUS_TAG_STYLES[p.tag] || STATUS_TAG_STYLES.verde
                  return (
                    <div
                      key={p.project_id}
                      onClick={() => navigate(`/projetos/${p.project_id}`)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 12px', marginBottom: '6px', cursor: 'pointer',
                        border: '0.5px solid var(--color-border-tertiary)',
                        borderRadius: 'var(--border-radius-md)',
                      }}
                    >
                      <span style={{ fontSize: '13px' }}>{p.project_title}</span>
                      <span style={{ fontSize: '11px', fontWeight: 500, background: style.bg, color: style.text, padding: '3px 10px', borderRadius: '20px' }}>
                        {style.label}
                      </span>
                    </div>
                  )
                })
            }
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <SectionHeader icon="ti-list-check" title="Atividades do cronograma · esta semana" count={tab === 'pendentes' ? counts.scopeItems : undefined} linkTo="/painel/pessoal/atividades" navigate={navigate} />
            {scopeItems.length === 0
              ? <EmptyState text={tab === 'pendentes' ? 'Nenhuma atividade pendente esta semana.' : 'Nenhuma atividade concluída esta semana.'} />
              : scopeItems.map(i => (
                  <div
                    key={i.id}
                    onClick={() => navigate(`/projetos/${i.project.id}`)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', marginBottom: '6px', cursor: 'pointer',
                      border: '0.5px solid var(--color-border-tertiary)',
                      borderRadius: 'var(--border-radius-md)',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '13px', margin: '0 0 2px' }}>{i.title}</p>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', margin: 0 }}>{i.project.title}</p>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      Conclui {formatDate(i.end_date)}
                    </span>
                  </div>
                ))
            }
          </div>

          {/* 4. Tarefas */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <SectionHeader icon="ti-checkbox" title="Tarefas · esta semana" count={tab === 'pendentes' ? counts.tasks : undefined} linkTo="/painel/pessoal/tarefas" navigate={navigate} />
            {tasks.length === 0
              ? <EmptyState text={tab === 'pendentes' ? 'Nenhuma tarefa pendente esta semana.' : 'Nenhuma tarefa concluída esta semana.'} />
              : tasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/projetos/${t.project.id}`)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', marginBottom: '6px', cursor: 'pointer',
                      border: '0.5px solid var(--color-border-tertiary)',
                      borderRadius: 'var(--border-radius-md)',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '13px', margin: '0 0 2px' }}>{t.title}</p>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', margin: 0 }}>{t.project.title}</p>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      Conclui {formatDate(t.end_date)}
                    </span>
                  </div>
                ))
            }
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <SectionHeader icon="ti-history" title="Atividade recente · últimos 7 dias" linkTo="/painel/pessoal/feed" navigate={navigate} />
            {feed.length === 0
              ? <EmptyState text="Nenhuma atividade nos últimos 7 dias." />
              : feed.map(f => (
                  <div
                    key={f.id}
                    onClick={() => navigate(`/projetos/${f.project.id}`)}
                    style={{
                      padding: '10px 12px', marginBottom: '6px', cursor: 'pointer',
                      border: '0.5px solid var(--color-border-tertiary)',
                      borderLeft: f.is_own ? '3px solid #888780' : '3px solid #185FA5',
                      borderRadius: 0,
                    }}
                  >
                    <p style={{ fontSize: '13px', margin: '0 0 3px' }}>
                      <span style={{ fontWeight: 500, color: f.is_own ? '#444441' : '#0C447C' }}>
                        {f.is_own ? 'Você' : f.user.name}
                      </span>
                      {' · '}{f.description.replace(f.user.name, '').replace('Você', '').trim()}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', margin: 0 }}>
                      {f.project.title} · {formatRelative(f.created_at)} · {f.is_own ? 'ação sua' : 'outro usuário'}
                    </p>
                  </div>
                ))
            }
          </div>

        </div>
      </div>
    </div>
  )
}