import { UserSettingsService } from '@/services/userSettingsService'

// Используем глобальные функции управления моками
const { setMockData, setMockError, resetMocks } = global

// Сбрасываем моки перед каждым тестом
beforeEach(() => {
  resetMocks()
})

describe('UserSettingsService', () => {
  const mockDbSettings = {
    id: 'test-id',
    user_id: 'user123',
    current_venue: 'Test Casino',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  describe('getUserSettings', () => {
    it('should get user settings successfully', async () => {
      setMockData(mockDbSettings)

      const result = await UserSettingsService.getUserSettings('user123')

      expect(result).toBeTruthy()
      expect(result?.userId).toBe('user123')
      expect(result?.currentVenue).toBe('Test Casino')
    })

    it('should return null when no settings found', async () => {
      setMockData(null)

      const result = await UserSettingsService.getUserSettings('user123')

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      setMockError({ message: 'Database error' })

      const result = await UserSettingsService.getUserSettings('user123')

      expect(result).toBeNull()
    })
  })

  describe('createUserSettings', () => {
    it('should create user settings successfully', async () => {
      const mockNewSettings = {
        id: 'new-id',
        user_id: 'newuser',
        current_venue: 'New Casino',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      setMockData(mockNewSettings)

      const result = await UserSettingsService.createUserSettings('newuser', 'New Casino')

      expect(result).toBeTruthy()
      expect(result?.userId).toBe('newuser')
      expect(result?.currentVenue).toBe('New Casino')
    })

    it('should handle creation errors', async () => {
      setMockError({ message: 'Creation failed' })

      const result = await UserSettingsService.createUserSettings('user123', 'Casino')

      expect(result).toBeNull()
    })
  })

  describe('getCurrentVenue', () => {
    it('should get current venue for existing user', async () => {
      setMockData(mockDbSettings)

      const result = await UserSettingsService.getCurrentVenue('user123')

      expect(result).toBe('Test Casino')
    })

    it('should return null for non-existent user', async () => {
      setMockData(null)

      const result = await UserSettingsService.getCurrentVenue('nonexistent')

      expect(result).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      setMockError({ message: 'Database error' })

      const result = await UserSettingsService.getCurrentVenue('user123')

      expect(result).toBeNull()
    })

    it('should return null when settings exist but no venue set', async () => {
      const settingsWithoutVenue = {
        ...mockDbSettings,
        current_venue: null
      }

      setMockData(settingsWithoutVenue)

      const result = await UserSettingsService.getCurrentVenue('user123')

      expect(result).toBeNull()
    })
  })
})