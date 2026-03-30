import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth.service'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

const ALLOWED_DOMAIN = 'flamboyant.com.br'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const domain = email.split('@')[1]
    if (domain !== ALLOWED_DOMAIN) {
      setError(`Somente e-mails @${ALLOWED_DOMAIN} são permitidos.`)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      await authService.register({ name, email, password })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const AuthShell = ({ children }) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
            <div className="w-4 h-4 rounded-md bg-primary-50 opacity-80" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 leading-none">Status report</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-none">Grupo Flamboyant · Tecnologia</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )

  if (success) {
    return (
      <AuthShell>
        <div className="card p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <div className="w-5 h-5 rounded-full bg-teal-400" />
          </div>
          <h2 className="text-base font-medium text-gray-900 mb-2">Cadastro realizado!</h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-6">
            Aguarde a liberação do seu perfil pelo gerente ou coordenador antes de acessar o sistema.
          </p>
          <Button onClick={() => navigate('/login')} className="w-full">
            Ir para o login
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-8">
        <h1 className="text-lg font-medium text-gray-900 mb-1">Criar conta</h1>
        <p className="text-xs text-gray-400 mb-6">Preencha os dados abaixo para se cadastrar.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nome completo"
            placeholder="João Silva"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
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
            placeholder="Mínimo 6 caracteres"
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
            {loading ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>

        <div className="mt-5 pt-5 border-t border-gray-50 text-center">
          <Link to="/login" className="text-xs text-gray-400 hover:text-gray-500 transition-colors">
            Já tem conta? <span className="text-primary-600">Entrar</span>
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}