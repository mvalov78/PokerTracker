'use client'

import { useState, useEffect } from 'react'
import { getAllTournaments, getTournamentsByUser, initializeTournamentData } from '@/data/mockData'
import type { Tournament } from '@/types'

// Простой механизм для обновления данных между компонентами
let tournamentsUpdateCallbacks: (() => void)[] = []

export function notifyTournamentsUpdate() {
  tournamentsUpdateCallbacks.forEach(callback => callback())
}

export function useTournaments(userId?: string) {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshTournaments = () => {
    setIsLoading(true)
    
    // Инициализируем данные при первом обращении
    initializeTournamentData()
    
    // Симуляция загрузки
    setTimeout(() => {
      const updatedTournaments = userId 
        ? getTournamentsByUser(userId)
        : getAllTournaments() // Получаем все турниры
      
      setTournaments(updatedTournaments)
      setIsLoading(false)
    }, 100)
  }

  useEffect(() => {
    refreshTournaments()
    
    // Подписываемся на обновления
    tournamentsUpdateCallbacks.push(refreshTournaments)
    
    return () => {
      // Отписываемся при размонтировании
      tournamentsUpdateCallbacks = tournamentsUpdateCallbacks.filter(
        callback => callback !== refreshTournaments
      )
    }
  }, [userId])

  return {
    tournaments,
    isLoading,
    refresh: refreshTournaments
  }
}
