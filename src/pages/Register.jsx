import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth.service'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const ALLOWED_DOMAIN = 'flamboyant.com.br'

const AREAS = [
      'RH', 'Jurídica', 'Agropecuária', 'Construção',
      'Contabilidade', 'Controladoria', 'Processos',
      'Depto. de Pessoas', 'Comitê Executivo', 'TI', 'Outros'
]

const validatePassword = (pwd) => {
  if (pwd.length < 8) return 'A senha deve ter no mínimo 8 caracteres.'
  if (!/[A-Z]/.test(pwd)) return 'A senha deve ter pelo menos uma letra maiúscula.'
  if (!/[a-z]/.test(pwd)) return 'A senha deve ter pelo menos uma letra minúscula.'
  if (!/[0-9]/.test(pwd)) return 'A senha deve ter pelo menos um número.'
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) return 'A senha deve ter pelo menos um caractere especial.'
  return null
}

const AuthShell = ({ children }) => (
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
      {children}
    </div>
  </div>
)

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [area, setArea] = useState('')
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

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (!area) {
      setError('Selecione sua área.')
      return
    }

    setLoading(true)
    try {
      await authService.register({ name, email, password, area })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthShell>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-8 text-center">
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
            placeholder="Nome Completo"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <Input
            label="E-mail"
            type="email"
            placeholder="seunome@flamboyant.com.br"
            value={email}
            onChange={e => setEmail(e.target.value)}
            hint="Somente @flamboyant.com.br"
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">
              Área <span className="text-red-400">*</span>
            </label>
            <select
              value={area}
              onChange={e => setArea(e.target.value)}
              className="h-9 w-full px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-600 transition-colors bg-white text-gray-700"
              required
            >
              <option value="">Selecionar área</option>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">
              Senha <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="h-9 w-full px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-600 transition-colors placeholder:text-gray-300"
            />
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1">
              {[
                { label: '8+ caracteres', test: password.length >= 8 },
                { label: '1 letra maiúscula', test: /[A-Z]/.test(password) },
                { label: '1 letra minúscula', test: /[a-z]/.test(password) },
                { label: '1 número', test: /[0-9]/.test(password) },
                { label: '1 caractere especial', test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.test ? 'bg-teal-400' : 'bg-gray-200'}`} />
                  <span className={`text-xs transition-colors ${item.test ? 'text-teal-600' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs text-red-500">{error}</p>
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