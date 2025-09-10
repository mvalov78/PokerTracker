'use client'

import { useAuth } from '@/hooks/useAuth'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import BotModeManager from '@/components/admin/BotModeManager'
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Shield,
  Activity,
  Database,
  Bot
} from 'lucide-react'

// Мок данные для демонстрации (в продакшене будем получать из API)
const mockStats = {
  totalUsers: 156,
  totalTournaments: 1243,
  activeToday: 23,
  totalRevenue: 45678,
  avgROI: 15.6,
  topPlayer: 'PokerPro2024'
}

export default function AdminDashboard() {
  const { user, profile } = useAuth()

  const statsCards = [
    {
      title: 'Всего пользователей',
      value: mockStats.totalUsers.toLocaleString(),
      icon: Users,
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Всего турниров',
      value: mockStats.totalTournaments.toLocaleString(),
      icon: Calendar,
      change: '+8%',
      changeType: 'positive' as const
    },
    {
      title: 'Активны сегодня',
      value: mockStats.activeToday.toString(),
      icon: Activity,
      change: '+3%',
      changeType: 'positive' as const
    },
    {
      title: 'Общий объем',
      value: `$${mockStats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      change: '+15%',
      changeType: 'positive' as const
    }
  ]

  return (
    <div className="space-y-6">
      {/* Приветствие */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8" />
          <div>
            <h2 className="text-2xl font-bold">
              Добро пожаловать, {profile?.username || user?.email}!
            </h2>
            <p className="text-emerald-100">
              Вы вошли в систему как администратор
            </p>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className="bg-gray-800/50 border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-300 text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">
                  {card.value}
                </div>
                <div className={`text-sm ${
                  card.changeType === 'positive' 
                    ? 'text-emerald-400' 
                    : 'text-red-400'
                }`}>
                  {card.change} от прошлого месяца
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Быстрые действия */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Системная информация */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Системная информация</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Версия приложения:</span>
                <span className="text-white">1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">База данных:</span>
                <span className="text-emerald-400">Подключена</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Последнее обновление:</span>
                <span className="text-white">2 часа назад</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Статус системы:</span>
                <span className="text-emerald-400">Все сервисы работают</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Последние действия */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Последние действия</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-gray-300">Новый пользователь зарегистрировался</span>
                <span className="text-gray-500">5 мин. назад</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-300">Турнир завершен</span>
                <span className="text-gray-500">15 мин. назад</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-gray-300">Резервное копирование выполнено</span>
                <span className="text-gray-500">1 час назад</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-gray-300">Обновление конфигурации</span>
                <span className="text-gray-500">3 часа назад</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Управление Telegram ботом */}
      <BotModeManager />

      {/* Быстрые ссылки */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Быстрые действия</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors">
              <Users className="h-6 w-6 text-emerald-400 mb-2" />
              <div className="text-white font-medium">Управление пользователями</div>
              <div className="text-gray-400 text-sm">Просмотр и редактирование</div>
            </button>
            
            <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors">
              <Calendar className="h-6 w-6 text-blue-400 mb-2" />
              <div className="text-white font-medium">Мониторинг турниров</div>
              <div className="text-gray-400 text-sm">Статистика и отчеты</div>
            </button>
            
            <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors">
              <TrendingUp className="h-6 w-6 text-yellow-400 mb-2" />
              <div className="text-white font-medium">Аналитика</div>
              <div className="text-gray-400 text-sm">Детальные отчеты</div>
            </button>
            
            <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors">
              <Bot className="h-6 w-6 text-cyan-400 mb-2" />
              <div className="text-white font-medium">Управление ботом</div>
              <div className="text-gray-400 text-sm">Режимы и настройки</div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
