'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, ProtectedRoute } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input, { Textarea, Select } from '@/components/ui/Input'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Breadcrumbs } from '@/components/ui/Navigation'
import TicketUpload from '@/components/ocr/TicketUpload'
import { generateId } from '@/lib/utils'
import { addTournament } from '@/data/mockData'
import { notifyTournamentsUpdate } from '@/hooks/useTournaments'
import type { TournamentFormData } from '@/types'

interface Step {
  id: number
  title: string
  description: string
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Основная информация',
    description: 'Название, дата и место проведения'
  },
  {
    id: 2,
    title: 'Детали турнира',
    description: 'Бай-ин, структура и правила'
  },
  {
    id: 3,
    title: 'Подтверждение',
    description: 'Проверьте данные перед сохранением'
  }
]

function AddTournamentContent() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  
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

  const handleInputChange = (field: keyof TournamentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Очистка ошибки при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleOCRDataExtracted = (ocrData: Partial<TournamentFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...ocrData,
      // Сохраняем уже введенные данные, если OCR не смог их определить
      name: ocrData.name || prev.name,
      date: ocrData.date || prev.date,
      venue: ocrData.venue || prev.venue,
      buyin: ocrData.buyin || prev.buyin,
      tournamentType: ocrData.tournamentType || prev.tournamentType,
      structure: ocrData.structure || prev.structure,
      participants: ocrData.participants || prev.participants,
      prizePool: ocrData.prizePool || prev.prizePool,
      blindLevels: ocrData.blindLevels || prev.blindLevels,
      startingStack: ocrData.startingStack || prev.startingStack,
      notes: ocrData.notes || prev.notes
    }))
    
    // Очищаем ошибки для заполненных полей
    const newErrors = { ...errors }
    Object.keys(ocrData).forEach(key => {
      if (ocrData[key as keyof TournamentFormData]) {
        delete newErrors[key]
      }
    })
    setErrors(newErrors)
    
    addToast({
      type: 'success',
      message: 'Данные из билета применены к форме!'
    })
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Название турнира обязательно'
      }
      if (!formData.date) {
        newErrors.date = 'Дата турнира обязательна'
      }
      if (!formData.venue?.trim()) {
        newErrors.venue = 'Место проведения обязательно'
      }
    }

    if (step === 2) {
      if (!formData.buyin || formData.buyin <= 0) {
        newErrors.buyin = 'Бай-ин должен быть больше 0'
      }
      if (!formData.tournamentType) {
        newErrors.tournamentType = 'Выберите тип турнира'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }


  const handleSubmit = async () => {
    if (!validateStep(2)) return

    setIsLoading(true)
    
    try {
      // Симуляция сохранения турнира
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Создаем новый турнир
      const newTournament = addTournament({
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
      
      addToast({
        type: 'success',
        message: `Турнир "${newTournament.name}" успешно добавлен!`
      })
      
      // Уведомляем другие компоненты об обновлении
      notifyTournamentsUpdate()
      
      router.push('/tournaments')
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Ошибка при сохранении турнира'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🎰</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Основная информация
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Введите базовые данные о турнире
        </p>
      </div>

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
          label="Количество участников"
          placeholder="150"
          value={formData.participants || ''}
          onChange={(e) => handleInputChange('participants', e.target.value ? parseInt(e.target.value) : undefined)}
          helperText="Оставьте пустым, если неизвестно"
        />
      </div>

      {/* OCR Photo Upload */}
      <TicketUpload onDataExtracted={handleOCRDataExtracted} />
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚙️</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Детали турнира
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Укажите структуру и правила турнира
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          error={errors.tournamentType}
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
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Подтверждение
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Проверьте данные перед сохранением
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Данные турнира</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Название</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formData.name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Дата</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formData.date ? new Date(formData.date).toLocaleString('ru-RU') : '—'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Место</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formData.venue || '—'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Бай-ин</label>
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                ${formData.buyin?.toFixed(2) || '0.00'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Тип</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {tournamentTypeOptions.find(opt => opt.value === formData.tournamentType)?.label}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Участники</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formData.participants || '—'}
              </p>
            </div>
          </div>

          {formData.notes && (
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Заметки</label>
              <p className="text-gray-900 dark:text-white mt-1">{formData.notes}</p>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Главная', href: '/' },
            { label: 'Турниры', href: '/tournaments' },
            { label: 'Добавить турнир' }
          ]} 
          className="mb-6"
        />

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step.id <= currentStep 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}>
                  {step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 transition-colors ${
                    step.id < currentStep ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {steps[currentStep - 1].title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {steps[currentStep - 1].description}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            ← Назад
          </Button>
          
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/tournaments')}
            >
              Отмена
            </Button>
            
            {currentStep < steps.length ? (
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              >
                Далее →
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={isLoading}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              >
                {isLoading ? 'Сохраняем...' : 'Сохранить турнир'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AddTournamentPage() {
  return (
    <ProtectedRoute>
      <AddTournamentContent />
    </ProtectedRoute>
  )
}
