'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { mockUser } from '@/data/mockData'
import type { User } from '@/types'

// Типы для аутентификации
interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

type AuthAction = 
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_USER'; user: User | null }
  | { type: 'LOGOUT' }

// Reducer для управления состоянием аутентификации
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading }
    case 'SET_USER':
      return {
        ...state,
        user: action.user,
        isAuthenticated: !!action.user,
        isLoading: false
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false
      }
    default:
      return state
  }
}

// Интерфейс для контекста аутентификации
interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider компонент
interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
    isAuthenticated: false
  })

  // Проверка аутентификации при загрузке
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('poker-tracker-user')
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser)
          dispatch({ type: 'SET_USER', user })
        } catch (error) {
          console.error('Error parsing stored user:', error)
          localStorage.removeItem('poker-tracker-user')
          dispatch({ type: 'SET_USER', user: null })
        }
      } else {
        dispatch({ type: 'SET_USER', user: null })
      }
    }

    checkAuth()
  }, [])

  // Мок функция входа
  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', loading: true })
    
    // Симуляция API запроса
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Простая валидация для демо
    if (email === 'player@example.com' && password === 'password123') {
      const user = { ...mockUser, email }
      localStorage.setItem('poker-tracker-user', JSON.stringify(user))
      dispatch({ type: 'SET_USER', user })
      return { success: true }
    } else {
      dispatch({ type: 'SET_LOADING', loading: false })
      return { success: false, error: 'Неверный email или пароль' }
    }
  }

  // Мок функция регистрации
  const register = async (email: string, password: string, username: string) => {
    dispatch({ type: 'SET_LOADING', loading: true })
    
    // Симуляция API запроса
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Простая валидация для демо
    if (email && password && username) {
      const user = {
        ...mockUser,
        email,
        username,
        id: `user-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem('poker-tracker-user', JSON.stringify(user))
      dispatch({ type: 'SET_USER', user })
      return { success: true }
    } else {
      dispatch({ type: 'SET_LOADING', loading: false })
      return { success: false, error: 'Заполните все поля' }
    }
  }

  // Функция выхода
  const logout = () => {
    localStorage.removeItem('poker-tracker-user')
    dispatch({ type: 'LOGOUT' })
  }

  return (
    <AuthContext.Provider value={{
      user: state.user,
      isLoading: state.isLoading,
      isAuthenticated: state.isAuthenticated,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook для использования аутентификации
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Компонент для защищенных маршрутов
interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poker-green-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Требуется авторизация
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Пожалуйста, войдите в систему для доступа к этой странице
          </p>
          <a
            href="/auth"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-poker-green-600 hover:bg-poker-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-poker-green-500"
          >
            Войти в систему
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
