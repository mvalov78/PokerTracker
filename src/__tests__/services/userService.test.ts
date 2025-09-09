/**
 * Тесты для UserService
 */

import { UserService } from '@/services/userService'

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
    })),
  },
}))

import { supabase } from '@/lib/supabase'
const mockSupabase = supabase as any

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserUuidByTelegramId', () => {
    it('should return UUID for existing user', async () => {
      const mockUser = {
        id: 'uuid-123',
        telegram_id: '12345',
      }

      const mockQuery = mockSupabase.from().select().eq().single
      mockQuery.mockResolvedValue({
        data: mockUser,
        error: null,
      })

      const result = await UserService.getUserUuidByTelegramId('12345')

      expect(result).toBe('uuid-123')
      expect(mockSupabase.from).toHaveBeenCalledWith('users')
    })

    it('should create new user if not found', async () => {
      const mockNewUser = {
        id: 'new-uuid-456',
        telegram_id: '67890',
      }

      // Mock getUserUuidByTelegramId to return null (not found)
      const mockGetQuery = mockSupabase.from().select().eq().single
      mockGetQuery.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Mock createUserFromTelegramId
      const mockCreateQuery = mockSupabase.from().insert().select().single
      mockCreateQuery.mockResolvedValue({
        data: mockNewUser,
        error: null,
      })

      const result = await UserService.getUserUuidByTelegramId('67890')

      expect(result).toBe('new-uuid-456')
    })

    it('should handle database errors', async () => {
      const mockQuery = mockSupabase.from().select().eq().single
      mockQuery.mockResolvedValue({
        data: null,
        error: { message: 'Database connection error' },
      })

      const result = await UserService.getUserUuidByTelegramId('12345')

      expect(result).toBeNull()
    })
  })

  describe('createUserFromTelegramId', () => {
    it('should create new user successfully', async () => {
      const mockNewUser = {
        id: 'new-uuid-789',
        telegram_id: '99999',
        created_at: '2024-01-01T00:00:00Z',
      }

      const mockQuery = mockSupabase.from().insert().select().single
      mockQuery.mockResolvedValue({
        data: mockNewUser,
        error: null,
      })

      const result = await UserService.createUserFromTelegramId('99999')

      expect(result).toEqual(mockNewUser)
      expect(mockSupabase.from).toHaveBeenCalledWith('users')
    })

    it('should handle creation errors', async () => {
      const mockQuery = mockSupabase.from().insert().select().single
      mockQuery.mockResolvedValue({
        data: null,
        error: { message: 'Unique constraint violation' },
      })

      const result = await UserService.createUserFromTelegramId('12345')

      expect(result).toBeNull()
    })
  })

  describe('integration scenarios', () => {
    it('should handle user creation flow correctly', async () => {
      const telegramId = '11111'
      const mockNewUser = {
        id: 'integration-uuid',
        telegram_id: telegramId,
      }

      // First call - user not found
      const mockGetQuery = mockSupabase.from().select().eq().single
      mockGetQuery.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Second call - create user
      const mockCreateQuery = mockSupabase.from().insert().select().single
      mockCreateQuery.mockResolvedValue({
        data: mockNewUser,
        error: null,
      })

      const result = await UserService.getUserUuidByTelegramId(telegramId)

      expect(result).toBe('integration-uuid')
      expect(mockSupabase.from).toHaveBeenCalledTimes(2) // Once for get, once for create
    })

    it('should handle race conditions gracefully', async () => {
      const telegramId = '22222'

      // First call - user not found
      const mockGetQuery = mockSupabase.from().select().eq().single
      mockGetQuery.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Create fails due to race condition
      const mockCreateQuery = mockSupabase.from().insert().select().single
      mockCreateQuery.mockResolvedValue({
        data: null,
        error: { message: 'duplicate key value violates unique constraint' },
      })

      const result = await UserService.getUserUuidByTelegramId(telegramId)

      expect(result).toBeNull()
    })
  })
})
