'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, ProtectedRoute } from '@/hooks/useAuth'
import { useTournaments } from '@/hooks/useTournaments'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Input, { Select } from '@/components/ui/Input'
import { Breadcrumbs } from '@/components/ui/Navigation'
import { formatCurrency, formatDate, getPositionEmoji } from '@/lib/utils'
import type { Tournament } from '@/types'

function TournamentsContent() {
  const router = useRouter()
  const { user } = useAuth()
  const { tournaments, isLoading } = useTournaments(user?.id)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Фильтрация и сортировка турниров
  const filteredAndSortedTournaments = useMemo(() => {
    let filtered = tournaments.filter(tournament => {
      const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tournament.venue?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter
      const matchesType = typeFilter === 'all' || tournament.tournamentType === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })

    // Сортировка
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
          break
        case 'buyin':
          aValue = a.buyin
          bValue = b.buyin
          break
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'result':
          aValue = a.result?.payout || 0
          bValue = b.result?.payout || 0
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [tournaments, searchTerm, statusFilter, typeFilter, sortBy, sortOrder])

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  const statusOptions = [
    { value: 'all', label: 'Все статусы' },
    { value: 'registered', label: 'Зарегистрирован' },
    { value: 'playing', label: 'В процессе' },
    { value: 'finished', label: 'Завершен' },
    { value: 'cancelled', label: 'Отменен' },
  ]

  const typeOptions = [
    { value: 'all', label: 'Все типы' },
    { value: 'freezeout', label: 'Freezeout' },
    { value: 'rebuy', label: 'Rebuy' },
    { value: 'addon', label: 'Add-on' },
    { value: 'bounty', label: 'Bounty' },
    { value: 'satellite', label: 'Satellite' },
  ]

  const sortOptions = [
    { value: 'date', label: 'По дате' },
    { value: 'name', label: 'По названию' },
    { value: 'buyin', label: 'По бай-ину' },
    { value: 'result', label: 'По результату' },
  ]

  const getStatusBadge = (status: string) => {
    const badges = {
      registered: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      playing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      finished: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    }
    
    const statusLabels = {
      registered: 'Зарегистрирован',
      playing: 'В процессе',
      finished: 'Завершен',
      cancelled: 'Отменен',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges] || badges.registered}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Главная', href: '/' },
            { label: 'Турниры' }
          ]} 
          className="mb-6"
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🎰 Мои турниры
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Управление и отслеживание ваших покерных турниров
            </p>
          </div>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <Button variant="outline" size="sm">
              📊 Статистика
            </Button>
            <Button 
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              onClick={() => window.location.href = '/tournaments/add'}
            >
              ➕ Добавить турнир
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Фильтры и поиск</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Input
                placeholder="Поиск по названию или площадке..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="lg:col-span-2"
              />
              
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Статус"
              />
              
              <Select
                options={typeOptions}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Тип"
              />
              
              <div className="flex space-x-2">
                <Select
                  options={sortOptions}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Сортировка"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="mt-6 px-3"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {filteredAndSortedTournaments.length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Найдено турниров</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {filteredAndSortedTournaments.filter(t => t.status === 'finished').length}
              </div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">Завершено</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {filteredAndSortedTournaments.filter(t => t.status === 'registered').length}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">Предстоящие</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {formatCurrency(filteredAndSortedTournaments.reduce((sum, t) => sum + t.buyin, 0))}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Общий бай-ин</div>
            </CardContent>
          </Card>
        </div>

        {/* Tournaments List */}
        <div className="space-y-4">
          {filteredAndSortedTournaments.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">🎰</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Турниры не найдены
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Попробуйте изменить фильтры или добавить новый турнир
                </p>
                <Button 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                  onClick={() => window.location.href = '/tournaments/add'}
                >
                  ➕ Добавить первый турнир
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedTournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                    {/* Main Info */}
                    <div className="flex items-start space-x-4 mb-4 lg:mb-0">
                      {/* Result Icon */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                        tournament.result?.position === 1 ? 'bg-yellow-500' :
                        tournament.result?.position === 2 ? 'bg-gray-400' :
                        tournament.result?.position === 3 ? 'bg-orange-500' :
                        tournament.result && tournament.result.payout > 0 ? 'bg-emerald-500' :
                        tournament.result ? 'bg-red-500' : 'bg-blue-500'
                      }`}>
                        {tournament.result ? getPositionEmoji(tournament.result.position) : '⏳'}
                      </div>
                      
                      {/* Tournament Details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {tournament.name}
                          </h3>
                          {getStatusBadge(tournament.status)}
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                            {tournament.tournamentType}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center">
                            📅 {formatDate(tournament.date)}
                          </span>
                          <span className="flex items-center">
                            🏨 {tournament.venue || 'Не указано'}
                          </span>
                          <span className="flex items-center">
                            💵 Бай-ин: {formatCurrency(tournament.buyin)}
                          </span>
                          {tournament.participants && (
                            <span className="flex items-center">
                              👥 {tournament.participants} игроков
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Result Info */}
                    <div className="flex flex-col lg:items-end space-y-2">
                      {tournament.result ? (
                        <>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-sm text-gray-500 dark:text-gray-400">Место</div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                #{tournament.result.position}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-sm text-gray-500 dark:text-gray-400">Выигрыш</div>
                              <div className={`text-lg font-bold ${
                                tournament.result.payout > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'
                              }`}>
                                {tournament.result.payout > 0 ? formatCurrency(tournament.result.payout) : 'Без призов'}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-sm text-gray-500 dark:text-gray-400">ROI</div>
                              <div className={`text-lg font-bold ${
                                tournament.result.roi > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                              }`}>
                                {tournament.result.roi > 0 ? '+' : ''}{tournament.result.roi.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center lg:text-right">
                          <div className="text-blue-600 dark:text-blue-400 font-semibold">
                            {tournament.status === 'registered' ? 'Предстоящий' : 'В процессе'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(tournament.date, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.location.href = `/tournaments/${tournament.id}`}
                        >
                          👁️ Подробнее
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/tournaments/${tournament.id}/edit`)}
                        >
                          ✏️ Редактировать
                        </Button>
                        {!tournament.result && tournament.status === 'finished' && (
                          <Button 
                            size="sm" 
                            className="bg-emerald-500 hover:bg-emerald-600"
                            onClick={() => window.location.href = `/tournaments/${tournament.id}#add-result`}
                          >
                            ➕ Результат
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-2xl hover:shadow-emerald-500/25 transform hover:scale-110 transition-all duration-200"
            onClick={() => window.location.href = '/tournaments/add'}
          >
            <span className="text-2xl">+</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function TournamentsPage() {
  return (
    <ProtectedRoute>
      <TournamentsContent />
    </ProtectedRoute>
  )
}
