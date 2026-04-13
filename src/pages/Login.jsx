import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/auth.service'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showLdapForm, setShowLdapForm] = useState(false)
  const [ldapEmail, setLdapEmail] = useState('')
  const [ldapPassword, setLdapPassword] = useState('')
  const [ldapLoading, setLdapLoading] = useState(false)

  const handleLdapLogin = async () => {
    setError('')
    setLdapLoading(true)
    try {
      const response = await authService.ldapLogin({ email: ldapEmail, password: ldapPassword })
      login(response.data.user, response.data.token)
      navigate('/projetos')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao autenticar com o Active Directory.')
    } finally {
      setLdapLoading(false)
    }
  }

  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (err === 'pending_approval') {
      setError('Seu cadastro está aguardando aprovação.')
    } else if (err === 'rejected') {
      setError('Seu cadastro foi recusado. Entre em contato com o administrador.')
    } else if (err === 'saml_error') {
      setError('Erro ao autenticar com Microsoft. Tente novamente.')
    } else if (err === 'email_not_found') {
      setError('Não foi possível obter o e-mail da conta Microsoft.')
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await authService.login({ email, password })
      login(response.data.user, response.data.token)
      navigate('/projetos')
    } catch (err) {
      setError(err.response?.data?.error || 'E-mail ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shrink-0">
            <div className="w-4 h-4 rounded-md bg-primary-50 opacity-80" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 leading-none">Status report</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-none">Grupo Flamboyant · Tecnologia</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-8">
          <h1 className="text-lg font-medium text-gray-900 mb-1">Bem-vindo de volta</h1>
          <p className="text-xs text-gray-400 mb-6">Entre com suas credenciais para continuar.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="joao@flamboyant.com.br"
              value={email}
              onChange={e => setEmail(e.target.value)}
              hint="Somente @flamboyant.com.br"
              required
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="px-3 py-2.5 bg-danger-50 border border-danger-100 rounded-lg">
                <p className="text-xs text-danger-600">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-1">
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">ou</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowLdapForm(!showLdapForm)}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Entrar com Windows AD
            </button>

            {showLdapForm && (
              <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <Input
                  label="E-mail corporativo"
                  type="email"
                  placeholder="joao@grupoflamboyant.com.br"
                  value={ldapEmail}
                  onChange={e => setLdapEmail(e.target.value)}
                />
                <Input
                  label="Senha do Windows"
                  type="password"
                  placeholder="••••••••"
                  value={ldapPassword}
                  onChange={e => setLdapPassword(e.target.value)}
                />
                <Button
                  type="button"
                  onClick={handleLdapLogin}
                  disabled={ldapLoading}
                  className="w-full"
                >
                  {ldapLoading ? 'Autenticando...' : 'Entrar'}
                </Button>
              </div>
            )}
          </div>

          <div className="mt-5 pt-5 border-t border-gray-50 flex flex-col gap-2 text-center">
            <Link to="/esqueci-senha" className="text-xs text-primary-600 hover:text-primary-800 transition-colors">
              Esqueci minha senha
            </Link>
            <Link to="/cadastro" className="text-xs text-gray-400 hover:text-gray-500 transition-colors">
              Ainda não tem conta? <span className="text-primary-600">Cadastre-se</span>
            </Link>
          </div>
        </div>

        <p className="text-center text-2xs text-gray-300 mt-6">
          Seu acesso é liberado pelo gerente ou coordenador após o cadastro.
        </p>

      </div>
    </div>
  )
}