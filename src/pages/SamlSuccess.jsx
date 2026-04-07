import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function SamlSuccess() {
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const userRaw = params.get('user')

    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw))
        login(user, token)
        navigate('/projetos', { replace: true })
      } catch (err) {
        navigate('/login?error=saml_error', { replace: true })
      }
    } else {
      navigate('/login?error=saml_error', { replace: true })
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-gray-400">Autenticando...</p>
    </div>
  )
}