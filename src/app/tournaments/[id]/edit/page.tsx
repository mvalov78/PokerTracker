'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth, ProtectedRoute } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input, { Textarea, Select } from '@/components/ui/Input'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Breadcrumbs } from '@/components/ui/Navigation'
import { getTournamentById, updateTournament } from '@/data/mockData'
import { notifyTournamentsUpdate } from '@/hooks/useTournaments'
import type { TournamentFormData } from '@/types'

function EditTournamentContent() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const tournamentId = params.id as string
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [tournament, setTournament] = useState(null)
  
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    date: '',
    venue: '',
    buyin: 0,
    tournamentType: 'freezeout',
    structure: '',
    participants: undefined,
    prizePool: undefined,
    blindLevels: '',
    startingStack: undefined,
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const tournamentTypeOptions = [
    { value: 'freezeout', label: 'Freezeout' },
    { value: 'rebuy', label: 'Rebuy' },
    { value: 'addon', label: 'Add-on' },
    { value: 'bounty', label: 'Bounty' },
    { value: 'satellite', label: 'Satellite' },
  ]

  // Загружаем данные турнира
  useEffect(() => {
    const loadTournament = async () => {
      setIsLoadingData(true)
      
      // Симуляция загрузки
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const tournamentData = getTournamentById(tournamentId)
      
      if (!tournamentData) {
        addToast({
          type: 'error',
          message: `Турнир с ID "${tournamentId}" не найден`
        })
        router.push('/tournaments')
        return
      }
      
      setTournament(tournamentData)
      
      // Заполняем форму данными турнира
      setFormData({
        name: tournamentData.name,
        date: tournamentData.date,
        venue: tournamentData.venue || '',
        buyin: tournamentData.buyin,
        tournamentType: tournamentData.tournamentType,
        structure: tournamentData.structure || '',
        participants: tournamentData.participants,
        prizePool: tournamentData.prizePool,
        blindLevels: tournamentData.blindLevels || '',
        startingStack: tournamentData.startingStack,
        notes: tournamentData.notes || ''
      })
      
      setIsLoadingData(false)
    }

    loadTournament()
  }, [tournamentId, router, addToast])

  const handleInputChange = (field: keyof TournamentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Очистка ошибки при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Название турнира обязательно'
    }
    if (!formData.date) {
      newErrors.date = 'Дата турнира обязательна'
    }
    if (!formData.venue?.trim()) {
      newErrors.venue = 'Место проведения обязательно'
    }
    if (!formData.buyin || formData.buyin <= 0) {
      newErrors.buyin = 'Бай-ин должен быть больше 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      // Симуляция сохранения
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Обновляем турнир
      const updatedTournament = updateTournament(tournamentId, {
        name: formData.name,
        date: formData.date,
        venue: formData.venue,
        buyin: formData.buyin,
        tournamentType: formData.tournamentType,
        structure: formData.structure,
        participants: formData.participants,
        prizePool: formData.prizePool,
        blindLevels: formData.blindLevels,
        startingStack: formData.startingStack,
        notes: formData.notes
      })
      
      if (!updatedTournament) {
        throw new Error('Турнир не найден')
      }
      
      addToast({
        type: 'success',
        message: `Турнир "${updatedTournament.name}" успешно обновлен!`
      })
      
      // Уведомляем другие компоненты об обновлении
      notifyTournamentsUpdate()
      
      router.push(`/tournaments/${tournamentId}`)
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Ошибка при сохранении турнира'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return null
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Главная', href: '/' },
            { label: 'Турниры', href: '/tournaments' },
            { label: tournament.name, href: `/tournaments/${tournamentId}` },
            { label: 'Редактировать' }
          ]} 
          className="mb-6"
        />

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ✏️ Редактировать турнир
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Обновите информацию о турнире "{tournament.name}"
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Информация о турнире</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Название турнира"
                  placeholder="Sunday Million"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={errors.name}
                  required
                />

                <Input
                  type="datetime-local"
                  label="Дата и время"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  error={errors.date}
                  required
                />

                <Input
                  label="Место проведения"
                  placeholder="PokerStars Casino"
                  value={formData.venue || ''}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  error={errors.venue}
                  required
                />

                <Input
                  type="number"
                  label="Бай-ин ($)"
                  placeholder="100"
                  value={formData.buyin || ''}
                  onChange={(e) => handleInputChange('buyin', e.target.value ? parseFloat(e.target.value) : 0)}
                  error={errors.buyin}
                  required
                />

                <Select
                  label="Тип турнира"
                  options={tournamentTypeOptions}
                  value={formData.tournamentType}
                  onChange={(e) => handleInputChange('tournamentType', e.target.value)}
                  required
                />

                <Input
                  label="Структура"
                  placeholder="NL Hold'em"
                  value={formData.structure || ''}
                  onChange={(e) => handleInputChange('structure', e.target.value)}
                />

                <Input
                  type="number"
                  label="Количество участников"
                  placeholder="150"
                  value={formData.participants || ''}
                  onChange={(e) => handleInputChange('participants', e.target.value ? parseInt(e.target.value) : undefined)}
                />

                <Input
                  type="number"
                  label="Призовой фонд ($)"
                  placeholder="25000"
                  value={formData.prizePool || ''}
                  onChange={(e) => handleInputChange('prizePool', e.target.value ? parseFloat(e.target.value) : undefined)}
                />

                <Input
                  label="Уровни блайндов"
                  placeholder="15 минут"
                  value={formData.blindLevels || ''}
                  onChange={(e) => handleInputChange('blindLevels', e.target.value)}
                />

                <Input
                  type="number"
                  label="Стартовый стек"
                  placeholder="30000"
                  value={formData.startingStack || ''}
                  onChange={(e) => handleInputChange('startingStack', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>

              <Textarea
                label="Заметки"
                placeholder="Дополнительная информация о турнире..."
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/tournaments/${tournamentId}`)}
            >
              ← Отмена
            </Button>
            
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/tournaments')}
              >
                К списку турниров
              </Button>
              
              <Button
                type="submit"
                loading={isLoading}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              >
                {isLoading ? 'Сохраняем...' : 'Сохранить изменения'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function EditTournamentPage() {
  return (
    <ProtectedRoute>
      <EditTournamentContent />
    </ProtectedRoute>
  )
}
