import {
    cleanTournamentName,
    defaultOCRConfig,
    preprocessImage,
    processTicketImage,
    validateOCRData,
} from '@/services/ocrService'

// Mock OCR API response
const mockOCRResponse = {
  ParsedResults: [{
    ParsedText: `RPC FINAL 16-21 DECEMBER 2025
CASINO SOCHI 2025

EVENT:#2 OPENER Day 1
AMOUNT: 330    CHIPS: 30000
BUYIN: 300    FEE: 30    KO: 0

Sales time: 16.12.2025 11:54:48

FIRSTNAME: VALOV
LASTNAME: MAKSIM
COUNTRY: Russia
ID: 149074

TICKET NO.    TABLE/SEAT
27    3  5

DATE: 16.12.2025`
  }],
  IsErroredOnProcessing: false,
}

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockOCRResponse),
  } as Response)
)

describe('OCR Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console.warn in tests
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('processTicketImage', () => {
    it('should process image file and return error (File not supported)', async () => {
      const mockFile = new File(['test'], 'ticket.jpg', { type: 'image/jpeg' })
      
      const result = await processTicketImage(mockFile)
      
      // File objects are not supported, only URLs
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should process image URL and return OCR result', async () => {
      const mockUrl = 'https://example.com/ticket.jpg'
      
      const result = await processTicketImage(mockUrl)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0)
      
      if (result.data) {
        expect(result.data.name).toBeDefined()
        expect(result.data.buyin).toBeDefined()
      }
    })

    it('should handle processing errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Create a mock that will cause an error (empty string)
      const result = await processTicketImage('')
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      
      consoleSpy.mockRestore()
    })

    it('should extract tournament data correctly from OCR response', async () => {
      const mockUrl = 'https://example.com/ticket.jpg'
      
      const result = await processTicketImage(mockUrl)
      
      if (result.success && result.data) {
        expect(result.data.name).toBe('OPENER')
        expect(result.data.buyin).toBe(330) // BUYIN 300 + FEE 30
        expect(result.data.startingStack).toBe(30000)
        expect(result.data.tournamentType).toBe('freezeout')
      }
    })

    it('should handle OCR API errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock failed API response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response)

      const result = await processTicketImage('https://example.com/ticket.jpg')
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      
      consoleSpy.mockRestore()
    })
  })

  describe('validateOCRData', () => {
    it('should validate complete tournament data', () => {
      const validData = {
        name: 'Test Tournament',
        buyin: 100,
        date: '2024-01-15T18:00',
        venue: 'Test Casino',
        startingStack: 20000,
      }

      const result = validateOCRData(validData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should return errors for missing required fields', () => {
      const incompleteData = {
        venue: 'Test Casino',
      }

      const result = validateOCRData(incompleteData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Не удалось определить название турнира')
      expect(result.errors).toContain('Не удалось определить бай-ин')
      expect(result.errors).toContain('Не удалось определить дату турнира')
    })

    it('should return warnings for missing optional fields', () => {
      const dataWithMissingOptional = {
        name: 'Test Tournament',
        buyin: 100,
        date: '2024-01-15T18:00',
      }

      const result = validateOCRData(dataWithMissingOptional)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Место проведения не определено')
      expect(result.warnings).toContain('Стартовый стек не определен')
    })

    it('should warn about unusual buyin amounts', () => {
      const dataWithUnusualBuyin = {
        name: 'Test Tournament',
        buyin: 150000, // Very high buyin
        date: '2024-01-15T18:00',
        venue: 'Test Casino',
      }

      const result = validateOCRData(dataWithUnusualBuyin)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Необычный размер бай-ина')
    })

    it('should handle empty or invalid values', () => {
      const invalidData = {
        name: '',
        buyin: 0,
        date: '',
        venue: '',
        startingStack: 0,
      }

      const result = validateOCRData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Не удалось определить название турнира')
      expect(result.errors).toContain('Не удалось определить бай-ин')
      expect(result.errors).toContain('Не удалось определить дату турнира')
      expect(result.warnings).toContain('Место проведения не определено')
      expect(result.warnings).toContain('Стартовый стек не определен')
    })
  })

  describe('preprocessImage', () => {
    it('should preprocess image file', async () => {
      const mockFile = new File(['test'], 'ticket.jpg', { type: 'image/jpeg' })
      
      const result = await preprocessImage(mockFile)
      
      expect(result).toBe(mockFile) // Mock implementation returns the same file
      expect(result.name).toBe('ticket.jpg')
      expect(result.type).toBe('image/jpeg')
    })

    it('should handle preprocessing with delay', async () => {
      const mockFile = new File(['test'], 'ticket.jpg', { type: 'image/jpeg' })
      const startTime = Date.now()
      
      await preprocessImage(mockFile)
      
      const endTime = Date.now()
      const processingTime = endTime - startTime
      
      // Should take at least 500ms due to mock delay
      expect(processingTime).toBeGreaterThanOrEqual(500)
    })
  })

  describe('defaultOCRConfig', () => {
    it('should have correct default configuration', () => {
      expect(defaultOCRConfig.language).toBe('eng+rus')
      expect(defaultOCRConfig.confidence).toBe(0.7)
      expect(defaultOCRConfig.preprocessing).toBe(true)
      expect(defaultOCRConfig.autoRotate).toBe(true)
    })
  })

  describe('OCR text extraction patterns', () => {
    it('should recognize RPC tournament patterns', async () => {
      const mockUrl = 'https://example.com/rpc-ticket.jpg'
      
      const result = await processTicketImage(mockUrl)
      
      if (result.success && result.data) {
        expect(result.data.name).toBeDefined()
        expect(result.confidence).toBeGreaterThan(0.8)
      }
    })

    it('should extract date correctly', async () => {
      const mockUrl = 'https://example.com/ticket.jpg'
      
      const result = await processTicketImage(mockUrl)
      
      expect(result.success).toBe(true)
      if (result.data) {
        // Date should be extracted from "DATE: 16.12.2025"
        expect(result.data.date).toContain('2025-12-16')
      }
    })

    it('should set default tournament type', async () => {
      const mockUrl = 'https://example.com/ticket.jpg'
      
      const result = await processTicketImage(mockUrl)
      
      expect(result.success).toBe(true)
      if (result.data) {
        expect(result.data.tournamentType).toBe('freezeout')
        expect(result.data.structure).toBe('NL Hold\'em')
      }
    })
  })

  describe('cleanTournamentName', () => {
    it('should remove EVENT# prefix', () => {
      expect(cleanTournamentName('#8 RUSSIAN POKER OPEN')).toBe('RUSSIAN POKER OPEN')
      expect(cleanTournamentName('EVENT#8 RUSSIAN POKER OPEN')).toBe('RUSSIAN POKER OPEN')
      expect(cleanTournamentName('EVENT #8 OPENER')).toBe('OPENER')
    })

    it('should remove Day suffix', () => {
      expect(cleanTournamentName('RUSSIAN POKER OPEN Day 1')).toBe('RUSSIAN POKER OPEN')
      expect(cleanTournamentName('RUSSIAN POKER OPEN Day 2')).toBe('RUSSIAN POKER OPEN')
      expect(cleanTournamentName('OPENER Day 1')).toBe('OPENER')
    })

    it('should remove both prefix and suffix', () => {
      expect(cleanTournamentName('#8 RUSSIAN POKER OPEN Day 1')).toBe('RUSSIAN POKER OPEN')
      expect(cleanTournamentName('EVENT#2 OPENER Day 1')).toBe('OPENER')
    })

    it('should handle empty strings', () => {
      expect(cleanTournamentName('')).toBe('')
      expect(cleanTournamentName('   ')).toBe('')
    })

    it('should normalize whitespace', () => {
      expect(cleanTournamentName('  RUSSIAN   POKER   OPEN  ')).toBe('RUSSIAN POKER OPEN')
    })
  })
})
