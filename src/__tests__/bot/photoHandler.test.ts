/**
 * Tests for PhotoHandler
 */

import { PhotoHandler } from '@/bot/handlers/photoHandler'
import {
    createDocumentMessage,
    createMockBotContext,
    createPhotoMessage,
} from '../mocks/telegraf'
import { createMockOCRResult, mockFetch, resetFetchMock } from '../utils/testHelpers'

// Mock OCR service
jest.mock('@/services/ocrService', () => ({
  processTicketImage: jest.fn(),
}))

// Mock user services
jest.mock('@/services/userService', () => ({
  UserService: {
    getUserUuidByTelegramId: jest.fn().mockResolvedValue('user-uuid-123'),
  },
}))

jest.mock('@/services/userSettingsService', () => ({
  UserSettingsService: {
    getCurrentVenue: jest.fn().mockResolvedValue('Test Casino'),
  },
}))

import { processTicketImage } from '@/services/ocrService'
import { UserService } from '@/services/userService'
import { UserSettingsService } from '@/services/userSettingsService'

const mockProcessTicketImage = processTicketImage as jest.MockedFunction<typeof processTicketImage>
const mockGetUserUuid = UserService.getUserUuidByTelegramId as jest.MockedFunction<typeof UserService.getUserUuidByTelegramId>
const mockGetCurrentVenue = UserSettingsService.getCurrentVenue as jest.MockedFunction<typeof UserSettingsService.getCurrentVenue>

describe('PhotoHandler', () => {
  let handler: PhotoHandler

  beforeEach(() => {
    handler = new PhotoHandler()
    jest.clearAllMocks()
    resetFetchMock()
  })

  afterEach(() => {
    resetFetchMock()
  })

  describe('handlePhoto', () => {
    it('should process photo successfully', async () => {
      const ctx = createMockBotContext({
        message: createPhotoMessage(),
      })

      const ocrResult = createMockOCRResult()
      mockProcessTicketImage.mockResolvedValue(ocrResult)
      mockGetCurrentVenue.mockResolvedValue('Royal Casino')

      await handler.handlePhoto(ctx as any)

      expect(ctx.reply).toHaveBeenCalledTimes(2) // Processing + confirmation
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Обрабатываю фотографию')
      )
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Данные распознаны'),
        expect.any(Object)
      )
      expect(ctx.session.ocrData).toBeDefined()
    })

    it('should handle missing photos', async () => {
      const ctx = createMockBotContext({
        message: { ...createPhotoMessage(), photo: undefined },
      })

      await handler.handlePhoto(ctx as any)

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Не удалось получить фотографию')
      )
    })

    it('should handle OCR failure', async () => {
      const ctx = createMockBotContext({
        message: createPhotoMessage(),
      })

      mockProcessTicketImage.mockResolvedValue({
        success: false,
        error: 'OCR failed',
        confidence: 0,
      })

      await handler.handlePhoto(ctx as any)

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Не удалось распознать данные')
      )
    })

    it('should use current venue if set', async () => {
      const ctx = createMockBotContext({
        message: createPhotoMessage(),
      })

      const ocrResult = createMockOCRResult({
        data: {
          ...createMockOCRResult().data!,
          venue: 'OCR Venue',
        },
      })

      mockProcessTicketImage.mockResolvedValue(ocrResult)
      mockGetCurrentVenue.mockResolvedValue('Current Venue')

      await handler.handlePhoto(ctx as any)

      // Should show current venue is set
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Current Venue'),
        expect.any(Object)
      )
    })

    it('should handle Telegram API errors', async () => {
      const ctx = createMockBotContext({
        message: createPhotoMessage(),
      })

      ctx.telegram.getFileLink.mockRejectedValue(new Error('API error'))

      await handler.handlePhoto(ctx as any)

      // Проверяем второй вызов с ошибкой
      expect(ctx.reply).toHaveBeenCalledTimes(2)
      expect(ctx.reply).toHaveBeenLastCalledWith(
        expect.stringContaining('Произошла ошибка'),
        expect.any(Object)
      )
    })
  })

  describe('handleDocumentAsPhoto', () => {
    it('should process image document successfully', async () => {
      const ctx = createMockBotContext({
        message: createDocumentMessage('image/jpeg'),
      })

      const ocrResult = createMockOCRResult()
      mockProcessTicketImage.mockResolvedValue(ocrResult)

      await handler.handleDocumentAsPhoto(ctx as any)

      expect(ctx.reply).toHaveBeenCalled()
      expect(ctx.session.ocrData).toBeDefined()
    })

    it('should reject non-image documents', async () => {
      const ctx = createMockBotContext({
        message: createDocumentMessage('application/pdf'),
      })

      await handler.handleDocumentAsPhoto(ctx as any)

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Файл не является изображением')
      )
    })

    it('should handle missing document', async () => {
      const ctx = createMockBotContext({
        message: { ...createDocumentMessage(), document: undefined },
      })

      await handler.handleDocumentAsPhoto(ctx as any)

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Не удалось получить документ')
      )
    })
  })

  describe('confirmTournament', () => {
    it('should create tournament successfully', async () => {
      const ctx = createMockBotContext()
      ctx.session.ocrData = createMockOCRResult().data

      mockGetUserUuid.mockResolvedValue('user-uuid-123')
      mockGetCurrentVenue.mockResolvedValue('Test Casino')

      mockFetch({
        success: true,
        tournament: {
          id: 'new-tournament-id',
          name: 'RPF Tournament #123',
          buyin: 275,
          date: '2024-01-15T18:00:00Z',
          venue: 'Test Casino',
        },
      })

      await handler.confirmTournament(ctx as any)

      expect(ctx.answerCbQuery).toHaveBeenCalled()
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tournaments'),
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('успешно создан'),
        expect.any(Object)
      )
      expect(ctx.session.ocrData).toBeUndefined()
    })

    it('should handle missing OCR data', async () => {
      const ctx = createMockBotContext()
      ctx.session.ocrData = undefined

      await handler.confirmTournament(ctx as any)

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Данные OCR не найдены')
      )
    })

    it('should handle API errors', async () => {
      const ctx = createMockBotContext()
      ctx.session.ocrData = createMockOCRResult().data

      mockFetch({ success: false, error: 'API Error' }, 500)

      await handler.confirmTournament(ctx as any)

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Ошибка при создании турнира'),
        expect.any(Object)
      )
    })

    it('should handle network timeout', async () => {
      const ctx = createMockBotContext()
      ctx.session.ocrData = createMockOCRResult().data

      ;(global.fetch as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 100)
        )
      )

      await handler.confirmTournament(ctx as any)

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Ошибка'),
        expect.any(Object)
      )
    })

    it('should use user UUID or fallback to telegram ID', async () => {
      const ctx = createMockBotContext()
      ctx.session.ocrData = createMockOCRResult().data

      mockGetUserUuid.mockResolvedValue(null)

      mockFetch({
        success: true,
        tournament: { id: 'new-id', name: 'Test' },
      })

      await handler.confirmTournament(ctx as any)

      // Should use telegram ID as fallback
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  describe('cancelTournament', () => {
    it('should cancel tournament creation', async () => {
      const ctx = createMockBotContext()
      ctx.session.ocrData = createMockOCRResult().data

      await handler.cancelTournament(ctx as any)

      expect(ctx.answerCbQuery).toHaveBeenCalled()
      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Создание турнира отменено'),
        expect.any(Object)
      )
      expect(ctx.session.ocrData).toBeUndefined()
    })
  })

  describe('editTournament', () => {
    it('should start edit mode', async () => {
      const ctx = createMockBotContext()
      const ocrData = createMockOCRResult().data
      ctx.session.ocrData = ocrData

      await handler.editTournament(ctx as any)

      expect(ctx.answerCbQuery).toHaveBeenCalled()
      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Редактирование'),
        expect.any(Object)
      )
      expect(ctx.session.currentAction).toBe('edit_tournament')
      expect(ctx.session.tournamentData).toBeDefined()
    })

    it('should handle missing OCR data', async () => {
      const ctx = createMockBotContext()
      ctx.session.ocrData = undefined

      await handler.editTournament(ctx as any)

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Данные OCR не найдены')
      )
    })
  })
})






