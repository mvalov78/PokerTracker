'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { mockBankrollSettings } from '@/data/mockData'
import type { BankrollSettings } from '@/types'

interface BankrollSettingsProps {
  onClose: () => void
}

export default function BankrollSettingsModal({ onClose }: BankrollSettingsProps) {
  const { addToast } = useToast()
  const [settings, setSettings] = useState<BankrollSettings>(mockBankrollSettings)
  const [isLoading, setIsLoading] = useState(false)

  const handleSettingChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof BankrollSettings],
          [child]: value
        }
      }))
    } else {
      setSettings(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      // Симуляция сохранения настроек
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      addToast({
        type: 'success',
        message: 'Настройки банкролл-менеджмента сохранены!'
      })
      
      onClose()
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Ошибка при сохранении настроек'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRecommendedBuyin = () => {
    const maxBuyin = (settings.initialBankroll * settings.riskManagement.maxBuyinPercentage) / 100
    return maxBuyin
  }

  const getRiskLevel = () => {
    if (settings.riskManagement.maxBuyinPercentage <= 2) return { level: 'Очень низкий', color: 'text-green-600' }
    if (settings.riskManagement.maxBuyinPercentage <= 5) return { level: 'Низкий', color: 'text-emerald-600' }
    if (settings.riskManagement.maxBuyinPercentage <= 10) return { level: 'Средний', color: 'text-yellow-600' }
    if (settings.riskManagement.maxBuyinPercentage <= 20) return { level: 'Высокий', color: 'text-orange-600' }
    return { level: 'Очень высокий', color: 'text-red-600' }
  }

  const riskLevel = getRiskLevel()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>⚙️</span>
            <span>Настройки банкролл-менеджмента</span>
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Настройте параметры управления рисками и цели
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Basic Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Основные настройки
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                type="number"
                step="0.01"
                label="Начальный банкролл ($)"
                value={settings.initialBankroll || ''}
                onChange={(e) => handleSettingChange('initialBankroll', parseFloat(e.target.value) || 0)}
              />
              
              <Input
                type="number"
                step="0.01"
                label="Целевой банкролл ($)"
                value={settings.goals.targetBankroll || ''}
                onChange={(e) => handleSettingChange('goals.targetBankroll', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Risk Management */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Управление рисками
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Максимальный процент банкролла на турнир
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${riskLevel.color}`}>
                      {riskLevel.level}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({formatPercentage(settings.riskManagement.maxBuyinPercentage)})
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="0.5"
                  value={settings.riskManagement.maxBuyinPercentage}
                  onChange={(e) => handleSettingChange('riskManagement.maxBuyinPercentage', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1%</span>
                  <span>25%</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Рекомендуемый максимальный бай-ин: <strong>{formatCurrency(getRecommendedBuyin())}</strong>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Стоп-лосс (% от начального банкролла)
                </label>
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="5"
                  value={settings.riskManagement.stopLossPercentage}
                  onChange={(e) => handleSettingChange('riskManagement.stopLossPercentage', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10%</span>
                  <span>80%</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Остановиться при банкролле: <strong>{formatCurrency(settings.initialBankroll * (settings.riskManagement.stopLossPercentage / 100))}</strong>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="conservativeMode"
                  checked={settings.riskManagement.conservativeMode}
                  onChange={(e) => handleSettingChange('riskManagement.conservativeMode', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="conservativeMode" className="text-sm font-medium text-gray-900 dark:text-white">
                  Консервативный режим управления
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                В консервативном режиме лимиты автоматически снижаются при потерях
              </p>
            </div>
          </div>

          {/* Goals */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Цели и планы
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                type="number"
                step="0.01"
                label="Месячная цель по прибыли ($)"
                value={settings.goals.monthlyProfitTarget || ''}
                onChange={(e) => handleSettingChange('goals.monthlyProfitTarget', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Alerts */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Уведомления и предупреждения
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="lowBankrollWarning"
                  checked={settings.alerts.lowBankrollWarning}
                  onChange={(e) => handleSettingChange('alerts.lowBankrollWarning', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="lowBankrollWarning" className="text-sm font-medium text-gray-900 dark:text-white">
                  Предупреждение при низком банкролле
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="highRiskTournament"
                  checked={settings.alerts.highRiskTournament}
                  onChange={(e) => handleSettingChange('alerts.highRiskTournament', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="highRiskTournament" className="text-sm font-medium text-gray-900 dark:text-white">
                  Предупреждение при рискованных турнирах
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="profitMilestones"
                  checked={settings.alerts.profitMilestones}
                  onChange={(e) => handleSettingChange('alerts.profitMilestones', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="profitMilestones" className="text-sm font-medium text-gray-900 dark:text-white">
                  Уведомления о достижении целей
                </label>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              💡 Рекомендации по банкролл-менеджменту
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p>• Для турниров рекомендуется не более 2-5% банкролла на бай-ин</p>
              <p>• В консервативном режиме используйте не более 1-2%</p>
              <p>• При проигрыше 20-30% банкролла рассмотрите снижение лимитов</p>
              <p>• Регулярно выводите часть прибыли для минимизации рисков</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleSave}
              loading={isLoading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            >
              {isLoading ? 'Сохраняем...' : 'Сохранить настройки'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
