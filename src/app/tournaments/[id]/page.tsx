'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth, ProtectedRoute } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Breadcrumbs } from '@/components/ui/Navigation'
import { getTournamentById, deleteTournament } from '@/data/mockData'
import { notifyTournamentsUpdate } from '@/hooks/useTournaments'
import { formatCurrency, formatDate, getPositionEmoji } from '@/lib/utils'

function TournamentDetailsContent() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const tournamentId = params.id as string
  const tournament = getTournamentById(tournamentId)
  
  const [showResultForm, setShowResultForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [resultForm, setResultForm] = useState({
    position: '',
    payout: '',
    notes: ''
  })

  if (!tournament) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">🚫</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Турнир не найден
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Возможно, турнир был удален или ссылка неверна
              </p>
              <Button onClick={() => router.push('/tournaments')}>
                ← Вернуться к турнирам
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const handleAddResult = async () => {
    if (!resultForm.position || !resultForm.payout) {
      addToast({
        type: 'error',
        message: 'Заполните обязательные поля'
      })
      return
    }

    try {
      // Мок сохранения результата
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      addToast({
        type: 'success',
        message: 'Результат успешно добавлен!'
      })
      
      setShowResultForm(false)
      // В реальном приложении здесь был бы рефреш данных
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Ошибка при сохранении результата'
      })
    }
  }

  const handleDeleteTournament = async () => {
    setIsDeleting(true)
    
    try {
      // Симуляция удаления
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const success = deleteTournament(tournamentId)
      
      if (success) {
        addToast({
          type: 'success',
          message: `Турнир "${tournament.name}" успешно удален!`
        })
        
        // Уведомляем другие компоненты об обновлении
        notifyTournamentsUpdate()
        
        router.push('/tournaments')
      } else {
        throw new Error('Турнир не найден')
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Ошибка при удалении турнира'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status as keyof typeof badges] || badges.registered}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Главная', href: '/' },
            { label: 'Турниры', href: '/tournaments' },
            { label: tournament.name }
          ]} 
          className="mb-6"
        />

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            {/* Result Icon */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
              tournament.result?.position === 1 ? 'bg-yellow-500' :
              tournament.result?.position === 2 ? 'bg-gray-400' :
              tournament.result?.position === 3 ? 'bg-orange-500' :
              tournament.result && tournament.result.payout > 0 ? 'bg-emerald-500' :
              tournament.result ? 'bg-red-500' : 'bg-blue-500'
            }`}>
              {tournament.result ? getPositionEmoji(tournament.result.position) : '⏳'}
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {tournament.name}
              </h1>
              <div className="flex items-center space-x-4">
                {getStatusBadge(tournament.status)}
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm font-medium">
                  {tournament.tournamentType}
                </span>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button 
              variant="outline"
              onClick={() => router.push(`/tournaments/${tournamentId}/edit`)}
            >
              ✏️ Редактировать
            </Button>
            {!tournament.result && tournament.status === 'finished' && (
              <Button 
                onClick={() => setShowResultForm(true)}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                ➕ Добавить результат
              </Button>
            )}
            <Button 
              variant="outline" 
              className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => setShowDeleteConfirm(true)}
            >
              🗑️ Удалить
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tournament Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2">ℹ️</span>
                  Информация о турнире
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Дата и время</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatDate(tournament.date)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Место проведения</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {tournament.venue || 'Не указано'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Бай-ин</label>
                    <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(tournament.buyin)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Структура</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {tournament.structure || 'Не указано'}
                    </p>
                  </div>
                  
                  {tournament.participants && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Участники</label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {tournament.participants} игроков
                      </p>
                    </div>
                  )}
                  
                  {tournament.prizePool && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Призовой фонд</label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(tournament.prizePool)}
                      </p>
                    </div>
                  )}
                  
                  {tournament.blindLevels && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Уровни блайндов</label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {tournament.blindLevels}
                      </p>
                    </div>
                  )}
                  
                  {tournament.startingStack && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Стартовый стек</label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {tournament.startingStack.toLocaleString()} фишек
                      </p>
                    </div>
                  )}
                </div>

                {tournament.notes && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Заметки</label>
                    <p className="text-gray-900 dark:text-white mt-2">{tournament.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Photo */}
            {tournament.ticketImageUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2">📸</span>
                    Фото билета
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <img 
                    src={tournament.ticketImageUrl} 
                    alt="Tournament ticket" 
                    className="w-full max-w-md rounded-lg shadow-lg"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Result Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2">🏆</span>
                  Результат
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tournament.result ? (
                  <div className="text-center space-y-4">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto ${
                      tournament.result.position === 1 ? 'bg-yellow-500' :
                      tournament.result.position === 2 ? 'bg-gray-400' :
                      tournament.result.position === 3 ? 'bg-orange-500' :
                      tournament.result.payout > 0 ? 'bg-emerald-500' : 'bg-red-500'
                    }`}>
                      {getPositionEmoji(tournament.result.position)}
                    </div>
                    
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        #{tournament.result.position}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">место</p>
                    </div>
                    
                    <div>
                      <p className={`text-2xl font-bold ${
                        tournament.result.payout > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'
                      }`}>
                        {tournament.result.payout > 0 ? formatCurrency(tournament.result.payout) : 'Без призов'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">выигрыш</p>
                    </div>
                    
                    <div>
                      <p className={`text-xl font-bold ${
                        tournament.result.roi > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {tournament.result.roi > 0 ? '+' : ''}{tournament.result.roi.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">ROI</p>
                    </div>

                    {tournament.result.notes && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {tournament.result.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {tournament.status === 'registered' ? 'Турнир еще не начался' : 'Результат не добавлен'}
                    </p>
                    {tournament.status === 'finished' && (
                      <Button 
                        size="sm"
                        onClick={() => setShowResultForm(true)}
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        Добавить результат
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2">📊</span>
                  Быстрая статистика
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Инвестировано:</span>
                  <span className="font-semibold">{formatCurrency(tournament.buyin)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Получено:</span>
                  <span className={`font-semibold ${
                    tournament.result && tournament.result.payout > 0 ? 'text-emerald-600' : 'text-gray-500'
                  }`}>
                    {tournament.result ? formatCurrency(tournament.result.payout) : formatCurrency(0)}
                  </span>
                </div>
                
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Прибыль:</span>
                  <span className={`font-semibold ${
                    tournament.result && tournament.result.payout > tournament.buyin ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {tournament.result 
                      ? formatCurrency(tournament.result.payout - tournament.buyin)
                      : formatCurrency(-tournament.buyin)
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Result Modal */}
        {showResultForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Добавить результат</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="number"
                  label="Место"
                  placeholder="1"
                  value={resultForm.position}
                  onChange={(e) => setResultForm(prev => ({ ...prev, position: e.target.value }))}
                  required
                />
                
                <Input
                  type="number"
                  label="Выигрыш ($)"
                  placeholder="0"
                  value={resultForm.payout}
                  onChange={(e) => setResultForm(prev => ({ ...prev, payout: e.target.value }))}
                  required
                />
                
                <Input
                  label="Заметки"
                  placeholder="Комментарий к результату..."
                  value={resultForm.notes}
                  onChange={(e) => setResultForm(prev => ({ ...prev, notes: e.target.value }))}
                />
                
                <div className="flex space-x-4 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowResultForm(false)}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                  <Button 
                    onClick={handleAddResult}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                  >
                    Сохранить
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">
                  🗑️ Удалить турнир
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-6xl mb-4">⚠️</div>
                  <p className="text-gray-900 dark:text-white font-medium mb-2">
                    Вы уверены, что хотите удалить турнир?
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    "{tournament.name}"
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Это действие нельзя отменить. Все данные турнира будут безвозвратно удалены.
                  </p>
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                    disabled={isDeleting}
                  >
                    Отмена
                  </Button>
                  <Button 
                    onClick={handleDeleteTournament}
                    loading={isDeleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? 'Удаляем...' : 'Да, удалить'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TournamentDetailsPage() {
  return (
    <ProtectedRoute>
      <TournamentDetailsContent />
    </ProtectedRoute>
  )
}
