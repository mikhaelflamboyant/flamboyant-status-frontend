import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import api from '../services/api'

const ACTION_LABELS = {
  PROJECT_EDITED:       'editou o projeto',
  TASK_CREATED:         'criou uma tarefa em',
  TASK_UPDATED:         'atualizou uma tarefa em',
  TASK_COMPLETED:       'concluiu uma tarefa em',
  SCOPE_CREATED:        'adicionou uma atividade ao cronograma de',
  SCOPE_UPDATED:        'atualizou o cronograma de',
  REQUIREMENT_UPDATED:  'atualizou os requisitos de',
}

function formatRelative(d) {
  if (!d) return ''
  const diff = Math.floor((new Date() - new Date(d)) / (1000 * 60 * 60))
  if (diff < 1) return 'agora mesmo'
  if (diff < 24) return `há ${diff}h`
  const days = Math.floor(diff / 24)
  return `há ${days} dia${days > 1 ? 's' : ''}`
}

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

export default function PersonalFeed() {
  const navigate = useNavigate()
  const [data, setData] = useState({ data: [], page: 1, totalPages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/personal/feed?page=${page}`)
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
          <span className="text-xs text-gray-500">Atividade recente</span>
        </div>

        <div className="mb-5">
          <h1 className="text-base font-medium text-gray-900">Atividade recente</h1>
          <p className="text-xs text-gray-400 mt-0.5">Últimos 7 dias nos projetos sob sua responsabilidade · {data.total} registro{data.total !== 1 ? 's' : ''}</p>
        </div>

        {loading && <p className="text-sm text-gray-400 text-center py-16">Carregando...</p>}

        {!loading && data.data.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">Nenhuma atividade registrada nos últimos 7 dias.</p>
          </div>
        )}

        {!loading && data.data.length > 0 && (
          <>
            <div className="flex flex-col gap-2.5">
              {data.data.map(f => (
                <div
                  key={f.id}
                  onClick={() => navigate(`/projetos/${f.project.id}`)}
                  className="bg-white cursor-pointer hover:shadow-sm transition-all"
                  style={{
                    border: '0.5px solid var(--color-border-tertiary)',
                    borderLeft: f.is_own ? '3px solid #888780' : '3px solid #185FA5',
                    borderRadius: 0,
                    padding: '12px 16px',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">
                        <span style={{ fontWeight: 500, color: f.is_own ? '#444441' : '#0C447C' }}>
                          {f.is_own ? 'Você' : f.user.name}
                        </span>
                        {' '}
                        <span className="text-gray-600">
                          {ACTION_LABELS[f.action_type] || 'atualizou'}
                        </span>
                        {' '}
                        <span className="font-medium text-gray-800">{f.project.title}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{formatRelative(f.created_at)}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs" style={{ color: f.is_own ? '#888780' : '#185FA5' }}>
                          {f.is_own ? 'ação sua' : 'outro usuário'}
                        </span>
                      </div>
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