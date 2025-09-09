/**
 * Тесты для UserSettingsService
 */

import { UserSettingsService } from '@/services/userSettingsService'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}))

import { supabase } from '@/lib/supabase'
const mockSupabase = supabase as any

describe('UserSettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserSettings', () => {
    it('should get user settings successfully', async () => {
      const mockSettings = {
        id: 'test-id',
        user_id: 'user123',
        current_venue: 'Test Casino',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const mockQuery = mockSupabase.from().select().eq().single
      mockQuery.mockResolvedValue({
        data: mockSettings,
        error: null,
      })

      const result = await UserSettingsService.getUserSettings('user123')

      expect(result).toEqual(mockSettings)
      expect(mockSupabase.from).toHaveBeenCalledWith('user_settings')
    })

    it('should return null when user settings not found', async () => {
      const mockQuery = mockSupabase.from().select().eq().single
      mockQuery.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // Not found error
      })

      const result = await UserSettingsService.getUserSettings('nonexistent')

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      const mockQuery = mockSupabase.from().select().eq().single
      mockQuery.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(UserSettingsService.getUserSettings('user123'))
        .rejects.toThrow('Database error')
    })
  })

  describe('createUserSettings', () => {
    it('should create user settings successfully', async () => {
      const mockSettings = {
        id: 'new-id',
        user_id: 'newuser',
        current_venue: 'New Casino',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const mockQuery = mockSupabase.from().insert().select().single
      mockQuery.mockResolvedValue({
        data: mockSettings,
        error: null,
      })

      const result = await UserSettingsService.createUserSettings('newuser', 'New Casino')

      expect(result).toEqual(mockSettings)
      expect(mockSupabase.from).toHaveBeenCalledWith('user_settings')
    })

    it('should handle creation errors', async () => {
      const mockQuery = mockSupabase.from().insert().select().single
      mockQuery.mockResolvedValue({
        data: null,
        error: { message: 'Creation failed' },
      })

      await expect(UserSettingsService.createUserSettings('user123', 'Casino'))
        .rejects.toThrow('Creation failed')
    })
  })

  describe('updateCurrentVenue', () => {
    it('should update existing user settings', async () => {
      const mockExistingSettings = {
        id: 'existing-id',
        user_id: 'user123',
        current_venue: 'Old Casino',
      }

      const mockUpdatedSettings = {
        ...mockExistingSettings,
        current_venue: 'New Casino',
        updated_at: '2024-01-01T00:00:00Z',
      }

      // Mock getUserSettings to return existing settings
      const mockGetQuery = mockSupabase.from().select().eq().single
      mockGetQuery.mockResolvedValue({
        data: mockExistingSettings,
        error: null,
      })

      // Mock update query
      const mockUpdateQuery = mockSupabase.from().update().eq().select().single
      mockUpdateQuery.mockResolvedValue({
        data: mockUpdatedSettings,
        error: null,
      })

      const result = await UserSettingsService.updateCurrentVenue('user123', 'New Casino')

      expect(result).toEqual(mockUpdatedSettings)
    })

    it('should create new settings if user not found', async () => {
      const mockNewSettings = {
        id: 'new-id',
        user_id: 'newuser',
        current_venue: 'First Casino',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      // Mock getUserSettings to return null (not found)
      const mockGetQuery = mockSupabase.from().select().eq().single
      mockGetQuery.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Mock create query
      const mockCreateQuery = mockSupabase.from().insert().select().single
      mockCreateQuery.mockResolvedValue({
        data: mockNewSettings,
        error: null,
      })

      const result = await UserSettingsService.updateCurrentVenue('newuser', 'First Casino')

      expect(result).toEqual(mockNewSettings)
    })
  })

  describe('getCurrentVenue', () => {
    it('should get current venue for existing user', async () => {
      const mockSettings = {
        current_venue: 'Test Casino',
      }

      const mockQuery = mockSupabase.from().select().eq().single
      mockQuery.mockResolvedValue({
        data: mockSettings,
        error: null,
      })

      const result = await UserSettingsService.getCurrentVenue('user123')

      expect(result).toBe('Test Casino')
    })

    it('should return null for non-existent user', async () => {
      const mockQuery = mockSupabase.from().select().eq().single
      mockQuery.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await UserSettingsService.getCurrentVenue('nonexistent')

      expect(result).toBeNull()
    })

    it('should return null when venue is not set', async () => {
      const mockSettings = {
        current_venue: null,
      }

      const mockQuery = mockSupabase.from().select().eq().single
      mockQuery.mockResolvedValue({
        data: mockSettings,
        error: null,
      })

      const result = await UserSettingsService.getCurrentVenue('user123')

      expect(result).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      const mockQuery = mockSupabase.from().select().eq().single
      mockQuery.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await UserSettingsService.getCurrentVenue('user123')

      expect(result).toBeNull()
    })
  })
})
