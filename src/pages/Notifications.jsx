import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { notificationsService } from '../services/notifications.service'

const PAGE_SIZE = 10

const TYPE_LABELS = {
  VINCULADO_PROJETO: 'Projeto',
  NOVO_PROJETO: 'Novo projeto',
  NOVO_STATUS: 'Status report',
  USUARIO_PENDENTE: 'Aprovação',
  PROJETO_ATRASADO: 'Atrasado',
  PROXIMO_GO_LIVE: 'Go-live',
}

const TYPE_COLORS = {
  VINCULADO_PROJETO: 'bg-primary-50 text-primary-800',
  NOVO_PROJETO: 'bg-teal-50 text-teal-800',
  NOVO_STATUS: 'bg-blue-50 text-blue-800',
  USUARIO_PENDENTE: 'bg-amber-50 text-amber-800',
  PROJETO_ATRASADO: 'bg-red-50 text-red-600',
  PROXIMO_GO_LIVE: 'bg-amber-50 text-amber-800',
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await notificationsService.list()
        setNotifications(response.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [typeFilter])

  const handleClick = async (notification) => {
    if (!notification.read) {
      await notificationsService.markAsRead(notification.id)
      setNotifications(prev => prev.map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      ))
    }
    if (notification.link) navigate(notification.link)
  }

  const handleMarkAllRead = async () => {
    await notificationsService.markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const filtered = useMemo(() => {
    if (!typeFilter) return notifications
    return notifications.filter(n => n.type === typeFilter)
  }, [notifications, typeFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-base font-medium text-gray-900">Notificações</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}` : 'Todas lidas'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-primary-600 hover:text-primary-800 border border-primary-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          <button
            onClick={() => setTypeFilter('')}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              typeFilter === ''
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            Todas
          </button>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                typeFilter === key
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">Carregando notificações...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">Nenhuma notificação encontrada.</p>
          </div>
        )}

        {!loading && paginated.length > 0 && (
          <>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              {paginated.map((n, index) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${
                    index !== paginated.length - 1 ? 'border-b border-gray-50' : ''
                  } ${!n.read ? 'bg-primary-50/20' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[n.type] || 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[n.type] || n.type}
                      </span>
                      {!n.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.body}</p>
                    <p className="text-xs text-gray-300 mt-1">
                      {new Date(n.created_at).toLocaleDateString('pt-BR')} às {new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {n.link && (
                    <span className="text-xs text-primary-600 shrink-0 mt-1">Ver →</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-400">
                {paginated.length} notificaç{paginated.length !== 1 ? 'ões' : 'ão'} nesta página · página {page} de {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 px-3 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  ← Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
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
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 px-3 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  Próxima →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}