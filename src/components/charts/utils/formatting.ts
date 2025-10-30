/**
 * Utilities for formatting chart data and labels
 */

import { formatCurrency, formatPercentage } from '@/lib/utils'

/**
 * Format tooltip value based on data type
 */
export function formatTooltipValue(value: number, type: string): [string, string] {
  switch (type) {
    case 'profit':
      return [formatCurrency(value, 'USD', 2), 'Прибыль']
    case 'cumulative':
      return [formatCurrency(value, 'USD', 2), 'Накопительная прибыль']
    case 'roi':
      return [formatPercentage(value, 2), 'ROI']
    case 'tournaments':
      return [value.toString(), 'Турниров']
    case 'value':
      return [value.toString(), 'Значение']
    default:
      return [value.toString(), type]
  }
}

/**
 * Format date string for chart labels
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', { 
    day: '2-digit', 
    month: '2-digit' 
  })
}

/**
 * Get color based on ROI value
 */
export function getRoiColor(roi: number): string {
  if (roi > 20) {return '#10b981'} // Зеленый для отличного ROI
  if (roi > 0) {return '#f59e0b'}  // Желтый для положительного ROI
  return '#ef4444'                 // Красный для отрицательного ROI
}

/**
 * Get default tooltip styles
 */
export function getDefaultTooltipStyles() {
  return {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    border: 'none',
    borderRadius: '8px',
    color: 'white'
  }
}
