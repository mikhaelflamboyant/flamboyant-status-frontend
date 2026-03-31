import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { useAuth } from '../hooks/useAuth'

const ROLE_LABELS = {
  SUPERINTENDENTE: 'Superintendente',
  GERENTE: 'Gerente',
  COORDENADOR: 'Coordenador',
  ANALISTA_MASTER: 'Analista Master',
  ANALISTA: 'Analista',
}

export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-lg mx-auto px-6 py-10">

        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
          >
            ← Voltar
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-8">

          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-50">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-xl font-medium text-primary-800 shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-medium text-gray-900">{user?.name}</p>
              <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary-800 mt-1">
                {ROLE_LABELS[user?.role] || user?.role}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1.5">Nome completo</p>
              <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2.5 rounded-lg">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1.5">E-mail</p>
              <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2.5 rounded-lg">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1.5">Perfil de acesso</p>
              <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2.5 rounded-lg">{ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1.5">Área</p>
              <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2.5 rounded-lg">{user?.area || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1.5">Membro desde</p>
              <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2.5 rounded-lg">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '—'}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-50">
            <p className="text-xs text-gray-400 text-center">
              Para alterar seus dados, entre em contato com o gerente ou coordenador.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}