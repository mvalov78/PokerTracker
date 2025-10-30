/**
 * Tests for lib/utils.ts
 */

import {
    calculateProfit,
    calculateROI,
    cn,
    debounce,
    fileToBase64,
    filterTournamentsByDateRange,
    formatCurrency,
    formatDate,
    formatFileSize,
    formatPercentage,
    formatPosition,
    formatRelativeTime,
    generateId,
    getInitials,
    getPositionColor,
    getPositionEmoji,
    getROIColor,
    groupTournamentsByMonth,
    isImageFile,
    isValidEmail,
    sortTournaments,
    throttle,
    truncateText,
} from '@/lib/utils'

describe('lib/utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('should handle conditional classes', () => {
      const showHidden = false;
      const showVisible = true;
      const result = cn('base', showHidden && 'hidden', showVisible && 'visible')
      expect(result).toContain('base')
      expect(result).toContain('visible')
      expect(result).not.toContain('hidden')
    })
  })

  describe('formatCurrency', () => {
    it('should format USD by default', () => {
      expect(formatCurrency(1000)).toContain('1')
      expect(formatCurrency(1000)).toContain('000')
    })

    it('should format different currencies', () => {
      expect(formatCurrency(1000, 'EUR')).toBeTruthy()
      expect(formatCurrency(1000, 'GBP')).toBeTruthy()
    })

    it('should handle decimals', () => {
      const result = formatCurrency(1234.56, 'USD', 2)
      expect(result).toContain('1')
      expect(result).toContain('234.56')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBeTruthy()
    })
  })

  describe('formatPercentage', () => {
    it('should format percentage with default decimals', () => {
      expect(formatPercentage(25.567)).toBe('25.6%')
    })

    it('should respect decimal parameter', () => {
      expect(formatPercentage(25.567, 2)).toBe('25.57%')
      expect(formatPercentage(25.567, 0)).toBe('26%')
    })

    it('should handle negative values', () => {
      expect(formatPercentage(-15.5)).toBe('-15.5%')
    })
  })

  describe('formatDate', () => {
    it('should format date string', () => {
      const result = formatDate('2024-01-15T18:00:00Z')
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    })

    it('should format Date object', () => {
      const result = formatDate(new Date('2024-01-15T18:00:00Z'))
      expect(result).toBeTruthy()
    })

    it('should accept custom options', () => {
      const options = { year: 'numeric' as const, month: 'short' as const }
      const result = formatDate('2024-01-15T18:00:00Z', options)
      expect(result).toBeTruthy()
    })
  })

  describe('formatRelativeTime', () => {
    it('should show "только что" for recent date', () => {
      const recent = new Date(Date.now() - 30 * 1000) // 30 seconds ago
      expect(formatRelativeTime(recent)).toBe('только что')
    })

    it('should show minutes for < 1 hour', () => {
      const date = new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      expect(formatRelativeTime(date)).toContain('мин назад')
    })

    it('should show hours for < 1 day', () => {
      const date = new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
      expect(formatRelativeTime(date)).toContain('ч назад')
    })

    it('should show days for < 1 month', () => {
      const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      expect(formatRelativeTime(date)).toContain('дн назад')
    })

    it('should show formatted date for old dates', () => {
      const date = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
      const result = formatRelativeTime(date)
      expect(result).not.toContain('назад')
    })
  })

  describe('calculateROI', () => {
    it('should calculate positive ROI', () => {
      expect(calculateROI(100, 200)).toBe(100)
    })

    it('should calculate negative ROI', () => {
      expect(calculateROI(100, 50)).toBe(-50)
    })

    it('should handle zero buyin', () => {
      expect(calculateROI(0, 100)).toBe(0)
    })

    it('should handle break-even', () => {
      expect(calculateROI(100, 100)).toBe(0)
    })
  })

  describe('calculateProfit', () => {
    it('should calculate positive profit', () => {
      expect(calculateProfit(100, 250)).toBe(150)
    })

    it('should calculate negative profit', () => {
      expect(calculateProfit(100, 50)).toBe(-50)
    })

    it('should handle zero payout', () => {
      expect(calculateProfit(100, 0)).toBe(-100)
    })
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('should return string', () => {
      expect(typeof generateId()).toBe('string')
    })

    it('should have reasonable length', () => {
      const id = generateId()
      expect(id.length).toBeGreaterThan(5)
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('test+tag@example.com')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('no@domain')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('debounce', () => {
    jest.useFakeTimers()

    it('should debounce function calls', () => {
      const mockFn = jest.fn()
      const debounced = debounce(mockFn, 300)

      debounced()
      debounced()
      debounced()

      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(300)

      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments to debounced function', () => {
      const mockFn = jest.fn()
      const debounced = debounce(mockFn, 300)

      debounced('arg1', 'arg2')

      jest.advanceTimersByTime(300)

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    afterAll(() => {
      jest.useRealTimers()
    })
  })

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should throttle function calls', () => {
      const mockFn = jest.fn()
      const throttled = throttle(mockFn, 1000)

      throttled()
      throttled()
      throttled()

      expect(mockFn).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(1000)

      throttled()
      expect(mockFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('truncateText', () => {
    it('should not truncate short text', () => {
      expect(truncateText('Short', 10)).toBe('Short')
    })

    it('should truncate long text', () => {
      const long = 'This is a very long text'
      const result = truncateText(long, 10)
      // Result includes "...", so total length might be > maxLength
      expect(result).toContain('...')
      expect(result).toMatch(/^.{1,13}$/) // maxLength + 3 for "..."
    })

    it('should handle exact length', () => {
      const text = 'Exactly10!'
      expect(truncateText(text, 10)).toBe(text)
    })
  })

  describe('getInitials', () => {
    it('should get initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD')
    })

    it('should handle single name', () => {
      expect(getInitials('John')).toBe('J')
    })

    it('should limit to two initials', () => {
      expect(getInitials('John Michael Doe')).toBe('JM')
    })

    it('should capitalize initials', () => {
      expect(getInitials('john doe')).toBe('JD')
    })
  })

  describe('getROIColor', () => {
    it('should return green for positive ROI', () => {
      expect(getROIColor(25)).toContain('emerald')
    })

    it('should return red for negative ROI', () => {
      expect(getROIColor(-15)).toContain('red')
    })

    it('should return gray for zero ROI', () => {
      expect(getROIColor(0)).toContain('gray')
    })
  })

  describe('getPositionColor', () => {
    it('should return gold for 1st place', () => {
      expect(getPositionColor(1)).toContain('yellow')
    })

    it('should return silver for 2nd place', () => {
      expect(getPositionColor(2)).toContain('gray')
    })

    it('should return bronze for 3rd place', () => {
      expect(getPositionColor(3)).toContain('amber')
    })

    it('should return green for ITM (4-10)', () => {
      expect(getPositionColor(5)).toContain('emerald')
      expect(getPositionColor(10)).toContain('emerald')
    })

    it('should return gray for out of money', () => {
      expect(getPositionColor(15)).toContain('gray')
    })
  })

  describe('getPositionEmoji', () => {
    it('should return correct emojis', () => {
      expect(getPositionEmoji(1)).toBe('🥇')
      expect(getPositionEmoji(2)).toBe('🥈')
      expect(getPositionEmoji(3)).toBe('🥉')
      expect(getPositionEmoji(5)).toBe('💰')
      expect(getPositionEmoji(15)).toBe('❌')
    })
  })

  describe('formatPosition', () => {
    it('should format positions with correct suffix', () => {
      expect(formatPosition(1)).toContain('1')
      expect(formatPosition(1)).toContain('st')
      expect(formatPosition(2)).toContain('nd')
      expect(formatPosition(3)).toContain('rd')
      expect(formatPosition(4)).toContain('th')
      expect(formatPosition(21)).toContain('st')
    })
  })

  describe('sortTournaments', () => {
    const tournaments = [
      { id: '1', date: '2024-01-01T18:00:00Z', name: 'Old' },
      { id: '2', date: '2024-01-15T18:00:00Z', name: 'Middle' },
      { id: '3', date: '2024-02-01T18:00:00Z', name: 'Recent' },
    ]

    it('should sort descending by default', () => {
      const sorted = sortTournaments(tournaments)
      expect(sorted[0].name).toBe('Recent')
      expect(sorted[2].name).toBe('Old')
    })

    it('should sort ascending when specified', () => {
      const sorted = sortTournaments(tournaments, 'asc')
      expect(sorted[0].name).toBe('Old')
      expect(sorted[2].name).toBe('Recent')
    })

    it('should not mutate original array', () => {
      const original = [...tournaments]
      sortTournaments(tournaments)
      expect(tournaments).toEqual(original)
    })
  })

  describe('filterTournamentsByDateRange', () => {
    const tournaments = [
      { id: '1', date: '2024-01-01T18:00:00Z' },
      { id: '2', date: '2024-01-15T18:00:00Z' },
      { id: '3', date: '2024-02-01T18:00:00Z' },
    ]

    it('should filter by start date', () => {
      const filtered = filterTournamentsByDateRange(tournaments, '2024-01-10T00:00:00Z')
      expect(filtered).toHaveLength(2)
      expect(filtered[0].id).toBe('2')
    })

    it('should filter by end date', () => {
      const filtered = filterTournamentsByDateRange(tournaments, undefined, '2024-01-20T00:00:00Z')
      expect(filtered).toHaveLength(2)
      expect(filtered[1].id).toBe('2')
    })

    it('should filter by both dates', () => {
      const filtered = filterTournamentsByDateRange(
        tournaments,
        '2024-01-10T00:00:00Z',
        '2024-01-20T00:00:00Z'
      )
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('2')
    })

    it('should return all without filters', () => {
      const filtered = filterTournamentsByDateRange(tournaments)
      expect(filtered).toHaveLength(3)
    })
  })

  describe('groupTournamentsByMonth', () => {
    const tournaments = [
      { id: '1', date: '2024-01-05T18:00:00Z', name: 'Jan 1' },
      { id: '2', date: '2024-01-15T18:00:00Z', name: 'Jan 2' },
      { id: '3', date: '2024-02-01T18:00:00Z', name: 'Feb 1' },
    ]

    it('should group by month', () => {
      const grouped = groupTournamentsByMonth(tournaments)
      expect(grouped['2024-01']).toHaveLength(2)
      expect(grouped['2024-02']).toHaveLength(1)
    })

    it('should use correct month keys', () => {
      const grouped = groupTournamentsByMonth(tournaments)
      expect(Object.keys(grouped)).toContain('2024-01')
      expect(Object.keys(grouped)).toContain('2024-02')
    })
  })

  describe('fileToBase64', () => {
    it('should convert file to base64', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const result = await fileToBase64(file)
      expect(result).toContain('data:')
      expect(result).toContain('base64')
    })
  })

  describe('isImageFile', () => {
    it('should identify image files', () => {
      expect(isImageFile(new File([], 'test.jpg', { type: 'image/jpeg' }))).toBe(true)
      expect(isImageFile(new File([], 'test.png', { type: 'image/png' }))).toBe(true)
    })

    it('should reject non-image files', () => {
      expect(isImageFile(new File([], 'test.txt', { type: 'text/plain' }))).toBe(false)
      expect(isImageFile(new File([], 'test.pdf', { type: 'application/pdf' }))).toBe(false)
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(500)).toBe('500 Bytes')
    })

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toContain('KB')
      expect(formatFileSize(5120)).toContain('KB')
    })

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toContain('MB')
      expect(formatFileSize(5 * 1024 * 1024)).toContain('MB')
    })

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toContain('GB')
    })
  })
})






