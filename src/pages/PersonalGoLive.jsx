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
  'vermelho':       { border: '#A32D2D', bg: '#FCEBEB', text: '#501313' },
  'amarelo-escuro': { border: '#BA7517', bg: '#FAC775', text: '#412402' },
  'amarelo-claro':  { border: '#EF9F27', bg: '#FAEEDA', text: '#633806' },
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center gap-1 mt-4 justify-end">
      <button onClick={() => onChange(p => Math.max(1, p - 1))} disabled={page === 1}
        className="h-8 px-3 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
        ← Anterior
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onChange(() => p)}
          className={`h-8 w-8 text-xs rounded-lg border transition-colors ${p === page ? 'bg-primary-600 text-white border-primary-600 font-medium' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
          {p}
        </button>
      ))}
      <button onClick={() => onChange(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
        className="h-8 px-3 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
        Próxima →
      </button>
    </div>
  )
}

export default function PersonalGoLive() {
  const navigate = useNavigate()
  const [data, setData] = useState({ data: [], page: 1, totalPages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/personal/go-live?page=${page}`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2 mb-5">
          <button onClick={() => navigate('/painel/pessoal')}
            className="text-xs text-primary-600 hover:text-primary-800 transition-colors">
            ← Painel pessoal
          </button>
          <span className="text-xs text-gray-300">/</span>
          <span className="text-xs text-gray-500">Go-live próximo</span>
        </div>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-base font-medium text-gray-900">Projetos com go-live próximo</h1>
            <p className="text-xs text-gray-400 mt-0.5">{data.total} projeto{data.total !== 1 ? 's' : ''} com go-live nos próximos 10 dias</p>
          </div>
        </div>

        {loading && <p className="text-sm text-gray-400 text-center py-16">Carregando...</p>}

        {!loading && data.data.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">Nenhum projeto com go-live nos próximos 10 dias.</p>
          </div>
        )}

        {!loading && data.data.length > 0 && (
          <>
            <div className="flex flex-col gap-2.5">
              {data.data.map(p => {
                const color = getGoLiveColor(p.go_live)
                const style = GO_LIVE_STYLES[color] || null
                const diff = p.go_live ? Math.ceil((new Date(p.go_live) - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24)) : null
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/projetos/${p.id}`)}
                    className="bg-white rounded-xl px-5 py-4 cursor-pointer hover:shadow-sm transition-all"
                    style={{
                      border: '0.5px solid var(--color-border-tertiary)',
                      borderLeft: style ? `3px solid ${style.border}` : undefined,
                      borderRadius: 0,
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-gray-900">{p.title}</p>
                      <div className="flex items-center gap-3 shrink-0">
                        {style && (
                          <span style={{ fontSize: '11px', fontWeight: 500, background: style.bg, color: style.text, padding: '3px 10px', borderRadius: '20px' }}>
                            {diff < 0 ? 'Vencido' : diff === 0 ? 'Hoje' : `Em ${diff} dia${diff !== 1 ? 's' : ''}`}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{formatDate(p.go_live)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}