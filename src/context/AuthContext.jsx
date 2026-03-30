import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }

    setLoading(false)
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

  const isPrivileged = () => {
    return ['GERENTE', 'COORDENADOR', 'ANALISTA_MASTER'].includes(user?.role)
  }

  const isManager = () => {
    return ['GERENTE', 'COORDENADOR'].includes(user?.role)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isPrivileged, isManager }}>
      {children}
    </AuthContext.Provider>
  )
}