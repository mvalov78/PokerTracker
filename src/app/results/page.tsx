'use client'

import { useState, useMemo } from 'react'
import { useAuth, ProtectedRoute } from '@/hooks/useAuth'
import { useTournaments } from '@/hooks/useTournaments'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Input, { Select } from '@/components/ui/Input'
import { Breadcrumbs } from '@/components/ui/Navigation'
import { Tournament } from '@/types'
import ResultHistory from '@/components/results/ResultHistory'

function ResultsContent() {
  const { user } = useAuth()
  const { tournaments } = useTournaments(user?.id)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [dateRange, setDateRange] = useState<string>('all')

  // Фильтруем турниры с результатами
  const tournamentsWithResults = useMemo(() => {
    return tournaments.filter(tournament => 
      tournament.result
    )
  }, [tournaments])

  // Применяем фильтры и сортировку
  const filteredResults = useMemo(() => {
    let filtered = [...tournamentsWithResults]

    // Поиск по названию
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(tournament =>
        tournament.name.toLowerCase().includes(query) ||
        tournament.venue.toLowerCase().includes(query) ||
        tournament.result?.notes?.toLowerCase().includes(query)
      )
    }

    // Фильтр по типу турнира
    if (filterType !== 'all') {
      filtered = filtered.filter(tournament => tournament.type === filterType)
    }

    // Фильтр по дате
    if (dateRange !== 'all') {
      const now = new Date()
      const startDate = new Date()
      
      switch (dateRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      filtered = filtered.filter(tournament => 
        new Date(tournament.date) >= startDate
      )
    }

    // Сортировка
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date)
          bValue = new Date(b.date)
          break
        case 'profit':
          aValue = a.result?.profit || 0
          bValue = b.result?.profit || 0
          break
        case 'roi':
          aValue = a.result?.roi || 0
          bValue = b.result?.roi || 0
          break
        case 'position':
          aValue = a.result?.position || 999
          bValue = b.result?.position || 999
          break
        case 'buyin':
          aValue = a.buyIn
          bValue = b.buyIn
          break
        default:
          aValue = a.name
          bValue = b.name
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [tournamentsWithResults, searchQuery, filterType, dateRange, sortBy, sortOrder])

  // Статистика по результатам
  const resultStats = useMemo(() => {
    const results = filteredResults
    const totalTournaments = results.length
    const totalInvestment = results.reduce((sum, t) => sum + t.buyIn, 0)
    const totalWinnings = results.reduce((sum, t) => sum + (t.result?.payout || 0), 0)
    const totalProfit = totalWinnings - totalInvestment
    const avgROI = totalInvestment > 0 ? ((totalProfit / totalInvestment) * 100) : 0
    
    const cashCount = results.filter(t => (t.result?.position || 999) <= (t.maxPlayers * 0.15)).length
    const finalTableCount = results.filter(t => t.result?.finalTableReached).length
    const winsCount = results.filter(t => t.result?.position === 1).length
    
    const avgPosition = results.length > 0 
      ? results.reduce((sum, t) => sum + (t.result?.position || 0), 0) / results.length 
      : 0

    return {
      totalTournaments,
      totalInvestment,
      totalWinnings,
      totalProfit,
      avgROI,
      cashCount,
      finalTableCount,
      winsCount,
      avgPosition,
      cashRate: totalTournaments > 0 ? (cashCount / totalTournaments) * 100 : 0
    }
  }, [filteredResults])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getPositionColor = (position: number, maxPlayers: number) => {
    if (position === 1) return 'text-yellow-600 font-bold'
    if (position <= 3) return 'text-orange-600 font-semibold'
    if (position <= maxPlayers * 0.15) return 'text-green-600'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getROIColor = (roi: number) => {
    if (roi > 0) return 'text-green-600 dark:text-green-400'
    if (roi < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Главная', href: '/' },
            { label: 'Результаты турниров' }
          ]} 
          className="mb-6"
        />

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🏆 Результаты турниров
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Подробная статистика и результаты завершенных турниров
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {resultStats.totalTournaments}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Турниров
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {resultStats.winsCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Побед
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {resultStats.cashRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                ITM
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${getROIColor(resultStats.avgROI)}`}>
                {resultStats.avgROI.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Средний ROI
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className={`text-lg font-bold ${getROIColor(resultStats.totalProfit)}`}>
                {formatCurrency(resultStats.totalProfit)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Прибыль
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {resultStats.avgPosition.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Ср. позиция
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🔍 Фильтры и поиск</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Input
                type="text"
                placeholder="Поиск по названию, месту..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                label="Поиск"
              />

              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Тип турнира"
                options={[
                  { value: 'all', label: 'Все типы' },
                  { value: 'tournament', label: 'Турнир' },
                  { value: 'sit_and_go', label: 'Sit & Go' },
                  { value: 'cash_game', label: 'Кэш игра' },
                  { value: 'satellite', label: 'Сателлит' }
                ]}
              />

              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                label="Период"
                options={[
                  { value: 'all', label: 'Все время' },
                  { value: 'week', label: 'Неделя' },
                  { value: 'month', label: 'Месяц' },
                  { value: 'quarter', label: 'Квартал' },
                  { value: 'year', label: 'Год' }
                ]}
              />

              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Сортировка"
                options={[
                  { value: 'date', label: 'По дате' },
                  { value: 'profit', label: 'По прибыли' },
                  { value: 'roi', label: 'По ROI' },
                  { value: 'position', label: 'По позиции' },
                  { value: 'buyin', label: 'По бай-ину' }
                ]}
              />
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant={sortOrder === 'desc' ? 'primary' : 'outline'}
                onClick={() => setSortOrder('desc')}
                size="sm"
              >
                ↓ По убыванию
              </Button>
              <Button
                variant={sortOrder === 'asc' ? 'primary' : 'outline'}
                onClick={() => setSortOrder('asc')}
                size="sm"
              >
                ↑ По возрастанию
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📊 Результаты ({filteredResults.length})</span>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Всего: {formatCurrency(resultStats.totalInvestment)} → {formatCurrency(resultStats.totalWinnings)}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredResults.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Результатов не найдено
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Попробуйте изменить параметры поиска или фильтры
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">
                        Турнир
                      </th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">
                        Дата
                      </th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">
                        Позиция
                      </th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white">
                        Бай-ин
                      </th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white">
                        Выплата
                      </th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white">
                        Прибыль
                      </th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white">
                        ROI
                      </th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">
                        Детали
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((tournament) => (
                      <tr 
                        key={tournament.id} 
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-4 px-2">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {tournament.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {tournament.venue} • {tournament.type}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-gray-600 dark:text-gray-400">
                          {new Date(tournament.date).toLocaleDateString('ru-RU')}
                        </td>
                        <td className={`py-4 px-2 text-center font-semibold ${getPositionColor(tournament.result?.position || 0, tournament.maxPlayers)}`}>
                          {tournament.result?.position || '-'} / {tournament.maxPlayers}
                          {tournament.result?.finalTableReached && (
                            <div className="text-xs text-orange-600">FT</div>
                          )}
                        </td>
                        <td className="py-4 px-2 text-right text-gray-900 dark:text-white">
                          {formatCurrency(tournament.buyIn)}
                        </td>
                        <td className="py-4 px-2 text-right font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(tournament.result?.payout || 0)}
                        </td>
                        <td className={`py-4 px-2 text-right font-semibold ${getROIColor(tournament.result?.profit || 0)}`}>
                          {formatCurrency(tournament.result?.profit || 0)}
                        </td>
                        <td className={`py-4 px-2 text-right font-semibold ${getROIColor(tournament.result?.roi || 0)}`}>
                          {tournament.result?.roi?.toFixed(1) || '0.0'}%
                        </td>
                        <td className="py-4 px-2 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {tournament.result?.knockouts && tournament.result.knockouts > 0 && (
                              <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded">
                                {tournament.result.knockouts} KO
                              </span>
                            )}
                            {tournament.result?.rebuyCount && tournament.result.rebuyCount > 0 && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                                {tournament.result.rebuyCount} RB
                              </span>
                            )}
                            {tournament.result?.addonCount && tournament.result.addonCount > 0 && (
                              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded">
                                {tournament.result.addonCount} AO
                              </span>
                            )}
                          </div>
                          {tournament.result?.notes && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-32" title={tournament.result.notes}>
                              {tournament.result.notes}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* История изменений результатов */}
        <div className="mt-8">
          <ResultHistory 
            userId={user?.id || ''}
            maxItems={10}
            showTournamentName={true}
          />
        </div>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <ProtectedRoute>
      <ResultsContent />
    </ProtectedRoute>
  )
}
