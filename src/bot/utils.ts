/**
 * Утилиты для Telegram бота
 */

import { BotContext } from './index'

/**
 * Форматирование валюты
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'RUB': '₽'
  }
  
  const symbol = symbols[currency] || '$'
  return `${symbol}${amount.toLocaleString()}`
}

/**
 * Форматирование процентов
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

/**
 * Форматирование даты для Telegram
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  
  return dateObj.toLocaleDateString('ru-RU', { ...defaultOptions, ...options })
}

/**
 * Форматирование времени до события
 */
export function formatTimeUntil(date: string | Date): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = targetDate.getTime() - now.getTime()
  
  if (diffMs < 0) {
    return 'Прошло'
  }
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (diffDays > 0) {
    return `через ${diffDays} дн. ${diffHours} ч.`
  } else if (diffHours > 0) {
    return `через ${diffHours} ч. ${diffMinutes} мин.`
  } else {
    return `через ${diffMinutes} мин.`
  }
}

/**
 * Создание клавиатуры с кнопками
 */
export function createInlineKeyboard(buttons: Array<Array<{ text: string; data: string }>>): any {
  return {
    inline_keyboard: buttons.map(row => 
      row.map(button => ({
        text: button.text,
        callback_data: button.data
      }))
    )
  }
}

/**
 * Создание клавиатуры для выбора из списка
 */
export function createSelectionKeyboard<T>(
  items: T[],
  getLabel: (item: T) => string,
  getValue: (item: T) => string,
  prefix: string = 'select',
  maxPerRow: number = 1
): any {
  const buttons = []
  
  for (let i = 0; i < items.length; i += maxPerRow) {
    const row = items.slice(i, i + maxPerRow).map(item => ({
      text: getLabel(item),
      callback_data: `${prefix}:${getValue(item)}`
    }))
    buttons.push(row)
  }
  
  return { inline_keyboard: buttons }
}

/**
 * Экранирование специальных символов для Markdown
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')
}

/**
 * Получение информации о пользователе
 */
export function getUserInfo(ctx: BotContext): {
  id: string
  username?: string
  firstName?: string
  lastName?: string
  fullName: string
} {
  const user = ctx.from
  
  if (!user) {
    return {
      id: 'unknown',
      fullName: 'Неизвестный пользователь'
    }
  }
  
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(' ') || user.username || `User ${user.id}`
  
  return {
    id: user.id.toString(),
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    fullName
  }
}

/**
 * Проверка прав доступа пользователя
 */
export function checkUserAccess(ctx: BotContext, allowedUsers?: string[]): boolean {
  if (!allowedUsers || allowedUsers.length === 0) {
    return true // Доступ для всех, если список не задан
  }
  
  const userId = ctx.from?.id.toString()
  const username = ctx.from?.username
  
  return !!(userId && allowedUsers.includes(userId)) || 
         !!(username && allowedUsers.includes(`@${username}`))
}

/**
 * Логирование действий пользователя
 */
export function logUserAction(ctx: BotContext, action: string, details?: any) {
  const user = getUserInfo(ctx)
  const timestamp = new Date().toISOString()
  
  console.log(`[Bot Action] ${timestamp} - User: ${user.fullName} (${user.id}) - Action: ${action}`, 
    details ? JSON.stringify(details) : '')
}

/**
 * Создание прогресс-бара
 */
export function createProgressBar(current: number, total: number, length: number = 10): string {
  const percentage = Math.min(current / total, 1)
  const filled = Math.round(percentage * length)
  const empty = length - filled
  
  const filledChar = '█'
  const emptyChar = '░'
  
  return filledChar.repeat(filled) + emptyChar.repeat(empty)
}

/**
 * Генерация случайного ID
 */
export function generateId(prefix: string = '', length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = prefix
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

/**
 * Валидация данных турнира
 */
export function validateTournamentData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Название турнира не может быть пустым')
  }
  
  if (!data.date || isNaN(new Date(data.date).getTime())) {
    errors.push('Некорректная дата турнира')
  }
  
  if (!data.buyin || isNaN(parseFloat(data.buyin)) || parseFloat(data.buyin) < 0) {
    errors.push('Бай-ин должен быть положительным числом')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Валидация результата турнира
 */
export function validateTournamentResult(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.position || isNaN(parseInt(data.position)) || parseInt(data.position) < 1) {
    errors.push('Место должно быть положительным числом')
  }
  
  if (data.payout !== undefined && (isNaN(parseFloat(data.payout)) || parseFloat(data.payout) < 0)) {
    errors.push('Выигрыш должен быть неотрицательным числом')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Парсинг команды с параметрами
 */
export function parseCommand(text: string): { command: string; args: string[] } {
  const parts = text.trim().split(/\s+/)
  const command = parts[0].toLowerCase()
  const args = parts.slice(1)
  
  return { command, args }
}

/**
 * Создание сообщения об ошибке
 */
export function createErrorMessage(error: string, suggestion?: string): string {
  let message = `❌ ${error}`
  
  if (suggestion) {
    message += `\n\n💡 ${suggestion}`
  }
  
  return message
}

/**
 * Создание сообщения об успехе
 */
export function createSuccessMessage(message: string, details?: string): string {
  let result = `✅ ${message}`
  
  if (details) {
    result += `\n\n${details}`
  }
  
  return result
}

/**
 * Ограничение длины текста
 */
export function truncateText(text: string, maxLength: number = 4096): string {
  if (text.length <= maxLength) {
    return text
  }
  
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Создание меню с пагинацией
 */
export function createPaginatedMenu<T>(
  items: T[],
  page: number,
  pageSize: number,
  getLabel: (item: T) => string,
  getValue: (item: T) => string,
  prefix: string = 'page'
): { keyboard: any; hasNext: boolean; hasPrev: boolean } {
  const startIndex = page * pageSize
  const endIndex = Math.min(startIndex + pageSize, items.length)
  const pageItems = items.slice(startIndex, endIndex)
  
  const buttons = pageItems.map(item => [{
    text: getLabel(item),
    callback_data: getValue(item)
  }])
  
  // Добавляем кнопки навигации
  const navButtons = []
  if (page > 0) {
    navButtons.push({
      text: '◀️ Назад',
      callback_data: `${prefix}:${page - 1}`
    })
  }
  
  if (endIndex < items.length) {
    navButtons.push({
      text: 'Далее ▶️',
      callback_data: `${prefix}:${page + 1}`
    })
  }
  
  if (navButtons.length > 0) {
    buttons.push(navButtons)
  }
  
  return {
    keyboard: { inline_keyboard: buttons },
    hasNext: endIndex < items.length,
    hasPrev: page > 0
  }
}
