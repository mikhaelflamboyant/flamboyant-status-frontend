import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function Navbar() {
  const { user, logout, isManager } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
          {isManager() && navLink('/usuarios', 'Usuários')}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/perfil')}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="text-right">
            <p className="text-xs font-medium text-gray-700 leading-none">{user?.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-none">
              {{
                SUPERINTENDENTE: 'Superintendente',
                GERENTE: 'Gerente',
                COORDENADOR: 'Coordenador',
                ANALISTA_MASTER: 'Analista Master',
                ANALISTA: 'Analista',
              }[user?.role] || user?.role}
            </p>
          </div>
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-800 flex-shrink-0">
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