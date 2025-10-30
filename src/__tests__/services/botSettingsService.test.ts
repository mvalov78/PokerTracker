/**
 * Tests for BotSettingsService
 */

import { BotSettingsService } from '@/services/botSettingsService'
import { createMockAdminClient, createMockBotSetting } from '../mocks/supabase'

// Create mock before jest.mock
let mockSupabaseClient: any

jest.mock('@/lib/supabase', () => ({
  createAdminClient: () => mockSupabaseClient,
}))

// Initialize mock after jest.mock
const mockSupabase = createMockAdminClient()
mockSupabaseClient = mockSupabase.client

describe('BotSettingsService', () => {
  beforeEach(() => {
    mockSupabase.resetMocks()
    jest.clearAllMocks()
  })

  describe('getBotSettings', () => {
    it('should return all bot settings', async () => {
      const mockSettings = [
        createMockBotSetting('bot_mode', 'webhook'),
        createMockBotSetting('bot_status', 'active'),
        createMockBotSetting('webhook_url', 'https://example.com/webhook'),
        createMockBotSetting('polling_enabled', 'false'),
        createMockBotSetting('webhook_enabled', 'true'),
        createMockBotSetting('auto_restart', 'true'),
        createMockBotSetting('error_count', '0'),
        createMockBotSetting('last_update_time', '2024-01-15T12:00:00Z'),
      ]

      mockSupabase.setMockData(mockSettings)

      const result = await BotSettingsService.getBotSettings()

      expect(result).toBeTruthy()
      expect(result?.bot_mode).toBe('webhook')
      expect(result?.bot_status).toBe('active')
      expect(result?.polling_enabled).toBe(false)
      expect(result?.webhook_enabled).toBe(true)
      expect(result?.auto_restart).toBe(true)
      expect(result?.error_count).toBe(0)
    })

    it('should return null when admin client not available', async () => {
      mockSupabaseClient = null

      const result = await BotSettingsService.getBotSettings()

      expect(result).toBeNull()

      mockSupabaseClient = mockSupabase.client
    })

    it('should return null on database error', async () => {
      mockSupabase.setMockError({ message: 'Database error' })

      const result = await BotSettingsService.getBotSettings()

      expect(result).toBeNull()
    })
  })

  describe('getSetting', () => {
    it('should get specific setting', async () => {
      const mockSetting = createMockBotSetting('bot_mode', 'webhook')
      mockSupabase.setMockData(mockSetting)

      const result = await BotSettingsService.getSetting('bot_mode')

      expect(result).toBe('webhook')
    })

    it('should return null when setting not found', async () => {
      mockSupabase.setMockData(null)

      const result = await BotSettingsService.getSetting('bot_mode')

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      mockSupabase.setMockError({ message: 'Query failed' })

      const result = await BotSettingsService.getSetting('bot_mode')

      expect(result).toBeNull()
    })
  })

  describe('updateSetting', () => {
    it('should update string setting', async () => {
      mockSupabase.setMockError(null)

      const result = await BotSettingsService.updateSetting('webhook_url', 'https://new.com')

      expect(result).toBe(true)
    })

    it('should update boolean setting', async () => {
      mockSupabase.setMockError(null)

      const result = await BotSettingsService.updateSetting('polling_enabled', true)

      expect(result).toBe(true)
    })

    it('should update number setting', async () => {
      mockSupabase.setMockError(null)

      const result = await BotSettingsService.updateSetting('error_count', 5)

      expect(result).toBe(true)
    })

    it('should return false on update error', async () => {
      mockSupabase.setMockError({ message: 'Update failed' })

      const result = await BotSettingsService.updateSetting('bot_mode', 'polling')

      expect(result).toBe(false)
    })

    it('should return false when admin client not available', async () => {
      mockSupabaseClient = null

      const result = await BotSettingsService.updateSetting('bot_mode', 'polling')

      expect(result).toBe(false)

      mockSupabaseClient = mockSupabase.client
    })
  })

  describe('getBotMode', () => {
    it('should return bot mode', async () => {
      const mockSetting = createMockBotSetting('bot_mode', 'webhook')
      mockSupabase.setMockData(mockSetting)

      const result = await BotSettingsService.getBotMode()

      expect(result).toBe('webhook')
    })

    it('should return polling mode', async () => {
      const mockSetting = createMockBotSetting('bot_mode', 'polling')
      mockSupabase.setMockData(mockSetting)

      const result = await BotSettingsService.getBotMode()

      expect(result).toBe('polling')
    })
  })

  describe('isBotActive', () => {
    it('should return true when bot is active', async () => {
      const mockSetting = createMockBotSetting('bot_status', 'active')
      mockSupabase.setMockData(mockSetting)

      const result = await BotSettingsService.isBotActive()

      expect(result).toBe(true)
    })

    it('should return false when bot is inactive', async () => {
      const mockSetting = createMockBotSetting('bot_status', 'inactive')
      mockSupabase.setMockData(mockSetting)

      const result = await BotSettingsService.isBotActive()

      expect(result).toBe(false)
    })
  })

  describe('updateBotStatus', () => {
    it('should update bot status to active', async () => {
      mockSupabase.setMockError(null)

      const result = await BotSettingsService.updateBotStatus('active')

      expect(result).toBe(true)
    })

    it('should update bot status to error', async () => {
      mockSupabase.setMockError(null)

      const result = await BotSettingsService.updateBotStatus('error')

      expect(result).toBe(true)
    })
  })

  describe('incrementErrorCount', () => {
    it('should increment error count', async () => {
      const mockSetting = createMockBotSetting('error_count', '5')
      mockSupabase.setMockData(mockSetting)
      mockSupabase.setMockError(null)

      await BotSettingsService.incrementErrorCount()

      // Should call updateSetting twice (error_count and last_update_time)
      expect(mockSupabase.client.from).toHaveBeenCalled()
    })

    it('should handle missing error count', async () => {
      mockSupabase.setMockData(null)
      mockSupabase.setMockError(null)

      await BotSettingsService.incrementErrorCount()

      // Should start from 0
      expect(mockSupabase.client.from).toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      mockSupabase.setMockError({ message: 'Failed' })

      await expect(BotSettingsService.incrementErrorCount()).resolves.not.toThrow()
    })
  })

  describe('resetErrorCount', () => {
    it('should reset error count to 0', async () => {
      mockSupabase.setMockError(null)

      await BotSettingsService.resetErrorCount()

      expect(mockSupabase.client.from).toHaveBeenCalled()
    })
  })

  describe('updateLastUpdateTime', () => {
    it('should update last update time', async () => {
      mockSupabase.setMockError(null)

      await BotSettingsService.updateLastUpdateTime()

      expect(mockSupabase.client.from).toHaveBeenCalled()
    })
  })

  describe('getWebhookUrl', () => {
    it('should return webhook URL', async () => {
      const mockSetting = createMockBotSetting('webhook_url', 'https://example.com/webhook')
      mockSupabase.setMockData(mockSetting)

      const result = await BotSettingsService.getWebhookUrl()

      expect(result).toBe('https://example.com/webhook')
    })
  })

  describe('setWebhookUrl', () => {
    it('should set webhook URL', async () => {
      mockSupabase.setMockError(null)

      const result = await BotSettingsService.setWebhookUrl('https://new-webhook.com')

      expect(result).toBe(true)
    })
  })
})

