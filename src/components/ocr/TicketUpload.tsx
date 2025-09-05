'use client'

import React, { useState, useRef } from 'react'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'
import { processTicketImage, validateOCRData, preprocessImage } from '@/services/ocrService'
import type { TournamentFormData } from '@/types'
import { cn } from '@/lib/utils'

interface TicketUploadProps {
  onDataExtracted: (data: Partial<TournamentFormData>) => void
  className?: string
}

interface UploadState {
  isProcessing: boolean
  progress: number
  currentStep: string
  uploadedFile: File | null
  previewUrl: string | null
  extractedData: Partial<TournamentFormData> | null
  confidence: number | null
}

export default function TicketUpload({ onDataExtracted, className }: TicketUploadProps) {
  const { addToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [state, setState] = useState<UploadState>({
    isProcessing: false,
    progress: 0,
    currentStep: '',
    uploadedFile: null,
    previewUrl: null,
    extractedData: null,
    confidence: null
  })
  
  const [isDragOver, setIsDragOver] = useState(false)

  const updateProgress = (progress: number, step: string) => {
    setState(prev => ({ ...prev, progress, currentStep: step }))
  }

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      addToast({
        type: 'error',
        message: 'Пожалуйста, выберите изображение'
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      addToast({
        type: 'error',
        message: 'Размер файла не должен превышать 10MB'
      })
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setState(prev => ({
      ...prev,
      uploadedFile: file,
      previewUrl,
      extractedData: null,
      confidence: null
    }))
  }

  const processImage = async () => {
    if (!state.uploadedFile) return

    setState(prev => ({ ...prev, isProcessing: true, progress: 0 }))

    try {
      // Шаг 1: Предобработка изображения
      updateProgress(20, 'Подготовка изображения...')
      const preprocessedFile = await preprocessImage(state.uploadedFile)
      
      // Шаг 2: OCR обработка
      updateProgress(40, 'Распознавание текста...')
      const ocrResult = await processTicketImage(preprocessedFile)
      
      if (!ocrResult.success) {
        throw new Error(ocrResult.error || 'Ошибка при обработке изображения')
      }

      // Шаг 3: Валидация данных
      updateProgress(80, 'Проверка данных...')
      const validation = validateOCRData(ocrResult.data!)
      
      // Шаг 4: Завершение
      updateProgress(100, 'Готово!')
      
      setState(prev => ({
        ...prev,
        extractedData: ocrResult.data!,
        confidence: ocrResult.confidence!,
        isProcessing: false
      }))

      // Показываем результат пользователю
      if (validation.warnings.length > 0) {
        addToast({
          type: 'warning',
          message: `Данные извлечены с предупреждениями: ${validation.warnings.join(', ')}`
        })
      } else {
        addToast({
          type: 'success',
          message: `Данные успешно извлечены (точность: ${Math.round(ocrResult.confidence! * 100)}%)`
        })
      }

      if (validation.errors.length > 0) {
        addToast({
          type: 'error',
          message: `Ошибки: ${validation.errors.join(', ')}`
        })
      }

    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }))
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      })
    }
  }

  const applyExtractedData = () => {
    if (state.extractedData) {
      onDataExtracted(state.extractedData)
      addToast({
        type: 'success',
        message: 'Данные применены к форме!'
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const resetUpload = () => {
    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl)
    }
    setState({
      isProcessing: false,
      progress: 0,
      currentStep: '',
      uploadedFile: null,
      previewUrl: null,
      extractedData: null,
      confidence: null
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Upload Area */}
      {!state.uploadedFile && (
        <Card 
          className={cn(
            'border-2 border-dashed transition-all duration-200 cursor-pointer',
            isDragOver 
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Загрузите фото билета турнира
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Перетащите изображение билета сюда или нажмите для выбора файла. 
                Мы автоматически извлечем данные турнира.
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                <span>📱 JPG, PNG</span>
                <span>•</span>
                <span>📏 До 10MB</span>
                <span>•</span>
                <span>🤖 Авто-распознавание</span>
              </div>
              <Button variant="outline" className="mt-4">
                Выбрать файл
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Preview */}
      {state.uploadedFile && state.previewUrl && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Предпросмотр билета</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={resetUpload}
                  disabled={state.isProcessing}
                >
                  ✕ Удалить
                </Button>
              </div>
              
              <div className="relative">
                <img 
                  src={state.previewUrl} 
                  alt="Tournament ticket" 
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                />
                
                {/* Processing Overlay */}
                {state.isProcessing && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center min-w-[200px]">
                      <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        {state.currentStep}
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${state.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {state.progress}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center space-x-4">
                {!state.extractedData && !state.isProcessing && (
                  <Button 
                    onClick={processImage}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                  >
                    🤖 Распознать данные
                  </Button>
                )}
                
                {state.extractedData && (
                  <Button 
                    onClick={applyExtractedData}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    ✅ Применить данные
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extracted Data Preview */}
      {state.extractedData && (
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                  🎯 Извлеченные данные
                </h3>
                {state.confidence && (
                  <span className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    state.confidence >= 0.9 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : state.confidence >= 0.7
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  )}>
                    Точность: {Math.round(state.confidence * 100)}%
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                {state.extractedData.name && (
                  <div>
                    <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Название турнира
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {state.extractedData.name}
                    </p>
                  </div>
                )}
                
                {state.extractedData.venue && (
                  <div>
                    <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Место проведения
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {state.extractedData.venue}
                    </p>
                  </div>
                )}
                
                {state.extractedData.buyin && (
                  <div>
                    <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Бай-ин
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      ${state.extractedData.buyin}
                    </p>
                  </div>
                )}
                
                {state.extractedData.date && (
                  <div>
                    <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Дата и время
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {new Date(state.extractedData.date).toLocaleString('ru-RU')}
                    </p>
                  </div>
                )}
                
                {state.extractedData.startingStack && (
                  <div>
                    <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Стартовый стек
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {state.extractedData.startingStack.toLocaleString()} фишек
                    </p>
                  </div>
                )}
                
                {state.extractedData.tournamentType && (
                  <div>
                    <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Тип турнира
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {state.extractedData.tournamentType}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={applyExtractedData}
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                >
                  ✅ Применить к форме
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  )
}
