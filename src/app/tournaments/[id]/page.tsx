'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getTournamentById, deleteTournament } from '@/data/mockData'
import type { Tournament } from '@/types'

export default function TournamentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tournamentId = params.id as string
  
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddResult, setShowAddResult] = useState(false)
  const [showEditResult, setShowEditResult] = useState(false)
  const [resultForm, setResultForm] = useState({
    position: '',
    payout: '',
    notes: '',
    knockouts: '',
    rebuyCount: '',
    addonCount: ''
  })

  // Загрузка данных турнира
  useEffect(() => {
    const loadTournament = async () => {
      setIsLoading(true)
      
      try {
        // Пробуем загрузить через API
        const response = await fetch(`/api/tournaments/${tournamentId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setTournament(data.tournament)
            setIsLoading(false)
            return
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки турнира через API:', error)
      }
      
      // Fallback на localStorage
      const foundTournament = getTournamentById(tournamentId)
      
      if (!foundTournament) {
        // Турнир не найден, перенаправляем на список
        router.push('/tournaments')
        return
      }
      
      setTournament(foundTournament)
      setIsLoading(false)
    }
    
    loadTournament()
  }, [tournamentId, router])

  // Обработчик удаления турнира
  const handleDeleteTournament = () => {
    if (!tournament) {return}
    
    const confirmDelete = confirm(
      `Вы уверены, что хотите удалить турнир "${tournament.name}"?\n\n` +
      `Это действие нельзя отменить. Будут удалены:\n` +
      `• Данные турнира\n` +
      `• Результаты (если есть)\n` +
      `• Вся связанная информация`
    )
    
    if (confirmDelete) {
      const success = deleteTournament(tournament.id)
      if (success) {
        alert(`Турнир "${tournament.name}" успешно удален`)
        router.push('/tournaments')
      } else {
        alert('Ошибка при удалении турнира')
      }
    }
  }

  // Проверяем хэш для автоматического открытия формы
  useEffect(() => {
    const hash = window.location.hash
    if (hash === '#add-result') {
      setShowAddResult(true)
    } else if (hash === '#edit-result') {
      setShowEditResult(true)
      // Заполняем форму текущими данными результата
      if (tournament?.result) {
        setResultForm({
          position: tournament.result.position.toString(),
          payout: tournament.result.payout.toString(),
          notes: tournament.result.notes || '',
          knockouts: tournament.result.knockouts?.toString() || '',
          rebuyCount: tournament.result.rebuyCount?.toString() || '',
          addonCount: tournament.result.addonCount?.toString() || ''
        })
      }
    }
  }, [tournament])

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!tournament) {return}
    
    try {
      // Подготавливаем данные результата
      const resultData = {
        position: parseInt(resultForm.position),
        payout: parseFloat(resultForm.payout),
        notes: resultForm.notes,
        knockouts: resultForm.knockouts ? parseInt(resultForm.knockouts) : 0,
        rebuyCount: resultForm.rebuyCount ? parseInt(resultForm.rebuyCount) : 0,
        addonCount: resultForm.addonCount ? parseInt(resultForm.addonCount) : 0,
      }

      // Вычисляем прибыль и ROI
      const profit = resultData.payout - tournament.buyin
      const roi = tournament.buyin > 0 ? (profit / tournament.buyin) * 100 : 0

      const fullResultData = {
        ...resultData,
        profit,
        roi,
        finalTableReached: resultData.position <= 9, // Условие для финального стола
      }

      // Обновляем турнир с результатом
      const updateData = {
        ...tournament,
        result: fullResultData,
        updatedAt: new Date().toISOString()
      }

      try {
        // Пробуем обновить через API
        const response = await fetch(`/api/tournaments/${tournament.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            // Обновляем локальное состояние
            setTournament(data.tournament)
            alert('Результат успешно сохранен!')
            setShowAddResult(false)
            setShowEditResult(false)
            window.location.hash = ''
            return
          }
        }
        
        throw new Error('API update failed')
      } catch (apiError) {
        console.error('Ошибка сохранения через API, пробуем fallback:', apiError)
        
        // Fallback на localStorage (если есть функция updateTournament)
        // Для простоты просто показываем сообщение об ошибке
        throw new Error('Не удалось сохранить результат')
      }

    } catch (error) {
      console.error('Ошибка при сохранении результата:', error)
      alert('Ошибка при сохранении результата')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`
  }

  // Показываем загрузку пока данные не загружены
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Загружаем данные турнира...
            </h3>
            <p className="text-gray-500">
              Пожалуйста, подождите
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Турнир не найден
            </h3>
            <p className="text-gray-500 mb-6">
              Возможно, турнир был удален или ID указан неверно
            </p>
            <button
              onClick={() => router.push('/tournaments')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              ← Вернуться к списку турниров
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-gray-600 mb-4">
            <a href="/" className="hover:text-blue-600">Главная</a>
            <span className="mx-2">→</span>
            <a href="/tournaments" className="hover:text-blue-600">Турниры</a>
            <span className="mx-2">→</span>
            <span>{tournament.name}</span>
          </nav>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🎰 {tournament.name}
              </h1>
              <p className="text-gray-600">
                {tournament.venue} • {formatDate(tournament.date)}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/tournaments/${tournamentId}/edit`)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                ✏️ Редактировать
              </button>
              {!tournament.result ? (
                <button
                  onClick={() => setShowAddResult(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  ➕ Добавить результат
                </button>
              ) : (
                <button
                  onClick={() => setShowEditResult(true)}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  ✏️ Редактировать результат
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tournament Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Информация о турнире</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Тип:</span>
                  <span className="font-medium">{tournament.tournamentType}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Структура:</span>
                  <span className="font-medium">{tournament.structure}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Бай-ин:</span>
                  <span className="font-medium">{formatCurrency(tournament.buyin)}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Участники:</span>
                  <span className="font-medium">{tournament.participants?.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Призовой фонд:</span>
                  <span className="font-medium">{formatCurrency(tournament.prizePool || 0)}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Стартовый стек:</span>
                  <span className="font-medium">{tournament.startingStack?.toLocaleString()}</span>
                </div>
              </div>

              {tournament.blindLevels && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Структура блайндов:</h3>
                  <p className="text-gray-600 text-sm">{tournament.blindLevels}</p>
                </div>
              )}

              {tournament.notes && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Заметки:</h3>
                  <p className="text-gray-600">{tournament.notes}</p>
                </div>
              )}
            </div>

            {/* Result Details */}
            {tournament.result && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Результат турнира</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Место:</span>
                    <span className="font-medium">#{tournament.result.position}</span>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Выигрыш:</span>
                    <span className={`font-medium ${tournament.result.payout > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                      {tournament.result.payout > 0 ? formatCurrency(tournament.result.payout) : 'Без призов'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Прибыль:</span>
                    <span className={`font-medium ${tournament.result.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tournament.result.profit >= 0 ? '+' : ''}{formatCurrency(tournament.result.profit)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">ROI:</span>
                    <span className={`font-medium ${tournament.result.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tournament.result.roi >= 0 ? '+' : ''}{tournament.result.roi.toFixed(1)}%
                    </span>
                  </div>
                  
                  {tournament.result.knockouts !== undefined && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Нокауты:</span>
                      <span className="font-medium">{tournament.result.knockouts}</span>
                    </div>
                  )}
                </div>

                {tournament.result.notes && (
                  <div className="mt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Заметки о результате:</h3>
                    <p className="text-gray-600">{tournament.result.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Быстрая статистика</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Статус:</span>
                  <span className={`font-medium ${
                    tournament.result ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {tournament.result ? 'Завершен' : 'Предстоящий'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Дата:</span>
                  <span className="font-medium text-sm">
                    {new Date(tournament.date).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Площадка:</span>
                  <span className="font-medium">{tournament.venue}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Действия</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/tournaments/${tournamentId}/edit`)}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  ✏️ Редактировать турнир
                </button>
                
                <button
                  onClick={handleDeleteTournament}
                  className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  🗑️ Удалить турнир
                </button>
                
                {!tournament.result ? (
                  <button
                    onClick={() => setShowAddResult(true)}
                    className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    ➕ Добавить результат
                  </button>
                ) : (
                  <button
                    onClick={() => setShowEditResult(true)}
                    className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    ✏️ Редактировать результат
                  </button>
                )}
                
                <button
                  onClick={() => router.push('/tournaments')}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← Вернуться к турнирам
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Result Modal */}
        {(showAddResult || showEditResult) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {showAddResult ? 'Добавить результат' : 'Редактировать результат'}
                </h3>
                
                <form onSubmit={handleSubmitResult} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Место *
                    </label>
                    <input
                      type="number"
                      value={resultForm.position}
                      onChange={(e) => setResultForm({...resultForm, position: e.target.value})}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Выигрыш ($)
                    </label>
                    <input
                      type="number"
                      value={resultForm.payout}
                      onChange={(e) => setResultForm({...resultForm, payout: e.target.value})}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Нокауты
                    </label>
                    <input
                      type="number"
                      value={resultForm.knockouts}
                      onChange={(e) => setResultForm({...resultForm, knockouts: e.target.value})}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Заметки
                    </label>
                    <textarea
                      value={resultForm.notes}
                      onChange={(e) => setResultForm({...resultForm, notes: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddResult(false)
                        setShowEditResult(false)
                        window.location.hash = ''
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Сохранить
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
