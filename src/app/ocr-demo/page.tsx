'use client'

import { useState } from 'react'
import { useAuth, ProtectedRoute } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Breadcrumbs } from '@/components/ui/Navigation'
import TicketUpload from '@/components/ocr/TicketUpload'
import type { TournamentFormData } from '@/types'

function OCRDemoContent() {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [extractedData, setExtractedData] = useState<Partial<TournamentFormData> | null>(null)

  const handleDataExtracted = (data: Partial<TournamentFormData>) => {
    setExtractedData(data)
    addToast({
      type: 'success',
      message: 'Данные успешно извлечены из билета!'
    })
  }

  const resetDemo = () => {
    setExtractedData(null)
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Главная', href: '/' },
            { label: 'OCR Демо' }
          ]} 
          className="mb-6"
        />

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🤖 OCR Демонстрация
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Протестируйте функцию автоматического распознавания данных с билетов турниров. 
            Загрузите фото билета, и система извлечет все необходимые данные.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Загрузка изображения
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Поддержка JPG, PNG форматов до 10MB
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Распознавание текста
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Автоматическое извлечение данных турнира
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Мгновенное заполнение
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Данные готовы для создания турнира
              </p>
            </CardContent>
          </Card>
        </div>

        {/* OCR Upload Component */}
        <TicketUpload onDataExtracted={handleDataExtracted} />

        {/* Extracted Data Display */}
        {extractedData && (
          <Card className="mt-8 border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-emerald-900 dark:text-emerald-100">
                  🎯 Результат распознавания
                </CardTitle>
                <Button variant="outline" size="sm" onClick={resetDemo}>
                  🔄 Сбросить
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {extractedData.name && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Название турнира
                      </label>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <p className="text-gray-900 dark:text-white font-medium">
                          {extractedData.name}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {extractedData.venue && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Место проведения
                      </label>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <p className="text-gray-900 dark:text-white font-medium">
                          {extractedData.venue}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {extractedData.buyin && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Бай-ин
                      </label>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <p className="text-gray-900 dark:text-white font-medium text-xl">
                          ${extractedData.buyin}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {extractedData.date && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Дата и время
                      </label>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <p className="text-gray-900 dark:text-white font-medium">
                          {new Date(extractedData.date).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {extractedData.startingStack && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Стартовый стек
                      </label>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <p className="text-gray-900 dark:text-white font-medium">
                          {extractedData.startingStack.toLocaleString()} фишек
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {extractedData.tournamentType && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Тип турнира
                      </label>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <p className="text-gray-900 dark:text-white font-medium capitalize">
                          {extractedData.tournamentType}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {extractedData.structure && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Структура
                    </label>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {extractedData.structure}
                      </p>
                    </div>
                  </div>
                )}

                {/* JSON Preview */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    JSON данные для разработчиков
                  </label>
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                    <pre className="text-sm text-gray-800 dark:text-gray-200">
                      {JSON.stringify(extractedData, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📋 Инструкции по использованию</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Подготовьте изображение билета
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Сделайте четкое фото билета турнира или загрузите существующее изображение
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Загрузите изображение
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Перетащите файл в область загрузки или нажмите для выбора
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Запустите распознавание
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Нажмите кнопку "Распознать данные" и дождитесь завершения обработки
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Проверьте результаты
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Система покажет извлеченные данные с указанием точности распознавания
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function OCRDemoPage() {
  return (
    <ProtectedRoute>
      <OCRDemoContent />
    </ProtectedRoute>
  )
}
