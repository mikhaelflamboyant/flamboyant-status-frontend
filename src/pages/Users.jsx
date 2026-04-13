import { useState, useEffect } from 'react'
import { Navbar } from '../components/layout/Navbar'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'

const ROLES = ['ANALISTA_MASTER', 'ANALISTA_TESTADOR', 'SUPERINTENDENTE', 'DIRETOR', 'GERENTE', 'COORDENADOR', 'SUPERVISOR', 'ANALISTA']

const ROLE_LABELS = {
  ANALISTA_MASTER:   'Analista Master',
  ANALISTA_TESTADOR: 'Analista Testador',
  SUPERINTENDENTE:   'Superintendente',
  DIRETOR:           'Diretor',
  GERENTE:           'Gerente',
  COORDENADOR:       'Coordenador',
  SUPERVISOR:        'Supervisor',
  ANALISTA:          'Analista',
}

const ROLE_BADGE = {
  ANALISTA_MASTER:   'bg-amber-50 text-amber-800',
  ANALISTA_TESTADOR: 'bg-orange-50 text-orange-800',
  SUPERINTENDENTE:   'bg-violet-100 text-violet-800',
  DIRETOR:           'bg-purple-100 text-purple-800',
  GERENTE:           'bg-primary-50 text-primary-800',
  COORDENADOR:       'bg-blue-50 text-blue-800',
  SUPERVISOR:        'bg-teal-50 text-teal-800',
  ANALISTA:          'bg-gray-100 text-gray-600',
}

const CAN_APPROVE = ['ANALISTA_MASTER', 'SUPERINTENDENTE', 'DIRETOR', 'GERENTE', 'COORDENADOR']

export default function Users() {
  const { user, isManager } = useAuth()
  const [tab, setTab] = useState('ativos')
  const [users, setUsers] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState('')

  const fetchUsers = async () => {
    try {
      const [activeRes, pendingRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/pending')
      ])
      setUsers(activeRes.data)
      setPending(pendingRes.data)
    } catch (err) {
      setError('Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

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

  const handleApprove = async (userId) => {
    setUpdatingId(userId)
    try {
      await api.patch(`/users/${userId}/approve`)
      setPending(prev => prev.filter(u => u.id !== userId))
      fetchUsers()
    } catch (err) {
      alert('Erro ao aprovar usuário.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleReject = async (userId) => {
    setUpdatingId(userId)
    try {
      await api.patch(`/users/${userId}/reject`)
      setPending(prev => prev.filter(u => u.id !== userId))
    } catch (err) {
      alert('Erro ao recusar usuário.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return
    setUpdatingId(userId)
    try {
      await api.delete(`/users/${userId}`)
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao excluir usuário.')
    } finally {
      setUpdatingId(null)
    }
  }

  const canApprove = CAN_APPROVE.includes(user?.role)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-base font-medium text-gray-900">Gestão de usuários</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {users.length} usuário{users.length !== 1 ? 's' : ''} ativo{users.length !== 1 ? 's' : ''}
              {pending.length > 0 && ` · ${pending.length} pendente${pending.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="flex gap-1 mb-5">
          <button
            onClick={() => setTab('ativos')}
            className={`text-xs px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === 'ativos'
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            Ativos ({users.length})
          </button>
          <button
            onClick={() => setTab('pendentes')}
            className={`text-xs px-4 py-2 rounded-lg font-medium transition-colors relative ${
              tab === 'pendentes'
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            Pendentes ({pending.length})
            {pending.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pending.length}
              </span>
            )}
          </button>
        </div>

        {loading && (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">Carregando...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && tab === 'ativos' && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50 grid grid-cols-12 gap-4">
              <p className="col-span-4 text-xs font-medium text-gray-400">Usuário</p>
              <p className="col-span-2 text-xs font-medium text-gray-400">Área</p>
              <p className="col-span-2 text-xs font-medium text-gray-400">Perfil</p>
              <p className="col-span-3 text-xs font-medium text-gray-400">Alterar perfil</p>
              <p className="col-span-1 text-xs font-medium text-gray-400"></p>
            </div>

            {users.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">Nenhum usuário ativo.</p>
            )}

            {users.map((u, index) => (
              <div
                key={u.id}
                className={`px-5 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors ${
                  index !== users.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className="col-span-4 flex items-center gap-3">
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

                <div className="col-span-2">
                  <p className="text-xs text-gray-600 truncate">{u.area || '—'}</p>
                </div>

                <div className="col-span-2">
                  <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_BADGE[u.role]}`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </div>

                <div className="col-span-3">
                  {isManager() && u.id !== user?.id ? (
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      disabled={updatingId === u.id}
                      className="w-full h-8 px-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white text-gray-600 disabled:opacity-50"
                    >
                      {ROLES.map(r => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </div>

                <div className="col-span-1 flex justify-end">
                  {u.id !== user?.id && (
                    <button
                      onClick={() => handleDelete(u.id)}
                      disabled={updatingId === u.id}
                      className="hover:opacity-70 transition-opacity disabled:opacity-30"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && tab === 'pendentes' && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">

            {pending.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">Nenhuma solicitação pendente.</p>
            )}

            {pending.map((u, index) => (
              <div
                key={u.id}
                className={`px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                  index !== pending.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 shrink-0">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Solicitado em {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                {canApprove && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(u.id)}
                      disabled={updatingId === u.id}
                      className="text-xs bg-teal-500 text-white px-3 py-1.5 rounded-lg hover:bg-teal-600 disabled:opacity-50 transition-colors font-medium"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleReject(u.id)}
                      disabled={updatingId === u.id}
                      className="text-xs bg-white border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors font-medium"
                    >
                      Recusar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}