import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import api from '../services/api'

const STAGE_LABELS = {
  PLANEJAMENTO: '1. Planejamento',
  EXECUCAO: '2. Execução',
  GO_LIVE: '3. Go-live',
  SUPORTE: '4. Suporte pós go-live',
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

export default function PersonalScopeItems() {
  const navigate = useNavigate()
  const [data, setData] = useState({ data: [], page: 1, totalPages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState('pendentes')
  const [loading, setLoading] = useState(true)

  useEffect(() => { setPage(1) }, [tab])

  useEffect(() => {
    setLoading(true)
    api.get(`/personal/scope-items?page=${page}&tab=${tab}`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, tab])

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
          <span className="text-xs text-gray-500">Atividades do cronograma</span>
        </div>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-base font-medium text-gray-900">Atividades do cronograma · esta semana</h1>
            <p className="text-xs text-gray-400 mt-0.5">{data.total} atividade{data.total !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-1">
            {['pendentes', 'concluidos'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${tab === t ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                {t === 'pendentes' ? 'Pendentes' : 'Concluídas'}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="text-sm text-gray-400 text-center py-16">Carregando...</p>}

        {!loading && data.data.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">
              {tab === 'pendentes' ? 'Nenhuma atividade pendente esta semana.' : 'Nenhuma atividade concluída esta semana.'}
            </p>
          </div>
        )}

        {!loading && data.data.length > 0 && (
          <>
            <div className="flex flex-col gap-2.5">
              {data.data.map(i => (
                <div
                  key={i.id}
                  onClick={() => navigate(`/projetos/${i.project.id}`)}
                  className="bg-white border border-gray-100 rounded-xl px-5 py-4 cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{i.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400">{i.project.title}</span>
                        {i.stage && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {STAGE_LABELS[i.stage] || i.stage}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs text-gray-400">Conclui {formatDate(i.end_date)}</span>
                      {i.completion_date && (
                        <span className="text-xs text-teal-600 font-medium">Concluído {formatDate(i.completion_date)}</span>
                      )}
                      {!i.completion_date && (
                        <span className="text-xs text-gray-400">{i.completion_pct}%</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}