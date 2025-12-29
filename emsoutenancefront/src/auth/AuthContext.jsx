import { createContext, useContext, useState, useEffect } from "react"
import { Navigate, useLocation } from "react-router-dom"
import api from "../services/api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const clearAuth = () => {
    setUser(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  }

  const logout = async () => {
    try {
      if (localStorage.getItem('access_token')) {
        await api.post('/logout')
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
    }
  }

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/login', { email, password })
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      return true
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }


  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token')

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const { data } = await api.get('/user')
        setUser(data)
        localStorage.setItem('user', JSON.stringify(data))
      } catch (error) {
        clearAuth()
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

  return children
}
