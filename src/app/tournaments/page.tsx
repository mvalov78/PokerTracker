'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAllTournaments, deleteTournament } from '@/data/mockData'
import type { Tournament } from '@/types'

export default function TournamentsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [tournaments, setTournaments] = useState<Tournament[]>([])

  // Загружаем турниры при монтировании компонента
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        // Сначала пробуем загрузить через API
        const response = await fetch('/api/tournaments')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            console.warn('[WEB] Загружено турниров:', data.tournaments.length)
            data.tournaments.forEach((t: any) => {
              console.warn('[WEB] Турнир:', {
                name: t.name,
                id: t.id,
                has_result: !!t.result,
                has_tournament_results: !!t.tournament_results,
                tournament_results_type: typeof t.tournament_results,
                tournament_results_value: t.tournament_results
              })
            })
            setTournaments(data.tournaments)
            return
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки турниров через API:', error)
      }
      
      // Fallback на localStorage
      const allTournaments = getAllTournaments()
      setTournaments(allTournaments)
    }
    
    loadTournaments()
    
    // Обновляем каждые 2 секунды для синхронизации с ботом
    const interval = setInterval(loadTournaments, 2000)
    return () => clearInterval(interval)
  }, [])

  // Обработчик удаления турнира
  const handleDeleteTournament = async (tournament: Tournament) => {
    const confirmDelete = confirm(
      `Вы уверены, что хотите удалить турнир "${tournament.name}"?\n\n` +
      `Это действие нельзя отменить. Будут удалены:\n` +
      `• Данные турнира\n` +
      `• Результаты (если есть)\n` +
      `• Вся связанная информация`
    )
    
    if (confirmDelete) {
      try {
        // Пробуем удалить через API
        const response = await fetch(`/api/tournaments?id=${tournament.id}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          // Обновляем список турниров немедленно
          const updatedTournaments = tournaments.filter(t => t.id !== tournament.id)
          setTournaments(updatedTournaments)
          alert(`Турнир "${tournament.name}" успешно удален`)
        } else {
          throw new Error('API deletion failed')
        }
      } catch (error) {
        console.error('Ошибка удаления через API, пробуем fallback:', error)
        
        // Fallback на localStorage
        const success = deleteTournament(tournament.id)
        if (success) {
          const updatedTournaments = getAllTournaments()
          setTournaments(updatedTournaments)
          alert(`Турнир "${tournament.name}" успешно удален`)
        } else {
          alert('Ошибка при удалении турнира')
        }
      }
    }
  }

  const filteredTournaments = tournaments.filter(tournament =>
    tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tournament.venue.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎰 Мои турниры
          </h1>
          <p className="text-gray-600">
            Управление и отслеживание ваших покерных турниров
          </p>
        </div>

        {/* Search and Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <input
              type="text"
              placeholder="Поиск по названию или площадке..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/tournaments/add')}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                ➕ Добавить турнир
              </button>
              <button
                onClick={() => router.push('/analytics')}
                className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
              >
                📊 Статистика
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {filteredTournaments.length}
            </div>
            <div className="text-gray-600">Всего турниров</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              ${filteredTournaments.reduce((sum, t) => sum + t.buyin, 0)}
            </div>
            <div className="text-gray-600">Общий бай-ин</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              ${filteredTournaments.reduce((sum, t) => sum + (t.result?.payout || 0), 0)}
            </div>
            <div className="text-gray-600">Общий выигрыш</div>
          </div>
        </div>

        {/* Tournaments List */}
        <div className="space-y-4">
          {filteredTournaments.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">🎰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Турниры не найдены
              </h3>
              <p className="text-gray-500 mb-6">
                Попробуйте изменить поиск или добавить новый турнир
              </p>
              <button
                onClick={() => router.push('/tournaments/add')}
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
              >
                ➕ Добавить первый турнир
              </button>
            </div>
          ) : (
            filteredTournaments.map((tournament) => (
              <div key={tournament.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  {/* Tournament Info */}
                  <div className="flex items-start space-x-4 mb-4 lg:mb-0">
                    {/* Status Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                      tournament.result?.position === 1 ? 'bg-yellow-500' :
                      tournament.result?.position <= 3 ? 'bg-gray-400' :
                      tournament.result && tournament.result.payout > 0 ? 'bg-green-500' :
                      tournament.result ? 'bg-red-500' : 'bg-blue-500'
                    }`}>
                      {tournament.result ? 
                        (tournament.result.position === 1 ? '🥇' : 
                         tournament.result.position === 2 ? '🥈' : 
                         tournament.result.position === 3 ? '🥉' : 
                         tournament.result.payout > 0 ? '💰' : '❌') : '⏳'}
                    </div>
                    
                    {/* Tournament Details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {tournament.name}
                        </h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {tournament.tournamentType}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span>📅 {new Date(tournament.date).toLocaleDateString('ru-RU')}</span>
                        <span>🏨 {tournament.venue}</span>
                        <span>💵 Бай-ин: ${tournament.buyin}</span>
                        {tournament.participants && (
                          <span>👥 {tournament.participants} игроков</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Result Info */}
                  <div className="flex flex-col lg:items-end space-y-2">
                    {tournament.result ? (
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Место</div>
                          <div className="text-lg font-bold text-gray-900">
                            #{tournament.result.position}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Выигрыш</div>
                          <div className={`text-lg font-bold ${
                            tournament.result.payout > 0 ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {tournament.result.payout > 0 ? `$${tournament.result.payout}` : 'Без призов'}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-gray-500">ROI</div>
                          <div className={`text-lg font-bold ${
                            tournament.result.roi > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {tournament.result.roi > 0 ? '+' : ''}{tournament.result.roi.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center lg:text-right">
                        <div className="text-blue-600 font-semibold">Предстоящий</div>
                        <div className="text-sm text-gray-500">
                          {new Date(tournament.date).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-2 mt-4">
                      <button 
                        onClick={() => router.push(`/tournaments/${tournament.id}`)}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
                      >
                        👁️ Подробнее
                      </button>
                      <button 
                        onClick={() => router.push(`/tournaments/${tournament.id}/edit`)}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm"
                      >
                        ✏️ Редактировать
                      </button>
                      {(() => {
                        // Проверяем наличие результата (как в боте)
                        const hasResult = !!(
                          tournament.result || 
                          (Array.isArray(tournament.tournament_results) && tournament.tournament_results.length > 0) ||
                          (tournament.tournament_results && 
                           typeof tournament.tournament_results === 'object' && 
                           !Array.isArray(tournament.tournament_results) &&
                           tournament.tournament_results !== null &&
                           Object.keys(tournament.tournament_results).length > 0)
                        );
                        
                        console.warn('[WEB] Проверка результата для', tournament.name, ':', hasResult);
                        
                        return hasResult ? (
                          <button 
                            onClick={() => router.push(`/tournaments/${tournament.id}#edit-result`)}
                            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors text-sm"
                          >
                            ✏️ Редактировать результат
                          </button>
                        ) : (
                          <button 
                            onClick={() => router.push(`/tournaments/${tournament.id}#add-result`)}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors text-sm"
                          >
                            ➕ Добавить результат
                          </button>
                        );
                      })()}
                      <button 
                        onClick={() => handleDeleteTournament(tournament)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm"
                        title="Удалить турнир"
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
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