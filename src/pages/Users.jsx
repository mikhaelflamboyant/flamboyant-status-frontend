import { useState, useEffect } from 'react'
import { Navbar } from '../components/layout/Navbar'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'

const ROLES = ['GERENTE', 'COORDENADOR', 'ANALISTA_MASTER', 'ANALISTA']

const ROLE_LABELS = {
  GERENTE: 'Gerente',
  COORDENADOR: 'Coordenador',
  ANALISTA_MASTER: 'Analista Master',
  ANALISTA: 'Analista',
}

const ROLE_BADGE = {
  GERENTE:        'bg-primary-50 text-primary-800',
  COORDENADOR:    'bg-primary-50 text-primary-800',
  ANALISTA_MASTER:'bg-amber-50 text-amber-800',
  ANALISTA:       'bg-gray-100 text-gray-600',
}

export default function Users() {
  const { user, isManager } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users')
        setUsers(response.data)
      } catch (err) {
        setError('Erro ao carregar usuários.')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId)
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (err) {
      alert('Erro ao atualizar perfil.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-base font-medium text-gray-900">Gestão de usuários</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {loading && (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">Carregando usuários...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">

            <div className="px-5 py-3 border-b border-gray-50 grid grid-cols-12 gap-4">
              <p className="col-span-5 text-xs font-medium text-gray-400">Usuário</p>
              <p className="col-span-3 text-xs font-medium text-gray-400">Perfil atual</p>
              <p className="col-span-4 text-xs font-medium text-gray-400">Alterar perfil</p>
            </div>

            {users.map((u, index) => (
              <div
                key={u.id}
                className={`px-5 py-4 grid grid-cols-12 gap-4 items-center ${
                  index !== users.length - 1 ? 'border-b border-gray-50' : ''
                } hover:bg-gray-50 transition-colors`}
              >
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-800 shrink-0">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                      {u.id === user?.id && (
                        <span className="text-xs text-gray-400 shrink-0">(você)</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                </div>

                <div className="col-span-3">
                  <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_BADGE[u.role]}`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </div>

                <div className="col-span-4">
                  {isManager() && u.id !== user?.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        disabled={updatingId === u.id}
                        className="flex-1 h-8 px-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white text-gray-600 disabled:opacity-50 transition-colors"
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                      {updatingId === u.id && (
                        <span className="text-xs text-gray-400 shrink-0">Salvando...</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  )
}