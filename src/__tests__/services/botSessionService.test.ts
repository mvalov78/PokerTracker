/**
 * Tests for BotSessionService
 */

import { BotSessionService, type BotSessionData } from '@/services/botSessionService'
import { createMockAdminClient, createMockBotSession } from '../mocks/supabase'

// Create mock before jest.mock
let mockSupabaseClient: any

jest.mock('@/lib/supabase', () => ({
  get supabaseAdmin() {
    return mockSupabaseClient
  },
}))

// Initialize mock after jest.mock
const mockSupabase = createMockAdminClient()
mockSupabaseClient = mockSupabase.client

describe('BotSessionService', () => {
  beforeEach(() => {
    mockSupabase.resetMocks()
    jest.clearAllMocks()
  })

  describe('getSession', () => {
    it('should return existing session', async () => {
      const mockSession = createMockBotSession({
        user_id: 12345,
        session_data: {
          userId: '12345',
          currentAction: 'register_tournament',
          tournamentData: { name: 'Test' },
        },
      })

      mockSupabase.setMockData(mockSession)

      const result = await BotSessionService.getSession(12345)

      expect(result.userId).toBe('12345')
      expect(result.currentAction).toBe('register_tournament')
      expect(result.tournamentData).toEqual({ name: 'Test' })
    })

    it('should create new session when not found', async () => {
      mockSupabase.setMockError({ code: 'PGRST116' })

      const result = await BotSessionService.getSession(99999)

      expect(result.userId).toBe('99999')
      expect(result.currentAction).toBeUndefined()
      expect(result.tournamentData).toBeUndefined()
    })

    it('should return default session on database error', async () => {
      mockSupabase.setMockError({ message: 'Database connection failed' })

      const result = await BotSessionService.getSession(12345)

      expect(result.userId).toBe('12345')
      expect(result.currentAction).toBeUndefined()
    })

    it('should handle session without Supabase admin client', async () => {
      mockSupabaseClient = null

      const result = await BotSessionService.getSession(12345)

      expect(result.userId).toBe('12345')

      mockSupabaseClient = mockSupabase.client
    })
  })

  describe('createSession', () => {
    it('should create new session successfully', async () => {
      mockSupabase.setMockError(null)

      const result = await BotSessionService.createSession(12345)

      expect(result.userId).toBe('12345')
      expect(result.currentAction).toBeUndefined()
      expect(result.tournamentData).toBeUndefined()
      expect(result.ocrData).toBeUndefined()
    })

    it('should handle creation errors gracefully', async () => {
      mockSupabase.setMockError({ message: 'Insert failed' })

      const result = await BotSessionService.createSession(12345)

      expect(result.userId).toBe('12345')
    })
  })

  describe('updateSession', () => {
    it('should update session successfully', async () => {
      mockSupabase.setMockError(null)

      const sessionData: BotSessionData = {
        userId: '12345',
        currentAction: 'add_result',
        tournamentData: { id: '123', name: 'Updated' },
      }

      const result = await BotSessionService.updateSession(12345, sessionData)

      expect(result).toBe(true)
    })

    it('should return false on update error', async () => {
      mockSupabase.setMockError({ message: 'Update failed' })

      const sessionData: BotSessionData = {
        userId: '12345',
      }

      const result = await BotSessionService.updateSession(12345, sessionData)

      expect(result).toBe(false)
    })

    it('should return false without Supabase admin client', async () => {
      mockSupabaseClient = null

      const result = await BotSessionService.updateSession(12345, { userId: '12345' })

      expect(result).toBe(false)

      mockSupabaseClient = mockSupabase.client
    })
  })

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      mockSupabase.setMockError(null)

      const result = await BotSessionService.deleteSession(12345)

      expect(result).toBe(true)
    })

    it('should return false on delete error', async () => {
      mockSupabase.setMockError({ message: 'Delete failed' })

      const result = await BotSessionService.deleteSession(12345)

      expect(result).toBe(false)
    })

    it('should return false without Supabase admin client', async () => {
      mockSupabaseClient = null

      const result = await BotSessionService.deleteSession(12345)

      expect(result).toBe(false)

      mockSupabaseClient = mockSupabase.client
    })
  })

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions', async () => {
      mockSupabase.setMockData(5)

      const result = await BotSessionService.cleanupExpiredSessions()

      expect(result).toBe(5)
    })

    it('should return 0 on cleanup error', async () => {
      mockSupabase.setMockError({ message: 'RPC failed' })

      const result = await BotSessionService.cleanupExpiredSessions()

      expect(result).toBe(0)
    })

    it('should return 0 without Supabase admin client', async () => {
      mockSupabaseClient = null

      const result = await BotSessionService.cleanupExpiredSessions()

      expect(result).toBe(0)

      mockSupabaseClient = mockSupabase.client
    })

    it('should handle null data from cleanup', async () => {
      mockSupabase.setMockData(null)

      const result = await BotSessionService.cleanupExpiredSessions()

      expect(result).toBe(0)
    })
  })
})

