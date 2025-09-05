# Project Requirement Document: Трекер результатов турнирного оффлайн покера

## 1. Введение

### 1.1 Цель проекта
Разработка веб-приложения и Telegram-бота для комплексного отслеживания результатов оффлайн покерных турниров с возможностью автоматического распознавания данных с фотографий билетов и детальной аналитикой игровой статистики.

### 1.2 Целевая аудитория
- Профессиональные покеристы
- Любители покера, участвующие в турнирах
- Покерные клубы и организаторы турниров
- Игроки, желающие отслеживать ROI и банкролл-менеджмент

## 2. Стек технологий

### 2.1 Frontend
- **Next.js 14+** - React фреймворк с App Router для SSR и оптимизации
- **TypeScript** - типизированный JavaScript для надежности кода
- **Tailwind CSS** - utility-first CSS фреймворк для быстрой стилизации
- **React Hook Form** - для эффективной работы с формами
- **TanStack Query** - для управления состоянием сервера
- **Chart.js / Recharts** - для визуализации статистики
- **PWA (Progressive Web App)** - для мобильного опыта

### 2.2 Backend & Database
- **Supabase** - Пока используй мок данные, но впоследствии используем Backend-as-a-Service платформа включающая:
  - **PostgreSQL** - основная база данных
  - **Auth** - встроенная система аутентификации
  - **Storage** - для хранения изображений билетов
  - **Edge Functions** - для серверной логики
  - **Real-time** - для live обновлений
- **Prisma ORM** - для типизированной работы с Supabase
- **Supabase JS Client** - для взаимодействия с API

### 2.3 Telegram Bot
- **Telegraf.js** - библиотека для создания Telegram ботов
- **Vercel Edge Functions** - для обработки webhook'ов
- **Tesseract.js / Google Cloud Vision API** - для OCR распознавания текста
- **Sharp** - для обработки изображений

### 2.4 Развертывание и инфраструктура
- **Vercel** - платформа для развертывания Next.js приложений
- **Vercel Edge Functions** - для API endpoints и Telegram bot
- **Vercel KV** - для кэширования и сессий (Redis-совместимый)
- **Supabase Storage** - для хранения изображений
- **Vercel Analytics** - для мониторинга производительности

### 2.5 Дополнительные технологии
- **Zod** - для валидации данных
- **Jest + Testing Library** - для тестирования
- **ESLint + Prettier** - для качества кода

## 3. Ключевые функции

### 3.1 Основные возможности
- ✅ Регистрация и управление турнирами
- ✅ Автоматическое распознавание билетов через фото
- ✅ Отслеживание результатов и выигрышей
- ✅ Детальная аналитика и статистика
- ✅ Управление банкроллом
- ✅ ROI калькулятор
- ✅ Экспорт данных в различных форматах
- ✅ Интеграция с Telegram ботом
- ✅ Мультиязычность (RU/EN)

### 3.2 Продвинутые функции
- 📊 Графики доходности по времени
- 📱 Push-уведомления
- 🔄 Real-time синхронизация через Supabase
- 📸 Галерея фотографий турниров

## 4. Основные экраны веб-приложения

### 4.1 Экран входа и регистрации

#### Стиль и дизайн:
- **Цветовая схема**: Темная тема с акцентами зеленого (#10B981) и золотого (#F59E0B)
- **Типографика**: Inter или SF Pro Display для заголовков, системный шрифт для текста
- **Компоненты**: Rounded corners (8px), subtle shadows, gradient backgrounds
- **Анимации**: Smooth transitions (0.2s ease), hover effects, loading states

#### Техническое задание:
```tsx
// app/auth/page.tsx - Next.js App Router
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState } from 'react'

export default function AuthPage() {
  const supabase = createClientComponentClient()
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const handleAuth = async (formData: FormData) => {
    setIsLoading(true)
    
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
      })
    } else {
      const { error } = await supabase.auth.signUp({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        options: {
          data: {
            username: formData.get('username') as string,
          }
        }
      })
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex items-center justify-center min-h-screen p-4">
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
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="flex mb-6 bg-gray-800/50 rounded-lg p-1">
              <button
                className={`flex-1 py-2 px-4 rounded-md transition-all ${
                  isLogin ? 'bg-emerald-600 text-white' : 'text-gray-400'
                }`}
                onClick={() => setIsLogin(true)}
              >
                Вход
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md transition-all ${
                  !isLogin ? 'bg-emerald-600 text-white' : 'text-gray-400'
                }`}
                onClick={() => setIsLogin(false)}
              >
                Регистрация
              </button>
            </div>

            <form action={handleAuth} className="space-y-4">
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
              
              {!isLogin && (
                <div>
                  <input
                    type="text"
                    name="username"
                    placeholder="Никнейм"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              )}
              
              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Пароль"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </form>

            {/* Social Login */}
            <div className="mt-6 space-y-3">
              <button
                onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
                className="w-full py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
              >
                <span>🔍</span>
                <span>Войти через Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 4.2 Главная страница (Dashboard)

#### Техническое задание:
```tsx
// app/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/auth')
  }

  // Получаем данные на сервере для SSR
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select(`
      *,
      tournament_results (*)
    `)
    .eq('user_id', session.user.id)
    .order('date', { ascending: false })
    .limit(5)

  const { data: stats } = await supabase
    .rpc('get_user_stats', { user_id: session.user.id })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Добро пожаловать, {session.user.user_metadata.username}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Ваша покерная статистика
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                🔔
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <span className="text-blue-600 dark:text-blue-400 text-xl">🎰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Турниров</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.total_tournaments || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                <span className="text-emerald-600 dark:text-emerald-400 text-xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Выиграно</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${stats?.total_winnings || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <span className="text-purple-600 dark:text-purple-400 text-xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">ROI</p>
                <p className={`text-2xl font-bold ${
                  (stats?.roi || 0) > 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {stats?.roi || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <span className="text-amber-600 dark:text-amber-400 text-xl">🏆</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">ITM Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.itm_rate || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tournaments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Последние турниры
              </h2>
              <a
                href="/tournaments"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Показать все
              </a>
            </div>
          </div>
          <div className="p-6">
            <DashboardClient tournaments={tournaments} />
          </div>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6">
          <a
            href="/tournaments/add"
            className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <span className="text-2xl">+</span>
          </a>
        </div>
      </div>
    </div>
  )
}
```

### 4.3 Экран добавления турнира с OCR

#### Техническое задание:
```tsx
// app/tournaments/add/page.tsx
'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function AddTournamentPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [tournamentData, setTournamentData] = useState({})
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null)

  const handlePhotoUpload = async (file: File) => {
    if (!file) return

    setIsProcessing(true)
    
    try {
      // Загружаем фото в Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('tournament-tickets')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Получаем публичный URL
      const { data: { publicUrl } } = supabase.storage
        .from('tournament-tickets')
        .getPublicUrl(fileName)

      setUploadedPhoto(publicUrl)

      // Отправляем на OCR обработку через Edge Function
      const response = await fetch('/api/ocr/process-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: publicUrl }),
      })

      const result = await response.json()

      if (result.success) {
        setTournamentData(result.data)
        setCurrentStep(2)
      } else {
        // Показываем ошибку, но позволяем продолжить вручную
        alert('Не удалось распознать данные. Введите их вручную.')
        setCurrentStep(2)
      }
    } catch (error) {
      console.error('Error processing photo:', error)
      alert('Ошибка при обработке фото')
    } finally {
      setIsProcessing(false)
    }
  }

  const saveTournament = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert({
          ...tournamentData,
          ticket_image_url: uploadedPhoto,
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/tournaments/${data.id}`)
    } catch (error) {
      console.error('Error saving tournament:', error)
      alert('Ошибка при сохранении турнира')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-emerald-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Шаг {currentStep} из 3
          </div>
        </div>

        {/* Step 1: Photo Upload */}
        {currentStep === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Добавить фото билета</h2>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <div className="text-6xl mb-4">📸</div>
                <p className="text-lg font-medium mb-2">
                  Перетащите фото билета или нажмите для выбора
                </p>
                <p className="text-gray-500">JPG, PNG до 10MB</p>
              </label>
            </div>

            {isProcessing && (
              <div className="mt-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Обрабатываем фото...</p>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => setCurrentStep(2)}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Ввести данные вручную
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Tournament Details */}
        {currentStep === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Детали турнира</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Название турнира *
                </label>
                <input
                  type="text"
                  value={tournamentData.name || ''}
                  onChange={(e) => setTournamentData({...tournamentData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Sunday Million"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Дата и время *
                </label>
                <input
                  type="datetime-local"
                  value={tournamentData.date || ''}
                  onChange={(e) => setTournamentData({...tournamentData, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Бай-ин ($) *
                </label>
                <input
                  type="number"
                  value={tournamentData.buyin || ''}
                  onChange={(e) => setTournamentData({...tournamentData, buyin: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Место проведения
                </label>
                <input
                  type="text"
                  value={tournamentData.venue || ''}
                  onChange={(e) => setTournamentData({...tournamentData, venue: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="PokerStars Casino"
                />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Назад
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                disabled={!tournamentData.name || !tournamentData.date || !tournamentData.buyin}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Далее
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Подтверждение</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Турнир:</span>
                <span>{tournamentData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Дата:</span>
                <span>{new Date(tournamentData.date).toLocaleString('ru-RU')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Бай-ин:</span>
                <span>${tournamentData.buyin}</span>
              </div>
              {tournamentData.venue && (
                <div className="flex justify-between">
                  <span className="font-medium">Место:</span>
                  <span>{tournamentData.venue}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Редактировать
              </button>
              <button
                onClick={saveTournament}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Сохранить турнир
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

## 5. Supabase конфигурация

### 5.1 Схема базы данных в Supabase

#### SQL для создания таблиц:
```sql
-- Включение Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица пользователей (расширяет auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  avatar_url TEXT,
  telegram_id BIGINT UNIQUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица турниров
CREATE TABLE public.tournaments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  venue VARCHAR(255),
  buyin DECIMAL(10,2) NOT NULL,
  tournament_type VARCHAR(50) DEFAULT 'freezeout',
  structure VARCHAR(50),
  participants INTEGER,
  prize_pool DECIMAL(12,2),
  blind_levels TEXT,
  starting_stack INTEGER,
  ticket_image_url TEXT,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'registered',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица результатов турниров
CREATE TABLE public.tournament_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE UNIQUE NOT NULL,
  position INTEGER NOT NULL,
  payout DECIMAL(10,2) DEFAULT 0,
  roi DECIMAL(8,4) GENERATED ALWAYS AS (
    CASE 
      WHEN (SELECT buyin FROM tournaments WHERE id = tournament_id) > 0 
      THEN ((payout - (SELECT buyin FROM tournaments WHERE id = tournament_id)) / (SELECT buyin FROM tournaments WHERE id = tournament_id)) * 100
      ELSE 0 
    END
  ) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица фотографий турниров
CREATE TABLE public.tournament_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type VARCHAR(20) DEFAULT 'general', -- 'ticket', 'result', 'general'
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Настройки пользователей
CREATE TABLE public.user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  notifications JSONB DEFAULT '{"telegram": true, "email": false}',
  privacy JSONB DEFAULT '{"profile_public": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Политики для profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Политики для tournaments
CREATE POLICY "Users can view own tournaments" ON tournaments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tournaments" ON tournaments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tournaments" ON tournaments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tournaments" ON tournaments FOR DELETE USING (auth.uid() = user_id);

-- Политики для tournament_results
CREATE POLICY "Users can view own results" ON tournament_results FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM tournaments WHERE id = tournament_id)
);
CREATE POLICY "Users can insert own results" ON tournament_results FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM tournaments WHERE id = tournament_id)
);
CREATE POLICY "Users can update own results" ON tournament_results FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM tournaments WHERE id = tournament_id)
);
CREATE POLICY "Users can delete own results" ON tournament_results FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM tournaments WHERE id = tournament_id)
);

-- Функция для получения статистики пользователя
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_tournaments', COUNT(t.id),
    'total_buyin', COALESCE(SUM(t.buyin), 0),
    'total_winnings', COALESCE(SUM(tr.payout), 0),
    'profit', COALESCE(SUM(tr.payout - t.buyin), 0),
    'roi', CASE 
      WHEN SUM(t.buyin) > 0 THEN 
        ROUND(((SUM(tr.payout) - SUM(t.buyin)) / SUM(t.buyin) * 100)::numeric, 2)
      ELSE 0 
    END,
    'itm_rate', CASE 
      WHEN COUNT(t.id) > 0 THEN 
        ROUND((COUNT(tr.id) * 100.0 / COUNT(t.id))::numeric, 2)
      ELSE 0 
    END,
    'best_position', MIN(tr.position),
    'best_payout', MAX(tr.payout),
    'first_tournament', MIN(t.date),
    'last_tournament', MAX(t.date)
  ) INTO result
  FROM tournaments t
  LEFT JOIN tournament_results tr ON t.id = tr.tournament_id
  WHERE t.user_id = get_user_stats.user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Индексы для производительности
CREATE INDEX idx_tournaments_user_id ON tournaments(user_id);
CREATE INDEX idx_tournaments_date ON tournaments(date);
CREATE INDEX idx_tournament_results_tournament_id ON tournament_results(tournament_id);
CREATE INDEX idx_profiles_telegram_id ON profiles(telegram_id);

-- Триггеры для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5.2 Supabase Storage конфигурация

#### Создание buckets для файлов:
```sql
-- Bucket для билетов турниров
INSERT INTO storage.buckets (id, name, public) VALUES ('tournament-tickets', 'tournament-tickets', true);

-- Bucket для фотографий турниров
INSERT INTO storage.buckets (id, name, public) VALUES ('tournament-photos', 'tournament-photos', true);

-- Bucket для аватаров пользователей
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Политики для tournament-tickets bucket
CREATE POLICY "Users can upload own tournament tickets" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'tournament-tickets' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own tournament tickets" ON storage.objects FOR SELECT USING (
  bucket_id = 'tournament-tickets' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own tournament tickets" ON storage.objects FOR DELETE USING (
  bucket_id = 'tournament-tickets' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Политики для tournament-photos bucket
CREATE POLICY "Users can upload tournament photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'tournament-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view tournament photos" ON storage.objects FOR SELECT USING (
  bucket_id = 'tournament-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Политики для avatars bucket
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (
  bucket_id = 'avatars'
);
```

## 6. Vercel Edge Functions для Telegram Bot

### 6.1 Telegram Webhook Handler

#### Техническое задание:
```typescript
// api/telegram/webhook.ts - Vercel Edge Function
import { NextRequest } from 'next/server'
import { Telegraf } from 'telegraf'
import { createClient } from '@supabase/supabase-js'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Настройка команд бота
bot.command('start', async (ctx) => {
  const telegramId = ctx.from.id
  
  // Проверяем, привязан ли уже аккаунт
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()

  if (profile) {
    await ctx.reply(
      `🎰 Добро пожаловать в PokerTracker Pro!\n\n` +
      `Ваш аккаунт уже привязан.\n\n` +
      `Доступные команды:\n` +
      `/add_tournament - Добавить турнир\n` +
      `/my_tournaments - Мои турниры\n` +
      `/add_result - Добавить результат\n` +
      `/stats - Статистика`,
      {
        reply_markup: {
          keyboard: [
            [{ text: '🎰 Добавить турнир' }, { text: '🏆 Мои турниры' }],
            [{ text: '📊 Статистика' }, { text: '⚙️ Настройки' }]
          ],
          resize_keyboard: true
        }
      }
    )
  } else {
    const linkCode = generateLinkCode()
    
    // Сохраняем код привязки во временное хранилище (Vercel KV)
    await kv.set(`link_code:${linkCode}`, telegramId, { ex: 300 }) // 5 минут
    
    await ctx.reply(
      `🎰 Добро пожаловать в PokerTracker Pro!\n\n` +
      `Для начала работы привяжите ваш аккаунт:\n\n` +
      `1. Перейдите на сайт: ${process.env.NEXT_PUBLIC_APP_URL}/link-telegram\n` +
      `2. Введите код: \`${linkCode}\`\n\n` +
      `Код действителен 5 минут.`,
      { parse_mode: 'Markdown' }
    )
  }
})

bot.command('add_tournament', async (ctx) => {
  await ctx.reply(
    '🎰 Добавление нового турнира\n\n' +
    'Отправьте фото билета турнира для автоматического распознавания ' +
    'или нажмите "Ввести вручную".',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✍️ Ввести вручную', callback_data: 'manual_input' }],
          [{ text: '❌ Отмена', callback_data: 'cancel' }]
        ]
      }
    }
  )
  
  // Устанавливаем состояние ожидания фото
  await kv.set(`user_state:${ctx.from.id}`, 'waiting_photo', { ex: 300 })
})

bot.on('photo', async (ctx) => {
  const userState = await kv.get(`user_state:${ctx.from.id}`)
  
  if (userState !== 'waiting_photo') {
    return
  }
  
  await ctx.reply('📸 Обрабатываю фото билета...')
  
  try {
    // Получаем файл из Telegram
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id
    const file = await ctx.telegram.getFile(fileId)
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`
    
    // Загружаем изображение
    const response = await fetch(fileUrl)
    const imageBuffer = await response.arrayBuffer()
    
    // Загружаем в Supabase Storage
    const fileName = `${ctx.from.id}/${Date.now()}.jpg`
    const { data: uploadData, error } = await supabase.storage
      .from('tournament-tickets')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg'
      })
    
    if (error) throw error
    
    // Получаем публичный URL
    const { data: { publicUrl } } = supabase.storage
      .from('tournament-tickets')
      .getPublicUrl(fileName)
    
    // Обрабатываем OCR
    const ocrResult = await processOCR(publicUrl)
    
    if (ocrResult.success) {
      // Сохраняем распознанные данные
      await kv.set(`tournament_data:${ctx.from.id}`, JSON.stringify(ocrResult.data), { ex: 600 })
      
      await ctx.reply(
        '✅ *Данные распознаны успешно!*\n\n' +
        `🏆 *Турнир:* ${ocrResult.data.name}\n` +
        `📅 *Дата:* ${formatDate(ocrResult.data.date)}\n` +
        `💰 *Бай-ин:* $${ocrResult.data.buyin}\n` +
        `📍 *Место:* ${ocrResult.data.venue || 'Не указано'}\n\n` +
        'Данные корректны?',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Да, сохранить', callback_data: 'confirm_tournament' },
                { text: '✏️ Редактировать', callback_data: 'edit_tournament' }
              ],
              [{ text: '❌ Отмена', callback_data: 'cancel' }]
            ]
          }
        }
      )
    } else {
      await ctx.reply(
        '❌ Не удалось распознать данные с фото.\n' +
        'Попробуйте сделать фото получше или введите данные вручную.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '✍️ Ввести вручную', callback_data: 'manual_input' }],
              [{ text: '🔄 Попробовать еще раз', callback_data: 'retry_photo' }]
            ]
          }
        }
      )
    }
  } catch (error) {
    console.error('Error processing photo:', error)
    await ctx.reply('❌ Произошла ошибка при обработке фото. Попробуйте еще раз.')
  } finally {
    await kv.del(`user_state:${ctx.from.id}`)
  }
})

bot.action('confirm_tournament', async (ctx) => {
  try {
    const tournamentDataStr = await kv.get(`tournament_data:${ctx.from.id}`)
    if (!tournamentDataStr) {
      await ctx.reply('❌ Данные турнира не найдены. Попробуйте еще раз.')
      return
    }
    
    const tournamentData = JSON.parse(tournamentDataStr as string)
    
    // Получаем user_id по telegram_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_id', ctx.from.id)
      .single()
    
    if (!profile) {
      await ctx.reply('❌ Аккаунт не привязан. Используйте команду /start')
      return
    }
    
    // Сохраняем турнир в базу
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .insert({
        user_id: profile.id,
        name: tournamentData.name,
        date: tournamentData.date,
        buyin: tournamentData.buyin,
        venue: tournamentData.venue,
        ticket_image_url: tournamentData.imageUrl
      })
      .select()
      .single()
    
    if (error) throw error
    
    await ctx.reply(
      '🎉 *Турнир успешно добавлен!*\n\n' +
      `Название: ${tournament.name}\n\n` +
      'Хотите добавить результат сейчас?',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🏆 Добавить результат', callback_data: `add_result_${tournament.id}` }],
            [{ text: '📊 Мои турниры', callback_data: 'my_tournaments' }]
          ]
        }
      }
    )
    
    // Очищаем временные данные
    await kv.del(`tournament_data:${ctx.from.id}`)
    
  } catch (error) {
    console.error('Error saving tournament:', error)
    await ctx.reply('❌ Ошибка при сохранении турнира. Попробуйте еще раз.')
  }
})

// Обработка webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    await bot.handleUpdate(body)
    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Error', { status: 500 })
  }
}

// Вспомогательные функции
function generateLinkCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

async function processOCR(imageUrl: string) {
  // Здесь вызываем OCR сервис
  try {
    const response = await fetch('/api/ocr/process-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl })
    })
    
    return await response.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
```

### 6.2 OCR Processing Edge Function

#### Техническое задание:
```typescript
// api/ocr/process-ticket.ts
import { NextRequest } from 'next/server'
import Tesseract from 'tesseract.js'

export const runtime = 'edge'

interface OCRResult {
  success: boolean
  data?: any
  error?: string
  confidence?: number
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()
    
    if (!imageUrl) {
      return Response.json({ success: false, error: 'Image URL required' }, { status: 400 })
    }
    
    // Загружаем изображение
    const imageResponse = await fetch(imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    
    // OCR обработка с Tesseract.js
    const { data: { text, confidence } } = await Tesseract.recognize(
      Buffer.from(imageBuffer),
      'eng+rus',
      {
        logger: m => console.log(m)
      }
    )
    
    if (confidence < 70) {
      return Response.json({
        success: false,
        error: 'Low confidence OCR result',
        confidence
      })
    }
    
    // Извлекаем данные турнира из текста
    const extractedData = extractTournamentData(text)
    
    if (!extractedData.name && !extractedData.buyin) {
      return Response.json({
        success: false,
        error: 'Could not extract tournament data',
        confidence,
        rawText: text
      })
    }
    
    return Response.json({
      success: true,
      data: {
        ...extractedData,
        imageUrl
      },
      confidence
    })
    
  } catch (error) {
    console.error('OCR processing error:', error)
    return Response.json({
      success: false,
      error: 'OCR processing failed'
    }, { status: 500 })
  }
}

function extractTournamentData(ocrText: string) {
  const patterns = {
    // Название турнира
    name: [
      /tournament[:\s]+([^\n\r]+)/i,
      /event[:\s]+([^\n\r]+)/i,
      /турнир[:\s]+([^\n\r]+)/i,
      /название[:\s]+([^\n\r]+)/i
    ],
    
    // Дата и время
    date: [
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
      /(\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
      /date[:\s]+([^\n\r]+)/i,
      /дата[:\s]+([^\n\r]+)/i
    ],
    
    // Бай-ин
    buyin: [
      /buy[\-\s]*in[:\s]*\$?(\d+(?:[,\.]\d+)?)/i,
      /entry[:\s]*\$?(\d+(?:[,\.]\d+)?)/i,
      /взнос[:\s]*\$?(\d+(?:[,\.]\d+)?)/i,
      /\$(\d+(?:[,\.]\d+)?)/
    ],
    
    // Место проведения
    venue: [
      /venue[:\s]+([^\n\r]+)/i,
      /location[:\s]+([^\n\r]+)/i,
      /casino[:\s]+([^\n\r]+)/i,
      /место[:\s]+([^\n\r]+)/i
    ]
  }
  
  const extractedData: any = {}
  
  // Извлечение данных по паттернам
  for (const [field, fieldPatterns] of Object.entries(patterns)) {
    for (const pattern of fieldPatterns) {
      const match = ocrText.match(pattern)
      if (match && match[1]) {
        extractedData[field] = match[1].trim()
        break
      }
    }
  }
  
  // Постобработка и валидация
  if (extractedData.buyin) {
    extractedData.buyin = parseFloat(extractedData.buyin.replace(/[,\s]/g, ''))
  }
  
  if (extractedData.date) {
    extractedData.date = parseDate(extractedData.date)
  }
  
  return extractedData
}

function parseDate(dateString: string): string {
  try {
    // Пытаемся распарсить различные форматы дат
    const formats = [
      /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,
      /(\d{2,4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/
    ]
    
    for (const format of formats) {
      const match = dateString.match(format)
      if (match) {
        const [, part1, part2, part3] = match
        
        // Определяем формат и создаем дату
        let date: Date
        if (part3.length === 4) {
          // Год в конце: DD/MM/YYYY или MM/DD/YYYY
          date = new Date(parseInt(part3), parseInt(part2) - 1, parseInt(part1))
        } else {
          // Год в начале: YYYY/MM/DD
          date = new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3))
        }
        
        if (!isNaN(date.getTime())) {
          return date.toISOString()
        }
      }
    }
    
    // Fallback: пытаемся использовать стандартный парсер
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      return date.toISOString()
    }
    
    return new Date().toISOString() // Возвращаем текущую дату как fallback
  } catch (error) {
    return new Date().toISOString()
  }
}
```

## 7. Prisma конфигурация для Supabase

### 7.1 Schema.prisma для Supabase

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Profile {
  id          String   @id @db.Uuid
  username    String?  @unique
  avatarUrl   String?  @map("avatar_url")
  telegramId  BigInt?  @unique @map("telegram_id")
  preferences Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  tournaments Tournament[]
  settings    UserSettings?

  @@map("profiles")
}

model Tournament {
  id               String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId           String    @map("user_id") @db.Uuid
  name             String
  date             DateTime  @db.Timestamptz(6)
  venue            String?
  buyin            Decimal   @db.Decimal(10, 2)
  tournamentType   String    @default("freezeout") @map("tournament_type")
  structure        String?
  participants     Int?
  prizePool        Decimal?  @map("prize_pool") @db.Decimal(12, 2)
  blindLevels      String?   @map("blind_levels")
  startingStack    Int?      @map("starting_stack")
  ticketImageUrl   String?   @map("ticket_image_url")
  notes            String?
  status           String    @default("registered")
  createdAt        DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  profile Profile             @relation(fields: [userId], references: [id], onDelete: Cascade)
  result  TournamentResult?
  photos  TournamentPhoto[]

  @@map("tournaments")
}

model TournamentResult {
  id           String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  tournamentId String   @unique @map("tournament_id") @db.Uuid
  position     Int
  payout       Decimal  @default(0) @db.Decimal(10, 2)
  notes        String?
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  tournament Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)

  @@map("tournament_results")
}

model TournamentPhoto {
  id           String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  tournamentId String   @map("tournament_id") @db.Uuid
  photoUrl     String   @map("photo_url")
  photoType    String   @default("general") @map("photo_type")
  caption      String?
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  tournament Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)

  @@map("tournament_photos")
}

model UserSettings {
  id            String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId        String   @unique @map("user_id") @db.Uuid
  currency      String   @default("USD")
  timezone      String   @default("UTC")
  notifications Json     @default("{\"telegram\": true, \"email\": false}")
  privacy       Json     @default("{\"profile_public\": false}")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  profile Profile @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}
```

### 7.2 Supabase Client конфигурация

#### Техническое задание:
```typescript
// lib/supabase.ts
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Типы для базы данных
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          telegram_id: number | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          telegram_id?: number | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          telegram_id?: number | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      tournaments: {
        Row: {
          id: string
          user_id: string
          name: string
          date: string
          venue: string | null
          buyin: number
          tournament_type: string
          structure: string | null
          participants: number | null
          prize_pool: number | null
          blind_levels: string | null
          starting_stack: number | null
          ticket_image_url: string | null
          notes: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          date: string
          venue?: string | null
          buyin: number
          tournament_type?: string
          structure?: string | null
          participants?: number | null
          prize_pool?: number | null
          blind_levels?: string | null
          starting_stack?: number | null
          ticket_image_url?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          date?: string
          venue?: string | null
          buyin?: number
          tournament_type?: string
          structure?: string | null
          participants?: number | null
          prize_pool?: number | null
          blind_levels?: string | null
          starting_stack?: number | null
          ticket_image_url?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      // ... другие таблицы
    }
    Functions: {
      get_user_stats: {
        Args: { user_id: string }
        Returns: Json
      }
    }
  }
}

// Client-side клиент
export const createClient = () => createClientComponentClient<Database>()

// Server-side клиент
export const createServerClient = () => createServerComponentClient<Database>({ cookies })

// Service role клиент (для Edge Functions)
export const createServiceClient = () => createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Middleware для аутентификации
export async function getUser() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Утилиты для работы с Storage
export const uploadImage = async (
  bucket: string,
  path: string,
  file: File | Buffer,
  options?: { contentType?: string }
) => {
  const supabase = createClient()
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      ...options
    })
  
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return { data, publicUrl }
}

// Утилиты для работы с профилем
export const getProfile = async (userId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export const updateProfile = async (userId: string, updates: Database['public']['Tables']['profiles']['Update']) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Утилиты для работы с турнирами
export const getUserTournaments = async (userId: string, limit = 20, offset = 0) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      *,
      tournament_results (*)
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) throw error
  return data
}

export const createTournament = async (tournament: Database['public']['Tables']['tournaments']['Insert']) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tournaments')
    .insert(tournament)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Утилиты для статистики
export const getUserStats = async (userId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('get_user_stats', { user_id: userId })
  
  if (error) throw error
  return data
}
```

## 8. Vercel конфигурация

### 8.1 Vercel.json конфигурация

```json
{
  "functions": {
    "api/telegram/webhook.ts": {
      "runtime": "edge"
    },
    "api/ocr/process-ticket.ts": {
      "runtime": "edge"
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-key",
    "TELEGRAM_BOT_TOKEN": "@telegram-bot-token",
    "DATABASE_URL": "@database-url",
    "DIRECT_URL": "@direct-url"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
    }
  }
}
```

### 8.2 Next.js конфигурация

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      'your-supabase-project.supabase.co',
      'api.telegram.org'
    ],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig
```

### 8.3 Environment Variables

```bash
# .env.local для разработки
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Vercel KV (для кэширования)
KV_URL=your-kv-url
KV_REST_API_URL=your-kv-rest-url
KV_REST_API_TOKEN=your-kv-token
KV_REST_API_READ_ONLY_TOKEN=your-kv-readonly-token
```

## 9. Deployment Pipeline

### 9.1 GitHub Actions для CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      
      - name: Run Prisma generate
        run: npx prisma generate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-args: '--prod'
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
      
      - name: Set Telegram Webhook
        if: github.ref == 'refs/heads/main'
        run: |
          curl -X POST "https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/setWebhook" \
            -H "Content-Type: application/json" \
            -d '{"url": "https://your-app.vercel.app/api/telegram/webhook"}'
```

## 10. Мониторинг и аналитика

### 10.1 Vercel Analytics интеграция

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### 10.2 Error Tracking

```typescript
// lib/error-tracking.ts
export function trackError(error: Error, context?: Record<string, any>) {
  // Интеграция с Sentry или другим сервисом
  console.error('Application Error:', error, context)
  
  // Отправка в Supabase для логирования
  if (typeof window !== 'undefined') {
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }).catch(console.error)
  }
}
```

## 11. Заключение

Адаптированный документ теперь полностью интегрирован с экосистемой Supabase и Vercel, что обеспечивает:

### Преимущества использования Supabase:
- 🗄️ **Managed PostgreSQL** - надежная база данных без необходимости администрирования
- 🔐 **Built-in Auth** - готовая система аутентификации с социальными провайдерами
- 📁 **Storage** - встроенное хранилище файлов с CDN
- ⚡ **Real-time** - живые обновления данных
- 🛡️ **Row Level Security** - безопасность на уровне строк
- 🔧 **Edge Functions** - серверная логика близко к пользователям

### Преимущества использования Vercel:
- 🚀 **Zero Config Deployment** - автоматическое развертывание из Git
- 🌍 **Global CDN** - быстрая доставка контента по всему миру
- ⚡ **Edge Functions** - выполнение кода на границе сети
- 📊 **Built-in Analytics** - встроенная аналитика производительности
- 🔄 **Preview Deployments** - автоматические превью для PR
- 💾 **Vercel KV** - Redis-совместимое хранилище для кэширования

### Технический стек:
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Deployment**: Vercel с Edge Functions
- **Bot**: Telegraf.js с Vercel Edge Functions
- **OCR**: Tesseract.js + Google Cloud Vision API
- **Caching**: Vercel KV (Redis)
- **Monitoring**: Vercel Analytics + Speed Insights

Проект готов к разработке и может быть легко масштабирован благодаря serverless архитектуре Vercel и управляемым сервисам Supabase.


