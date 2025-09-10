'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface BotSettings {
  bot_mode: string
  bot_status: string
  webhook_url: string
  polling_enabled: string
  webhook_enabled: string
  last_update_time: string
  error_count: string
  auto_restart: string
}

interface WebhookInfo {
  url: string
  has_custom_certificate: boolean
  pending_update_count: number
  last_error_date?: number
  last_error_message?: string
  max_connections?: number
  allowed_updates?: string[]
}

export default function BotManagementPage() {
  const { user, isAdmin } = useAuth()
  const [settings, setSettings] = useState<BotSettings | null>(null)
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Автоматическое определение webhook URL
  useEffect(() => {
    if (!webhookUrl && typeof window !== 'undefined') {
      const baseUrl = window.location.origin
      setWebhookUrl(`${baseUrl}/api/bot/webhook`)
    }
  }, [webhookUrl])

  // Загрузка текущих настроек
  const loadBotSettings = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/bot-mode')
      const data = await response.json()

      if (data.success) {
        setSettings(data.settings)
        setWebhookInfo(data.webhookInfo)
        
        // Если webhook URL не установлен в БД, используем текущий домен
        if (!data.settings.webhook_url && typeof window !== 'undefined') {
          const baseUrl = window.location.origin
          setWebhookUrl(`${baseUrl}/api/bot/webhook`)
        } else {
          setWebhookUrl(data.settings.webhook_url || '')
        }
        
        setLastRefresh(new Date())
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки настроек')
    } finally {
      setIsLoading(false)
    }
  }

  // Переключение режима
  const switchMode = async (mode: 'polling' | 'webhook') => {
    try {
      setIsSwitching(true)
      setError(null)

      const requestBody: any = { mode }
      if (mode === 'webhook') {
        requestBody.webhookUrl = webhookUrl
      }

      const response = await fetch('/api/admin/bot-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (data.success) {
        await loadBotSettings() // Перезагружаем настройки
        alert(`✅ ${data.message}`)
      } else {
        setError(data.error)
        alert(`❌ Ошибка: ${data.error}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка переключения режима'
      setError(errorMessage)
      alert(`❌ ${errorMessage}`)
    } finally {
      setIsSwitching(false)
    }
  }

  // Проверка webhook
  const testWebhook = async () => {
    try {
      setError(null)
      const response = await fetch(webhookUrl)
      const data = await response.json()
      
      if (data.status === 'ok') {
        alert('✅ Webhook работает корректно!\n\n' + 
              `Status: ${data.status}\n` +
              `Timestamp: ${data.timestamp}\n` +
              `Message: ${data.message}`)
      } else {
        alert('❌ Webhook не отвечает корректно')
      }
    } catch (err) {
      alert(`❌ Ошибка проверки webhook: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // Обновление настройки
  const updateSetting = async (key: string, value: string) => {
    try {
      const response = await fetch('/api/admin/bot-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settingKey: key, settingValue: value })
      })

      const data = await response.json()
      
      if (data.success) {
        await loadBotSettings()
        alert(`✅ Настройка "${key}" обновлена`)
      } else {
        alert(`❌ Ошибка обновления настройки: ${data.error}`)
      }
    } catch (err) {
      alert(`❌ Ошибка: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // Перезапуск бота
  const restartBot = async () => {
    if (!confirm('Перезапустить бота? Это может прервать текущие операции.')) {
      return
    }

    const currentMode = settings?.bot_mode as 'polling' | 'webhook'
    if (currentMode) {
      await switchMode(currentMode)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadBotSettings()
      
      // Автообновление каждые 30 секунд
      const interval = setInterval(() => {
        loadBotSettings()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Доступ запрещен</h2>
            <p className="text-gray-600">Требуются права администратора для доступа к управлению ботом.</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка настроек бота...</p>
          </div>
        </div>
      </div>
    )
  }

  const currentMode = settings?.bot_mode || 'unknown'
  const botStatus = settings?.bot_status || 'inactive'
  const isPollingMode = currentMode === 'polling'
  const isWebhookMode = currentMode === 'webhook'
  const errorCount = parseInt(settings?.error_count || '0')

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Заголовок */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 Управление Telegram ботом</h1>
              <p className="text-gray-600">Переключение между polling и webhook режимами</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Последнее обновление</div>
              <div className="text-lg font-medium">{lastRefresh.toLocaleTimeString()}</div>
              <button
                onClick={loadBotSettings}
                className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                🔄 Обновить
              </button>
            </div>
          </div>
        </div>

        {/* Текущий статус */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">📊 Текущий статус бота</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-2">
                {currentMode === 'polling' && '🔄'}
                {currentMode === 'webhook' && '🔗'}
                {currentMode === 'unknown' && '❓'}
              </div>
              <div className="text-sm text-gray-500">Режим работы</div>
              <div className={`text-lg font-bold ${isPollingMode ? 'text-blue-600' : isWebhookMode ? 'text-green-600' : 'text-gray-600'}`}>
                {currentMode === 'polling' && 'Polling'}
                {currentMode === 'webhook' && 'Webhook'}
                {currentMode === 'unknown' && 'Неизвестно'}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-2">
                {botStatus === 'active' && '✅'}
                {botStatus === 'inactive' && '⏸️'}
                {botStatus === 'error' && '❌'}
              </div>
              <div className="text-sm text-gray-500">Статус бота</div>
              <div className={`text-lg font-bold ${
                botStatus === 'active' ? 'text-green-600' : 
                botStatus === 'error' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {botStatus === 'active' && 'Активен'}
                {botStatus === 'inactive' && 'Неактивен'}
                {botStatus === 'error' && 'Ошибка'}
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-4xl mb-2 ${errorCount > 5 ? 'animate-pulse' : ''}`}>
                {errorCount > 0 ? '⚠️' : '✅'}
              </div>
              <div className="text-sm text-gray-500">Ошибки за час</div>
              <div className={`text-lg font-bold ${errorCount > 5 ? 'text-red-600' : 'text-green-600'}`}>
                {errorCount}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-2">
                {settings?.auto_restart === 'true' ? '🔄' : '⏹️'}
              </div>
              <div className="text-sm text-gray-500">Автоперезапуск</div>
              <div className={`text-lg font-bold ${settings?.auto_restart === 'true' ? 'text-green-600' : 'text-gray-600'}`}>
                {settings?.auto_restart === 'true' ? 'Включен' : 'Выключен'}
              </div>
            </div>
          </div>
        </div>

        {/* Ошибки */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600 text-xl mr-3">❌</div>
              <div>
                <div className="font-medium text-red-800">Ошибка</div>
                <div className="text-red-600">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Webhook информация */}
        {isWebhookMode && webhookInfo && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🔗 Информация о Webhook</h2>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <span className="font-medium">URL:</span>
                <code className="ml-2 bg-gray-200 px-2 py-1 rounded text-sm">{webhookInfo.url}</code>
              </div>
              <div>
                <span className="font-medium">Ожидающие обновления:</span>
                <span className="ml-2">{webhookInfo.pending_update_count}</span>
              </div>
              <div>
                <span className="font-medium">Максимум соединений:</span>
                <span className="ml-2">{webhookInfo.max_connections}</span>
              </div>
              
              {webhookInfo.last_error_date && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mt-4">
                  <div className="font-medium text-red-800">Последняя ошибка:</div>
                  <div className="text-sm text-gray-600">
                    {new Date(webhookInfo.last_error_date * 1000).toLocaleString()}
                  </div>
                  <div className="text-red-600 mt-1">{webhookInfo.last_error_message}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Переключение режимов */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Polling режим */}
          <div className={`bg-white rounded-lg shadow-lg overflow-hidden border-2 ${
            isPollingMode ? 'border-blue-500' : 'border-gray-200'
          }`}>
            <div className={`p-4 ${isPollingMode ? 'bg-blue-50' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-3xl mr-3">🔄</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Polling режим</h3>
                    <p className="text-sm text-gray-600">Для разработки и отладки</p>
                  </div>
                </div>
                {isPollingMode && (
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    ✅ Активен
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Описание:</h4>
                  <p className="text-gray-600 text-sm">
                    Бот опрашивает Telegram сервер каждые несколько секунд для получения новых сообщений.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-green-600">✅ Преимущества:</div>
                    <ul className="text-gray-600 mt-1 space-y-1">
                      <li>• Простота настройки</li>
                      <li>• Работает везде</li>
                      <li>• Не требует HTTPS</li>
                      <li>• Легкая отладка</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-red-600">❌ Недостатки:</div>
                    <ul className="text-gray-600 mt-1 space-y-1">
                      <li>• Больше ресурсов</li>
                      <li>• Задержка 1-3 сек</li>
                      <li>• Лимиты запросов</li>
                    </ul>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <button
                    onClick={() => switchMode('polling')}
                    disabled={isSwitching || isPollingMode}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isPollingMode
                        ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    } ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSwitching ? '⏳ Переключение...' : isPollingMode ? '✅ Уже активен' : '🔄 Включить Polling'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Webhook режим */}
          <div className={`bg-white rounded-lg shadow-lg overflow-hidden border-2 ${
            isWebhookMode ? 'border-green-500' : 'border-gray-200'
          }`}>
            <div className={`p-4 ${isWebhookMode ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-3xl mr-3">🔗</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Webhook режим</h3>
                    <p className="text-sm text-gray-600">Для продакшена</p>
                  </div>
                </div>
                {isWebhookMode && (
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    ✅ Активен
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Описание:</h4>
                  <p className="text-gray-600 text-sm">
                    Telegram отправляет обновления напрямую на ваш сервер через HTTPS.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-green-600">✅ Преимущества:</div>
                    <ul className="text-gray-600 mt-1 space-y-1">
                      <li>• Мгновенные ответы</li>
                      <li>• Меньше ресурсов</li>
                      <li>• Масштабируемость</li>
                      <li>• Рекомендуется</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-red-600">❌ Недостатки:</div>
                    <ul className="text-gray-600 mt-1 space-y-1">
                      <li>• Требует HTTPS</li>
                      <li>• Сложнее настройка</li>
                      <li>• Зависит от сервера</li>
                    </ul>
                  </div>
                </div>
                
                {/* Настройка Webhook URL */}
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL:
                  </label>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://your-app.vercel.app/api/bot/webhook"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                    <button
                      onClick={testWebhook}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                    >
                      🧪 Тест
                    </button>
                  </div>
                  
                  <button
                    onClick={() => switchMode('webhook')}
                    disabled={isSwitching || isWebhookMode || !webhookUrl}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isWebhookMode
                        ? 'bg-green-100 text-green-600 cursor-not-allowed'
                        : !webhookUrl
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    } ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSwitching ? '⏳ Переключение...' : isWebhookMode ? '✅ Уже активен' : '🔗 Включить Webhook'}
                  </button>
                  
                  {!webhookUrl && (
                    <p className="text-xs text-red-500 mt-2">
                      ⚠️ Введите корректный HTTPS URL для активации webhook режима
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Дополнительные настройки */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">⚙️ Дополнительные настройки</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Автоматический перезапуск</div>
                <div className="text-sm text-gray-600">Перезапускать бота при ошибках</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.auto_restart === 'true'}
                  onChange={(e) => updateSetting('auto_restart', e.target.checked.toString())}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Действия */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">🎮 Управление ботом</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={restartBot}
              disabled={isSwitching || botStatus === 'inactive'}
              className="p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-center"
            >
              <div className="text-2xl mb-2">🔄</div>
              <div className="font-medium">Перезапуск</div>
              <div className="text-xs opacity-80">Перезапустить бота</div>
            </button>
            
            <button
              onClick={() => updateSetting('error_count', '0')}
              disabled={errorCount === 0}
              className="p-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-center"
            >
              <div className="text-2xl mb-2">🧹</div>
              <div className="font-medium">Сбросить ошибки</div>
              <div className="text-xs opacity-80">Обнулить счетчик</div>
            </button>
            
            <button
              onClick={() => window.open('/api/bot/webhook', '_blank')}
              className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-center"
            >
              <div className="text-2xl mb-2">🧪</div>
              <div className="font-medium">Тест Webhook</div>
              <div className="text-xs opacity-80">Проверить endpoint</div>
            </button>
            
            <button
              onClick={loadBotSettings}
              className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-center"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium">Обновить</div>
              <div className="text-xs opacity-80">Загрузить статус</div>
            </button>
          </div>
        </div>

        {/* Справочная информация */}
        <div className="bg-blue-50 rounded-lg shadow-lg p-6 border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">💡 Справочная информация</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-blue-900 mb-2">🔄 Polling режим</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Идеально для локальной разработки</li>
                <li>• Простая настройка и отладка</li>
                <li>• Работает без HTTPS</li>
                <li>• Подходит для тестирования</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-blue-900 mb-2">🔗 Webhook режим</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Рекомендуется для продакшена</li>
                <li>• Мгновенные ответы пользователям</li>
                <li>• Оптимальная производительность</li>
                <li>• Требует HTTPS URL</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-100 rounded-lg">
            <div className="font-medium text-blue-900 mb-2">🎯 Рекомендации:</div>
            <div className="text-blue-800 text-sm space-y-1">
              <div>• <strong>Разработка:</strong> Используйте polling режим</div>
              <div>• <strong>Продакшен:</strong> Переключитесь на webhook</div>
              <div>• <strong>Отладка:</strong> Временно включите polling для диагностики</div>
              <div>• <strong>Высокая нагрузка:</strong> Webhook обеспечит лучшую производительность</div>
            </div>
          </div>
        </div>

        {/* Последняя активность */}
        {settings?.last_update_time && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">⏰ Последняя активность</h2>
            <div className="text-gray-600">
              <strong>Время:</strong> {new Date(settings.last_update_time).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              ({Math.round((Date.now() - new Date(settings.last_update_time).getTime()) / 60000)} минут назад)
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
