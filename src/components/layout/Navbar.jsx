import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { notificationsService } from '../../services/notifications.service'

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

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

export function Navbar() {
  const { user, logout, isManager } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const dropdownRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.read).length

  const fetchNotifications = async () => {
    try {
      const response = await notificationsService.list()
      setNotifications(response.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await notificationsService.markAsRead(notification.id)
      setNotifications(prev => prev.map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      ))
    }
    setShowNotifications(false)
    if (notification.link) navigate(notification.link)
  }

  const handleMarkAllRead = async () => {
    await notificationsService.markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
        isActive(to)
          ? 'bg-primary-50 text-primary-800'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="bg-white border-b border-gray-100 px-6 h-12 flex items-center justify-between sticky top-0 z-10 shadow-card">

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-primary-600 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-sm bg-primary-50 opacity-80" />
          </div>
          <span className="text-sm font-medium text-gray-900 tracking-tight">
            Status report
          </span>
        </div>

        <div className="h-4 w-px bg-gray-100" />

        <div className="flex items-center gap-1">
          {navLink('/projetos', 'Projetos ativos')}
          {navLink('/projetos/arquivados', 'Finalizados')}
          {['ANALISTA_MASTER', 'ANALISTA_TESTADOR', 'GERENTE', 'COORDENADOR'].includes(user?.role) && navLink('/usuarios', 'Usuários')}
          {(user?.area === 'Tecnologia da Informação' || ['ANALISTA_MASTER', 'ANALISTA_TESTADOR'].includes(user?.role)) && navLink('/api', 'API')}
        </div>
      </div>

      <div className="flex items-center gap-3">

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            className="relative w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-9 w-80 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <p className="text-xs font-medium text-gray-900">Notificações</p>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">
                    Nenhuma notificação.
                  </p>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${
                        !n.read ? 'bg-primary-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${TYPE_COLORS[n.type] || 'bg-gray-100 text-gray-600'}`}>
                              {TYPE_LABELS[n.type] || n.type}
                            </span>
                            {!n.read && (
                              <div className="w-1.5 h-1.5 rounded-full bg-primary-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs font-medium text-gray-800 truncate">{n.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{n.body}</p>
                          <p className="text-xs text-gray-300 mt-1">
                            {new Date(n.created_at).toLocaleDateString('pt-BR')} às {new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-gray-50">
                <button
                  onClick={() => { setShowNotifications(false); navigate('/notificacoes') }}
                  className="w-full text-xs text-primary-600 hover:text-primary-800 transition-colors text-center font-medium"
                >
                  Ver todas as notificações
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-gray-100" />

        <button
          onClick={() => navigate('/perfil')}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="text-right">
            <p className="text-xs font-medium text-gray-700 leading-none">{user?.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-none">
              {{
                SUPERINTENDENTE: 'Superintendente',
                DIRETOR: 'Diretor',
                GERENTE: 'Gerente',
                COORDENADOR: 'Coordenador',
                SUPERVISOR: 'Supervisor',
                ANALISTA_MASTER: 'Analista Master',
                ANALISTA_TESTADOR: 'Analista Testador',
                ANALISTA: 'Analista',
              }[user?.role] || user?.role}
            </p>
          </div>
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-800 shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </button>

        <div className="h-4 w-px bg-gray-100" />

        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Sair
        </button>
      </div>

    </nav>
  )
}