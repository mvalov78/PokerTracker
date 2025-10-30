/**
 * Tests for NotificationService
 */

import { NotificationService } from '@/bot/services/notificationService'

// Mock the mockData module
jest.mock('@/data/mockData', () => ({
  getTournamentsByUser: jest.fn(),
  calculateUserStats: jest.fn(),
}))

import { calculateUserStats, getTournamentsByUser } from '@/data/mockData'

const mockGetTournamentsByUser = getTournamentsByUser as jest.MockedFunction<typeof getTournamentsByUser>
const mockCalculateUserStats = calculateUserStats as jest.MockedFunction<typeof calculateUserStats>

describe('NotificationService', () => {
  let service: NotificationService

  beforeEach(() => {
    service = new NotificationService()
    jest.clearAllMocks()
  })

  describe('getUserSettings', () => {
    it('should return default settings for new user', () => {
      const settings = service.getUserSettings('user123')

      expect(settings.userId).toBe('user123')
      expect(settings.reminders).toBe(true)
      expect(settings.weeklyStats).toBe(true)
      expect(settings.achievements).toBe(true)
      expect(settings.tournamentStart).toBe(true)
      expect(settings.results).toBe(true)
    })

    it('should return existing settings', () => {
      service.updateUserSettings('user123', { reminders: false })

      const settings = service.getUserSettings('user123')

      expect(settings.reminders).toBe(false)
      expect(settings.weeklyStats).toBe(true)
    })
  })

  describe('updateUserSettings', () => {
    it('should update specific settings', () => {
      service.updateUserSettings('user123', {
        reminders: false,
        weeklyStats: false,
      })

      const settings = service.getUserSettings('user123')

      expect(settings.reminders).toBe(false)
      expect(settings.weeklyStats).toBe(false)
      expect(settings.achievements).toBe(true)
    })

    it('should preserve other settings', () => {
      service.updateUserSettings('user123', {
        reminders: false,
      })

      const settings = service.getUserSettings('user123')

      expect(settings.reminders).toBe(false)
      expect(settings.tournamentStart).toBe(true)
      expect(settings.results).toBe(true)
    })
  })

  describe('toggleNotification', () => {
    it('should toggle notification on to off', () => {
      const result = service.toggleNotification('user123', 'reminders')

      expect(result).toBe(false)
      expect(service.getUserSettings('user123').reminders).toBe(false)
    })

    it('should toggle notification off to on', () => {
      service.updateUserSettings('user123', { reminders: false })

      const result = service.toggleNotification('user123', 'reminders')

      expect(result).toBe(true)
      expect(service.getUserSettings('user123').reminders).toBe(true)
    })

    it('should return false for userId field', () => {
      const result = service.toggleNotification('user123', 'userId')

      expect(result).toBe(false)
    })
  })

  describe('createTournamentReminder', () => {
    it('should create reminder with all details', () => {
      const date = new Date('2024-02-01T18:00:00Z')
      const message = service.createTournamentReminder('Big Tournament', date, 'Royal Casino')

      expect(message).toContain('Напоминание о турнире')
      expect(message).toContain('Big Tournament')
      expect(message).toContain('Royal Casino')
      expect(message).toContain('Проверьте банкролл')
    })

    it('should create reminder without venue', () => {
      const date = new Date('2024-02-01T18:00:00Z')
      const message = service.createTournamentReminder('Big Tournament', date)

      expect(message).toContain('Big Tournament')
      expect(message).not.toContain('🏨')
    })
  })

  describe('createTournamentStartNotification', () => {
    it('should create start notification', () => {
      const message = service.createTournamentStartNotification('Championship')

      expect(message).toContain('Турнир начинается')
      expect(message).toContain('Championship')
      expect(message).toContain('Сосредоточьтесь на игре')
    })
  })

  describe('createWeeklyStatsReport', () => {
    it('should create report for user with tournaments', () => {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      mockGetTournamentsByUser.mockReturnValue([
        {
          id: '1',
          name: 'Tournament 1',
          buyin: 100,
          date: now.toISOString(),
          result: { position: 3, payout: 500 },
        },
        {
          id: '2',
          name: 'Tournament 2',
          buyin: 200,
          date: weekAgo.toISOString(),
          result: { position: 10, payout: 0 },
        },
      ] as any)

      mockCalculateUserStats.mockReturnValue({
        totalTournaments: 10,
        roi: 25.5,
        totalProfit: 1000,
      } as any)

      const message = service.createWeeklyStatsReport('user123')

      expect(message).toContain('Еженедельный отчет')
      expect(message).toContain('Турниры:**')
      expect(message).toContain('ROI:**')
      expect(message).toContain('ITM Rate:**')
    })

    it('should handle user with no tournaments this week', () => {
      mockGetTournamentsByUser.mockReturnValue([])
      mockCalculateUserStats.mockReturnValue({
        totalTournaments: 0,
        roi: 0,
        totalProfit: 0,
      } as any)

      const message = service.createWeeklyStatsReport('user123')

      expect(message).toContain('Еженедельный отчет')
      expect(message).toContain('не играли турниры')
    })

    it('should handle tournaments without results', () => {
      const now = new Date()

      mockGetTournamentsByUser.mockReturnValue([
        {
          id: '1',
          name: 'Tournament 1',
          buyin: 100,
          date: now.toISOString(),
          result: undefined,
        },
      ] as any)

      mockCalculateUserStats.mockReturnValue({
        totalTournaments: 5,
        roi: 10,
        totalProfit: 500,
      } as any)

      const message = service.createWeeklyStatsReport('user123')

      expect(message).toContain('не играли турниры')
    })
  })

  describe('createAchievementNotification', () => {
    it('should create notification for known achievement', () => {
      const message = service.createAchievementNotification('first_win', 'Вы выиграли первый турнир!')

      expect(message).toContain('Новое достижение')
      expect(message).toContain('Первая победа')
      expect(message).toContain('Вы выиграли первый турнир!')
    })

    it('should create notification for unknown achievement', () => {
      const message = service.createAchievementNotification('custom_achievement', 'Special milestone')

      expect(message).toContain('Достижение')
      expect(message).toContain('Special milestone')
    })

    it('should handle all achievement types', () => {
      const achievements = [
        'first_win',
        'profit_milestone',
        'roi_milestone',
        'tournament_streak',
        'itm_streak',
        'big_win',
        'volume_milestone',
      ]

      achievements.forEach((achievement) => {
        const message = service.createAchievementNotification(achievement, 'Test description')
        expect(message).toContain('Новое достижение')
        expect(message).toContain('Test description')
      })
    })
  })

  describe('createResultReminderNotification', () => {
    it('should create result reminder', () => {
      const message = service.createResultReminderNotification('Weekly Tournament', 3)

      expect(message).toContain('Напоминание о результате')
      expect(message).toContain('Weekly Tournament')
      expect(message).toContain('Прошло дней: 3')
      expect(message).toContain('/result')
    })
  })

  describe('createUpcomingTournamentsNotification', () => {
    it('should create notification with upcoming tournaments', () => {
      const tournaments = [
        {
          id: '1',
          name: 'Tournament 1',
          date: '2024-02-01T18:00:00Z',
          buyin: 100,
          venue: 'Casino A',
        },
        {
          id: '2',
          name: 'Tournament 2',
          date: '2024-02-02T18:00:00Z',
          buyin: 200,
          venue: 'Casino B',
        },
      ]

      const message = service.createUpcomingTournamentsNotification(tournaments)

      expect(message).toContain('Предстоящие турниры')
      expect(message).toContain('Tournament 1')
      expect(message).toContain('Tournament 2')
      expect(message).toContain('Casino A')
      expect(message).toContain('$100')
    })

    it('should limit to 5 tournaments', () => {
      const tournaments = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        name: `Tournament ${i}`,
        date: '2024-02-01T18:00:00Z',
        buyin: 100,
        venue: 'Casino',
      }))

      const message = service.createUpcomingTournamentsNotification(tournaments)

      expect(message).toContain('1. **Tournament 0**')
      expect(message).toContain('5. **Tournament 4**')
      expect(message).not.toContain('6. **Tournament 5**')
    })

    it('should handle empty tournaments list', () => {
      const message = service.createUpcomingTournamentsNotification([])

      expect(message).toContain('Предстоящие турниры')
      expect(message).toContain('нет запланированных')
    })
  })

  describe('shouldSendNotification', () => {
    it('should return true when notification is enabled', () => {
      const result = service.shouldSendNotification('user123', 'reminders')

      expect(result).toBe(true)
    })

    it('should return false when notification is disabled', () => {
      service.updateUserSettings('user123', { reminders: false })

      const result = service.shouldSendNotification('user123', 'reminders')

      expect(result).toBe(false)
    })
  })

  describe('createTestNotification', () => {
    it('should create test notification', () => {
      const message = service.createTestNotification()

      expect(message).toContain('Тестовое уведомление')
      expect(message).toContain('работают корректно')
      expect(message).toContain('/settings')
    })
  })
})






