import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Утилита для объединения классов Tailwind CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Форматирование валюты
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Форматирование процентов
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

// Форматирование даты
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  
  return new Intl.DateTimeFormat('ru-RU', { ...defaultOptions, ...options }).format(dateObj)
}

// Форматирование относительного времени
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
  
  if (diffInSeconds < 60) {return 'только что'}
  if (diffInSeconds < 3600) {return `${Math.floor(diffInSeconds / 60)} мин назад`}
  if (diffInSeconds < 86400) {return `${Math.floor(diffInSeconds / 3600)} ч назад`}
  if (diffInSeconds < 2592000) {return `${Math.floor(diffInSeconds / 86400)} дн назад`}
  
  return formatDate(dateObj, { year: 'numeric', month: 'short', day: 'numeric' })
}

// Расчет ROI
export function calculateROI(buyin: number, payout: number): number {
  if (buyin === 0) {return 0}
  return ((payout - buyin) / buyin) * 100
}

// Расчет прибыли
export function calculateProfit(buyin: number, payout: number): number {
  return payout - buyin
}

// Генерация случайного ID
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Валидация email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Дебаунс функция
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {clearTimeout(timeout)}
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle функция
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Сокращение текста
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {return text}
  return text.substring(0, maxLength) + '...'
}

// Получение инициалов из имени
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

// Получение цвета для ROI
export function getROIColor(roi: number): string {
  if (roi > 0) {return 'text-emerald-600 dark:text-emerald-400'}
  if (roi < 0) {return 'text-red-600 dark:text-red-400'}
  return 'text-gray-600 dark:text-gray-400'
}

// Получение цвета для позиции
export function getPositionColor(position: number): string {
  if (position === 1) {return 'text-yellow-600 dark:text-yellow-400'} // Золото
  if (position === 2) {return 'text-gray-600 dark:text-gray-400'} // Серебро
  if (position === 3) {return 'text-amber-600 dark:text-amber-400'} // Бронза
  if (position <= 10) {return 'text-emerald-600 dark:text-emerald-400'} // ITM
  return 'text-gray-600 dark:text-gray-400'
}

// Получение эмодзи для позиции
export function getPositionEmoji(position: number): string {
  if (position === 1) {return '🥇'}
  if (position === 2) {return '🥈'}
  if (position === 3) {return '🥉'}
  if (position <= 10) {return '💰'}
  return '❌'
}

// Форматирование номера позиции
export function formatPosition(position: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const remainder = position % 100
  const suffix = suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0]
  return `${position}${suffix}`
}

// Сортировка турниров
export function sortTournaments<T extends { date: string }>(
  tournaments: T[],
  direction: 'asc' | 'desc' = 'desc'
): T[] {
  return [...tournaments].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return direction === 'desc' ? dateB - dateA : dateA - dateB
  })
}

// Фильтрация турниров по дате
export function filterTournamentsByDateRange<T extends { date: string }>(
  tournaments: T[],
  startDate?: string,
  endDate?: string
): T[] {
  return tournaments.filter(tournament => {
    const tournamentDate = new Date(tournament.date)
    
    if (startDate && tournamentDate < new Date(startDate)) {return false}
    if (endDate && tournamentDate > new Date(endDate)) {return false}
    
    return true
  })
}

// Группировка турниров по месяцам
export function groupTournamentsByMonth<T extends { date: string }>(
  tournaments: T[]
): Record<string, T[]> {
  return tournaments.reduce((groups, tournament) => {
    const date = new Date(tournament.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!groups[monthKey]) {
      groups[monthKey] = []
    }
    
    groups[monthKey].push(tournament)
    return groups
  }, {} as Record<string, T[]>)
}

// Преобразование файла в Base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

// Проверка типа файла изображения
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

// Получение размера файла в читаемом формате
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {return '0 Bytes'}
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
