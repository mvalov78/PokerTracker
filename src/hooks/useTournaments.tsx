'use client'

import { useState, useEffect } from 'react'
import type { Tournament } from '@/types'

// Простой механизм для обновления данных между компонентами
let tournamentsUpdateCallbacks: (() => void)[] = []

export function notifyTournamentsUpdate() {
  tournamentsUpdateCallbacks.forEach(callback => callback())
}

export function useTournaments(userId?: string) {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshTournaments = async () => {
    if (!userId) {
      setError('Требуется авторизация')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // Всегда требуем userId
      const url = `/api/tournaments?userId=${userId}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setTournaments(data.tournaments || [])
      } else {
        throw new Error(data.error || 'Не удалось загрузить турниры')
      }
    } catch (err) {
      console.error('Ошибка при загрузке турниров:', err)
      setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке данных')
      setTournaments([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshTournaments()
    
    // Подписываемся на обновления
    tournamentsUpdateCallbacks.push(refreshTournaments)
    
    // Слушаем события добавления турниров
    const handleTournamentAdded = () => {
      refreshTournaments()
    }
    
    window.addEventListener('tournamentAdded', handleTournamentAdded)
    
    return () => {
      // Отписываемся при размонтировании
      tournamentsUpdateCallbacks = tournamentsUpdateCallbacks.filter(
        callback => callback !== refreshTournaments
      )
      window.removeEventListener('tournamentAdded', handleTournamentAdded)
    }
  }, [userId])

  return {
    tournaments,
    isLoading,
    error,
    refresh: refreshTournaments
  }
}
