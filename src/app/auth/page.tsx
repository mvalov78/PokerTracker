'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const { signIn, signUp, isLoading, isAuthenticated } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()

  // Перенаправление если пользователь уже авторизован
  useEffect(() => {
    if (isAuthenticated) {
      console.log('✅ User authenticated, redirecting to /')
      router.push('/')
    }
  }, [isAuthenticated, router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Очистка ошибки при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email обязателен'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Неверный формат email'
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов'
    }

    if (!isLogin && !formData.username) {
      newErrors.username = 'Имя пользователя обязательно'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🎯 Form submitted, email:', formData.email)
    
    console.log("🎯 Form submitted, email:", formData.email)
    
    if (!validateForm()) {
      console.log("⚠️ Form validation failed")
      return
    }

    try {
      console.log('🚀 Starting authentication process...')
      let result
      if (isLogin) {
        console.log('📧 Calling signIn')
        result = await signIn(formData.email, formData.password)
      } else {
        console.log('📝 Calling signUp')
        result = await signUp(formData.email, formData.password, formData.username)
      }

      console.log('📊 Auth result:', result)
      if (result.success) {
        addToast({
          type: 'success',
          message: isLogin ? 'Добро пожаловать!' : 'Аккаунт успешно создан!'
        })
        console.log('🎉 Success, preparing to redirect...')
        // Небольшая задержка для обновления состояния
        setTimeout(() => {
          router.push('/')
        }, 500)
      } else {
        console.error('❌ Auth failed:', result.error)
        addToast({
          type: 'error',
          message: result.error || 'Произошла ошибка'
        })
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      addToast({
        type: 'error',
        message: 'Произошла непредвиденная ошибка'
      })
    }
  }

  const switchMode = () => {
    setIsLogin(!isLogin)
    setFormData({ email: '', password: '', username: '' })
    setErrors({})
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poker-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4">
            <span className="text-2xl">♠️</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">PokerTracker Pro</h1>
          <p className="text-gray-400">Отслеживайте свой покерный путь</p>
        </div>

        {/* Auth Form */}
        <Card className="glass-card">
          <CardHeader className="p-6">
            <div className="flex mb-6 bg-gray-800/50 rounded-lg p-1">
              <button
                className={`flex-1 py-2 px-4 rounded-md transition-all ${
                  isLogin ? 'bg-emerald-600 text-white' : 'text-gray-400'
                }`}
                onClick={() => setIsLogin(true)}
                type="button"
              >
                Вход
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md transition-all ${
                  !isLogin ? 'bg-emerald-600 text-white' : 'text-gray-400'
                }`}
                onClick={() => setIsLogin(false)}
                type="button"
              >
                Регистрация
              </button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                label="Email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
                required
                className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
              />
              
              {!isLogin && (
                <Input
                  type="text"
                  label="Никнейм"
                  placeholder="Ваш никнейм"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  error={errors.username}
                  required
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
                />
              )}
              
              <Input
                type="password"
                label="Пароль"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={errors.password}
                required
                className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
              />

              <Button
                type="submit"
                loading={isLoading}
                className="w-full"
                size="lg"
              >
                {isLogin ? 'Войти' : 'Зарегистрироваться'}
              </Button>
            </form>

            {/* Demo credentials hint */}
            {isLogin && (
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                <p className="text-sm text-blue-200 mb-2">
                  <strong>Демо данные для входа:</strong>
                </p>
                <p className="text-xs text-blue-300">
                  Email: player@example.com<br />
                  Пароль: password123
                </p>
              </div>
            )}

            {/* Switch mode */}
            <div className="mt-6 text-center">
              <button
                onClick={switchMode}
                type="button"
                className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
              >
                {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
              </button>
            </div>

            {/* Social Login */}
            <div className="mt-6 space-y-3">
              <Button
                variant="secondary"
                className="w-full bg-white text-gray-900 hover:bg-gray-100"
                onClick={() => addToast({ type: 'info', message: 'Google OAuth скоро будет доступен' })}
              >
                <span className="mr-2">🔍</span>
                Войти через Google
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
