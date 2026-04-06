import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    } catch (err) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } finally {
      setLoading(false)
    }
  }, [])

  const login = (userData, userToken) => {
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('token', userToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const isPrivileged = () => ['ANALISTA_MASTER', 'SUPERINTENDENTE', 'DIRETOR', 'GERENTE', 'COORDENADOR', 'SUPERVISOR'].includes(user?.role)
  const isManager = () => ['ANALISTA_MASTER', 'SUPERINTENDENTE', 'DIRETOR', 'GERENTE', 'COORDENADOR'].includes(user?.role)
  const canCreateProject = () => user?.area === 'TI' || user?.role === 'ANALISTA_MASTER'

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isPrivileged, isManager, canCreateProject, loading }}>
      {children}
    </AuthContext.Provider>
  )
}