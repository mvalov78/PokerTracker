'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalyticsPage() {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState('all')

  // Мок данные для аналитики
  const mockStats = {
    totalTournaments: 15,
    totalBuyins: 3250,
    totalWinnings: 4150,
    profit: 900,
    roi: 27.7,
    itm: 40, // In The Money %
    avgPosition: 45.2,
    bestFinish: 1,
    worstFinish: 156
  }

  const mockTournamentTypes = [
    { type: 'Freezeout', count: 8, profit: 650 },
    { type: 'Rebuy', count: 4, profit: 150 },
    { type: 'Bounty', count: 2, profit: 75 },
    { type: 'Satellite', count: 1, profit: 25 }
  ]

  const mockVenues = [
    { venue: 'PokerStars', count: 6, profit: 450 },
    { venue: 'PartyPoker', count: 4, profit: 200 },
    { venue: 'GGPoker', count: 3, profit: 150 },
    { venue: 'Live Casino', count: 2, profit: 100 }
  ]

  const mockRecentResults = [
    { date: '2024-01-15', tournament: 'Sunday Million', position: 45, profit: 1035 },
    { date: '2024-01-12', tournament: 'Daily Deep', position: 156, profit: -55 },
    { date: '2024-01-10', tournament: 'Bounty Builder', position: 23, profit: 125 },
    { date: '2024-01-08', tournament: 'Satellite', position: 3, profit: 215 }
  ]

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📊 Аналитика и статистика
          </h1>
          <p className="text-gray-600">
            Детальный анализ ваших покерных результатов
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Период анализа</h2>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все время</option>
              <option value="year">Текущий год</option>
              <option value="month">Текущий месяц</option>
              <option value="week">Текущая неделя</option>
            </select>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {mockStats.totalTournaments}
            </div>
            <div className="text-gray-600">Всего турниров</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              ${mockStats.totalBuyins}
            </div>
            <div className="text-gray-600">Общие бай-ины</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              ${mockStats.totalWinnings}
            </div>
            <div className="text-gray-600">Общие выигрыши</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className={`text-3xl font-bold mb-2 ${
              mockStats.profit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {mockStats.profit >= 0 ? '+' : ''}${mockStats.profit}
            </div>
            <div className="text-gray-600">Общая прибыль</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className={`text-3xl font-bold mb-2 ${
              mockStats.roi >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {mockStats.roi >= 0 ? '+' : ''}{mockStats.roi}%
            </div>
            <div className="text-gray-600">ROI</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {mockStats.itm}%
            </div>
            <div className="text-gray-600">ITM</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {mockStats.avgPosition}
            </div>
            <div className="text-gray-600">Среднее место</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              🥇 {mockStats.bestFinish}
            </div>
            <div className="text-gray-600">Лучший результат</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-gray-600 mb-2">
              {mockStats.worstFinish}
            </div>
            <div className="text-gray-600">Худший результат</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Tournament Types Analysis */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Анализ по типам турниров</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {mockTournamentTypes.map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="font-medium">{item.type}</span>
                      <span className="text-gray-500">({item.count} турниров)</span>
                    </div>
                    <div className={`font-semibold ${
                      item.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.profit >= 0 ? '+' : ''}${item.profit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Venues Analysis */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Анализ по площадкам</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {mockVenues.map((item) => (
                  <div key={item.venue} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="font-medium">{item.venue}</span>
                      <span className="text-gray-500">({item.count} турниров)</span>
                    </div>
                    <div className={`font-semibold ${
                      item.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.profit >= 0 ? '+' : ''}${item.profit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Results */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Последние результаты</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Турнир
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Место
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Прибыль
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockRecentResults.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(result.date).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.tournament}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      #{result.position}
                      {result.position === 1 && ' 🥇'}
                      {result.position === 2 && ' 🥈'}
                      {result.position === 3 && ' 🥉'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                      result.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.profit >= 0 ? '+' : ''}${result.profit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => router.push('/tournaments')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            🎰 Перейти к турнирам
          </button>
          <button
            onClick={() => router.push('/bankroll')}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            💰 Управление банкроллом
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Вернуться на главную
          </button>
        </div>
      </div>
    </div>
  )
}
