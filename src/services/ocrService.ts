import type { TournamentFormData } from '@/types'

export interface OCRResult {
  success: boolean
  data?: Partial<TournamentFormData>
  error?: string
  confidence?: number
}

// Мок данные для различных типов билетов
const mockTicketPatterns = [
  {
    // Паттерн для RPF билетов (как в примере)
    pattern: /RPF|RUSSIAN POKER|SOCHI|CASINO/i,
    data: {
      name: 'RUSSIAN POKER OPEN Day 1',
      venue: 'Casino Sochi 2025',
      buyin: 275,
      startingStack: 25000,
      tournamentType: 'freezeout',
      structure: 'NL Hold\'em',
    }
  },
  {
    // Паттерн для PokerStars билетов
    pattern: /POKERSTARS|STARS|EPT|WSOP/i,
    data: {
      name: 'PokerStars Sunday Million',
      venue: 'PokerStars Online',
      buyin: 109,
      startingStack: 10000,
      tournamentType: 'freezeout',
      structure: 'NL Hold\'em',
    }
  },
  {
    // Паттерн для локальных казино
    pattern: /CASINO|POKER CLUB|LIVE/i,
    data: {
      name: 'Weekly Tournament',
      venue: 'Local Casino',
      buyin: 100,
      startingStack: 20000,
      tournamentType: 'rebuy',
      structure: 'NL Hold\'em',
    }
  }
]

// Функция для извлечения данных из текста билета
function extractTournamentData(text: string): Partial<TournamentFormData> {
  const data: Partial<TournamentFormData> = {}
  
  // Извлечение названия турнира
  const eventMatch = text.match(/EVENT[#:\s]*(\d+)?\s*([^\\n]+)/i)
  if (eventMatch) {
    data.name = eventMatch[2]?.trim()
  }
  
  // Извлечение даты
  const dateMatches = [
    text.match(/(\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{4})/),
    text.match(/(\d{4}[\.\-\/]\d{1,2}[\.\-\/]\d{1,2})/),
    text.match(/DATE[:\s]*(\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{4})/i)
  ]
  
  for (const match of dateMatches) {
    if (match) {
      const dateStr = match[1].replace(/\./g, '-').replace(/\//g, '-')
      const [day, month, year] = dateStr.split('-')
      if (year && month && day) {
        data.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T18:00`
        break
      }
    }
  }
  
  // Извлечение места проведения
  const venueMatches = [
    text.match(/CASINO\s+([^\\n]+)/i),
    text.match(/([A-Z\s]+CASINO[A-Z\s]*)/i),
    text.match(/VENUE[:\s]*([^\\n]+)/i)
  ]
  
  for (const match of venueMatches) {
    if (match) {
      data.venue = match[1]?.trim()
      break
    }
  }
  
  // Извлечение бай-ина
  const buyinMatches = [
    text.match(/BUYIN[:\s]*(\d+)/i),
    text.match(/AMOUNT[:\s]*(\d+)/i),
    text.match(/BUY[\-\s]*IN[:\s]*(\d+)/i)
  ]
  
  for (const match of buyinMatches) {
    if (match) {
      data.buyin = parseInt(match[1])
      break
    }
  }
  
  // Извлечение fee и добавление к бай-ину
  const feeMatch = text.match(/FEE[:\s]*(\d+)/i)
  if (feeMatch && data.buyin) {
    data.buyin += parseInt(feeMatch[1])
  }
  
  // Извлечение стартового стека
  const chipsMatch = text.match(/CHIPS[:\s]*(\d+)/i)
  if (chipsMatch) {
    data.startingStack = parseInt(chipsMatch[1])
  }
  
  // Определение типа турнира по названию
  const nameText = data.name?.toLowerCase() || ''
  if (nameText.includes('rebuy')) {
    data.tournamentType = 'rebuy'
  } else if (nameText.includes('bounty')) {
    data.tournamentType = 'bounty'
  } else if (nameText.includes('satellite')) {
    data.tournamentType = 'satellite'
  } else {
    data.tournamentType = 'freezeout'
  }
  
  // Установка структуры по умолчанию
  if (!data.structure) {
    data.structure = 'NL Hold\'em'
  }
  
  return data
}

// Мок функция OCR с симуляцией обработки
export async function processTicketImage(file: File): Promise<OCRResult> {
  return new Promise((resolve) => {
    // Симуляция времени обработки
    setTimeout(() => {
      try {
        // Мок извлечения текста из изображения
        // В реальном приложении здесь был бы вызов Tesseract.js или Google Cloud Vision API
        const mockExtractedText = `
          RPF SUMMER18-31 AUGUST 2025
          CASINO SOCHI 2025
          
          EVENT#8 RUSSIAN POKER OPEN Day 1
          AMOUNT: 275    CHIPS: 25000
          BUYIN: 250    FEE: 25    KO: 0
          
          Sales time: 21.08.2025 17:41:06
          
          FIRSTNAME: VALOV
          LASTNAME: MAKSIM
          COUNTRY: Russia
          ID: 149074
          
          TICKET NO.    TABLE/SEAT
          187    18  10
          
          DATE: 21.08.2025
          Sochi Casino Poker
        `
        
        // Извлекаем данные из текста
        const extractedData = extractTournamentData(mockExtractedText)
        
        // Проверяем паттерны для более точного определения
        let bestMatch = null
        let highestConfidence = 0
        
        for (const pattern of mockTicketPatterns) {
          if (pattern.pattern.test(mockExtractedText)) {
            const confidence = 0.85 + Math.random() * 0.1 // 85-95%
            if (confidence > highestConfidence) {
              highestConfidence = confidence
              bestMatch = pattern
            }
          }
        }
        
        // Объединяем извлеченные данные с паттерном
        const finalData = bestMatch 
          ? { ...bestMatch.data, ...extractedData }
          : extractedData
        
        // Добавляем текущую дату если не извлечена
        if (!finalData.date) {
          const now = new Date()
          finalData.date = now.toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM
        }
        
        resolve({
          success: true,
          data: finalData,
          confidence: highestConfidence || 0.8
        })
        
      } catch (error) {
        resolve({
          success: false,
          error: 'Ошибка при обработке изображения'
        })
      }
    }, 2000 + Math.random() * 1000) // 2-3 секунды
  })
}

// Функция для валидации извлеченных данных
export function validateOCRData(data: Partial<TournamentFormData>): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Обязательные поля
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Не удалось определить название турнира')
  }
  
  if (!data.buyin || data.buyin <= 0) {
    errors.push('Не удалось определить бай-ин')
  }
  
  if (!data.date) {
    errors.push('Не удалось определить дату турнира')
  }
  
  // Предупреждения
  if (!data.venue || data.venue.trim().length === 0) {
    warnings.push('Место проведения не определено')
  }
  
  if (!data.startingStack || data.startingStack <= 0) {
    warnings.push('Стартовый стек не определен')
  }
  
  if (data.buyin && (data.buyin < 1 || data.buyin > 100000)) {
    warnings.push('Необычный размер бай-ина')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Функция для улучшения качества изображения перед OCR
export function preprocessImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    // Мок предобработки изображения
    // В реальном приложении здесь была бы обработка через Canvas API
    setTimeout(() => {
      resolve(file)
    }, 500)
  })
}

// Типы для конфигурации OCR
export interface OCRConfig {
  language: string
  confidence: number
  preprocessing: boolean
  autoRotate: boolean
}

export const defaultOCRConfig: OCRConfig = {
  language: 'eng+rus',
  confidence: 0.7,
  preprocessing: true,
  autoRotate: true
}
