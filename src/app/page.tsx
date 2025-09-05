'use client'

import { useRouter } from 'next/navigation'
import { useAuth, ProtectedRoute } from '@/hooks/useAuth'
import { useTournaments } from '@/hooks/useTournaments'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import ProfitChart from '@/components/charts/ProfitChart'
import ROIChart from '@/components/charts/ROIChart'
import PositionChart from '@/components/charts/PositionChart'
import { 
  mockUserStats, 
  mockProfitChartData,
  mockROIChartData,
  mockPositionData,
  mockVenueStats
} from '@/data/mockData'
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils'

function DashboardContent() {
  const { user } = useAuth()
  const router = useRouter()
  const { tournaments } = useTournaments(user?.id)
  const stats = mockUserStats
  const recentTournaments = tournaments
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Добро пожаловать, {user?.username || 'PokerKing'}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Ваша покерная статистика и последние результаты
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => router.push('/tournaments/add')}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              >
                ➕ Добавить турнир
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card hover className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                  <span className="text-white text-2xl">🎰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Турниров</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {stats.totalTournaments}
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                    +2 в этом месяце
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-emerald-500 rounded-xl shadow-lg">
                  <span className="text-white text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Выиграно</p>
                  <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                    {formatCurrency(stats.totalWinnings)}
                  </p>
                  <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">
                    Прибыль: {formatCurrency(stats.profit)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover className={`bg-gradient-to-br ${
            stats.roi > 0 
              ? 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'
              : 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-xl shadow-lg ${
                  stats.roi > 0 ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  <span className="text-white text-2xl">📈</span>
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${
                    stats.roi > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>ROI</p>
                  <p className={`text-3xl font-bold ${
                    stats.roi > 0 ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
                  }`}>
                    {formatPercentage(stats.roi)}
                  </p>
                  <p className={`text-xs mt-1 ${
                    stats.roi > 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                  }`}>
                    {stats.roi > 0 ? 'Отличный результат!' : 'Работаем над улучшением'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-amber-500 rounded-xl shadow-lg">
                  <span className="text-white text-2xl">🏆</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">ITM Rate</p>
                  <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                    {formatPercentage(stats.itmRate)}
                  </p>
                  <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">
                    Лучшее место: {stats.bestPosition}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Profit Chart */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center">
                <span className="mr-2">📊</span>
                Динамика прибыли
              </CardTitle>
              <CardDescription>
                Ваша прибыль и накопительный результат по турнирам
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ProfitChart data={mockProfitChartData} className="h-80" />
            </CardContent>
          </Card>

          {/* ROI by Tournament Type */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center">
                <span className="mr-2">🎯</span>
                ROI по типам турниров
              </CardTitle>
              <CardDescription>
                Эффективность игры в разных форматах
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ROIChart data={mockROIChartData} className="h-80" />
            </CardContent>
          </Card>
        </div>

        {/* Position Distribution and Venue Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Position Distribution */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center">
                <span className="mr-2">🎲</span>
                Распределение мест
              </CardTitle>
              <CardDescription>
                Как часто вы финишируете в разных позициях
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <PositionChart data={mockPositionData} className="h-64" />
            </CardContent>
          </Card>

          {/* Venue Performance */}
          <Card className="lg:col-span-2 bg-white dark:bg-gray-800">
            <CardHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center">
                <span className="mr-2">🏨</span>
                Результаты по площадкам
              </CardTitle>
              <CardDescription>
                Ваша эффективность в разных казино
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {mockVenueStats.map((venue, index) => (
                  <div key={venue.venue} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        venue.roi > 0 ? 'bg-emerald-500' : venue.roi < 0 ? 'bg-red-500' : 'bg-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {venue.venue}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {venue.tournaments} турниров
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        venue.profit > 0 ? 'text-emerald-600' : venue.profit < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {formatCurrency(venue.profit)}
                      </p>
                      <p className={`text-sm ${
                        venue.roi > 0 ? 'text-emerald-500' : venue.roi < 0 ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        ROI: {formatPercentage(venue.roi)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tournaments */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <span className="mr-2">🕒</span>
                Последние турниры
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-emerald-600 hover:text-emerald-700"
                onClick={() => router.push('/tournaments')}
              >
                Показать все →
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentTournaments.map((tournament) => (
                <div key={tournament.id} className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                          tournament.result?.position === 1 ? 'bg-yellow-500' :
                          tournament.result?.position === 2 ? 'bg-gray-400' :
                          tournament.result?.position === 3 ? 'bg-orange-500' :
                          tournament.result && tournament.result.payout > 0 ? 'bg-emerald-500' :
                          tournament.result ? 'bg-red-500' : 'bg-blue-500'
                        }`}>
                          {tournament.result?.position === 1 ? '🥇' : 
                           tournament.result?.position === 2 ? '🥈' :
                           tournament.result?.position === 3 ? '🥉' : 
                           tournament.result && tournament.result.payout > 0 ? '💰' :
                           tournament.result ? '❌' : '⏳'}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                            {tournament.name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center">
                              📅 {formatDate(tournament.date)}
                            </span>
                            <span className="flex items-center">
                              🏨 {tournament.venue}
                            </span>
                            <span className="flex items-center">
                              💵 {formatCurrency(tournament.buyin)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {tournament.result ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {tournament.result.position} место
                            </span>
                          </div>
                          <div className={`text-xl font-bold ${
                            tournament.result.payout > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'
                          }`}>
                            {tournament.result.payout > 0 ? formatCurrency(tournament.result.payout) : 'Без призов'}
                          </div>
                          <div className={`text-sm font-medium ${
                            tournament.result.roi > 0 ? 'text-emerald-500' : 'text-red-500'
                          }`}>
                            ROI: {formatPercentage(tournament.result.roi)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-blue-600 dark:text-blue-400 font-semibold">
                            Предстоящий
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(tournament.date, { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress bar for positive results */}
                  {tournament.result && tournament.result.payout > 0 && (
                    <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-b-xl"
                         style={{ width: `${Math.min(tournament.result.roi + 100, 100)}%` }}>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            onClick={() => router.push('/tournaments/add')}
          >
            <span className="mr-2 text-xl">🎰</span>
            Добавить турнир
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            onClick={() => router.push('/tournaments')}
          >
            <span className="mr-2 text-xl">📊</span>
            Посмотреть турниры
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <span className="mr-2 text-xl">💰</span>
            Управление банкроллом
          </Button>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative group">
            <Button
              size="lg"
              className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-2xl hover:shadow-emerald-500/25 transform hover:scale-110 transition-all duration-200"
              onClick={() => router.push('/tournaments/add')}
            >
              <span className="text-2xl">+</span>
            </Button>
            
            {/* Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-gray-900 text-white text-sm py-2 px-3 rounded-lg whitespace-nowrap">
                Быстро добавить турнир
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
              </div>
            </div>
            
            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-20 animate-ping"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}