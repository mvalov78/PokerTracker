'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface CalculatorResult {
  totalInvestment: number
  totalWinnings: number
  profit: number
  roi: number
  breakEvenWinRate: number
}

export default function ROICalculator() {
  const [buyin, setBuyin] = useState<number>(100)
  const [tournaments, setTournaments] = useState<number>(10)
  const [winnings, setWinnings] = useState<number>(1200)
  const [result, setResult] = useState<CalculatorResult | null>(null)

  const calculateROI = () => {
    const totalInvestment = buyin * tournaments
    const totalWinnings = winnings
    const profit = totalWinnings - totalInvestment
    const roi = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0
    const breakEvenWinRate = totalInvestment > 0 ? (totalInvestment / totalWinnings) * 100 : 0

    setResult({
      totalInvestment,
      totalWinnings,
      profit,
      roi,
      breakEvenWinRate: breakEvenWinRate > 100 ? 100 : breakEvenWinRate
    })
  }

  const reset = () => {
    setBuyin(100)
    setTournaments(10)
    setWinnings(1200)
    setResult(null)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🧮</span>
          <span>ROI Калькулятор</span>
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Рассчитайте рентабельность инвестиций в турниры
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="number"
            label="Бай-ин ($)"
            placeholder="100"
            value={buyin || ''}
            onChange={(e) => setBuyin(parseFloat(e.target.value) || 0)}
          />
          
          <Input
            type="number"
            label="Количество турниров"
            placeholder="10"
            value={tournaments || ''}
            onChange={(e) => setTournaments(parseInt(e.target.value) || 0)}
          />
          
          <Input
            type="number"
            step="0.01"
            label="Общий выигрыш ($)"
            placeholder="1200"
            value={winnings || ''}
            onChange={(e) => setWinnings(parseFloat(e.target.value) || 0)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Button 
            onClick={calculateROI}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600"
          >
            Рассчитать ROI
          </Button>
          <Button 
            variant="outline" 
            onClick={reset}
          >
            Сброс
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 Результаты расчета
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Общие инвестиции
                  </div>
                  <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(result.totalInvestment)}
                  </div>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">
                    Общий выигрыш
                  </div>
                  <div className="text-xl font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(result.totalWinnings)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${
                  result.profit >= 0 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className={`text-sm font-medium ${
                    result.profit >= 0 
                      ? 'text-emerald-700 dark:text-emerald-300' 
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    Прибыль/Убыток
                  </div>
                  <div className={`text-xl font-bold ${
                    result.profit >= 0 
                      ? 'text-emerald-900 dark:text-emerald-100' 
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    {result.profit >= 0 ? '+' : ''}{formatCurrency(result.profit)}
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${
                  result.roi >= 0 
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' 
                    : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                }`}>
                  <div className={`text-sm font-medium ${
                    result.roi >= 0 
                      ? 'text-purple-700 dark:text-purple-300' 
                      : 'text-orange-700 dark:text-orange-300'
                  }`}>
                    ROI (Return on Investment)
                  </div>
                  <div className={`text-xl font-bold ${
                    result.roi >= 0 
                      ? 'text-purple-900 dark:text-purple-100' 
                      : 'text-orange-900 dark:text-orange-100'
                  }`}>
                    {result.roi >= 0 ? '+' : ''}{formatPercentage(result.roi)}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Insights */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                💡 Анализ результатов
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {result.roi > 20 && (
                  <p>✅ Отличный ROI! Вы показываете высокую прибыльность.</p>
                )}
                {result.roi >= 0 && result.roi <= 20 && (
                  <p>👍 Хороший ROI. Вы играете в плюс.</p>
                )}
                {result.roi < 0 && result.roi >= -20 && (
                  <p>⚠️ Небольшой убыток. Стоит пересмотреть стратегию.</p>
                )}
                {result.roi < -20 && (
                  <p>🚨 Значительный убыток. Рекомендуется серьезный анализ игры.</p>
                )}
                <p>
                  💰 Средний результат на турнир: {formatCurrency(result.profit / tournaments)}
                </p>
                <p>
                  🎯 Для безубыточности нужно выигрывать минимум {formatCurrency(result.totalInvestment)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
