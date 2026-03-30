import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../services/auth.service'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao enviar e-mail.')
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
          <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <div className="w-5 h-5 rounded-full bg-primary-400" />
          </div>
          <h2 className="text-base font-medium text-gray-900 mb-2">E-mail enviado!</h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-6">
            Se o e-mail existir no sistema, você receberá as instruções para redefinir sua senha em breve.
          </p>
          <Link to="/login">
            <Button className="w-full">Voltar para o login</Button>
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-8">
        <h1 className="text-lg font-medium text-gray-900 mb-1">Recuperar senha</h1>
        <p className="text-xs text-gray-400 mb-6">
          Digite seu e-mail e enviaremos as instruções para redefinir sua senha.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="joao@flamboyant.com.br"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          {error && (
            <div className="px-3 py-2.5 bg-danger-50 border border-danger-100 rounded-lg">
              <p className="text-xs text-danger-600">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-1">
            {loading ? 'Enviando...' : 'Enviar instruções'}
          </Button>
        </form>

        <div className="mt-5 pt-5 border-t border-gray-50 text-center">
          <Link to="/login" className="text-xs text-gray-400 hover:text-gray-500 transition-colors">
            ← Voltar para o login
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}