/**
 * Тесты для TournamentService с Supabase
 */

import { TournamentService } from '@/services/tournamentService'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn(),
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(),
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
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
      upsert: jest.fn(() => ({
        onConflict: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    })),
  },
}))

import { supabase } from '@/lib/supabase'
const mockSupabase = supabase as any

describe('TournamentService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllTournaments', () => {
    it('should get all tournaments successfully', async () => {
      const mockTournaments = [
        {
          id: '1',
          name: 'Test Tournament 1',
          buyin: 100,
          venue: 'Casino 1',
          tournament_results: null,
        },
        {
          id: '2',
          name: 'Test Tournament 2',
          buyin: 200,
          venue: 'Casino 2',
          tournament_results: {
            position: 1,
            payout: 500,
          },
        },
      ]

      const mockQuery = mockSupabase.from().select().order().limit
      mockQuery.mockResolvedValue({
        data: mockTournaments,
        error: null,
      })

      const result = await TournamentService.getAllTournaments()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Test Tournament 1')
      expect(result[1].result?.payout).toBe(500)
    })

    it('should handle empty results', async () => {
      const mockQuery = mockSupabase.from().select().order().limit
      mockQuery.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await TournamentService.getAllTournaments()

      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      const mockQuery = mockSupabase.from().select().order().limit
      mockQuery.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(TournamentService.getAllTournaments())
        .rejects.toThrow('Database error')
    })
  })

  describe('getTournamentsByUserId', () => {
    it('should get tournaments for specific user', async () => {
      const mockTournaments = [
        {
          id: '1',
          user_id: 'user123',
          name: 'User Tournament',
          tournament_results: null,
        },
      ]

      const mockQuery = mockSupabase.from().select().eq().order().limit
      mockQuery.mockResolvedValue({
        data: mockTournaments,
        error: null,
      })

      const result = await TournamentService.getTournamentsByUserId('user123')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('User Tournament')
    })
  })

  describe('getTournamentById', () => {
    it('should get tournament by ID', async () => {
      const mockTournament = {
        id: '1',
        name: 'Specific Tournament',
        tournament_results: {
          position: 2,
          payout: 300,
        },
      }

      const mockQuery = mockSupabase.from().select().eq().single
      mockQuery.mockResolvedValue({
        data: mockTournament,
        error: null,
      })

      const result = await TournamentService.getTournamentById('1')

      expect(result?.name).toBe('Specific Tournament')
      expect(result?.result?.position).toBe(2)
    })

    it('should return null for non-existent tournament', async () => {
      const mockQuery = mockSupabase.from().select().eq().single
      mockQuery.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await TournamentService.getTournamentById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('createTournament', () => {
    it('should create tournament successfully', async () => {
      const tournamentData = {
        userId: 'user123',
        name: 'New Tournament',
        buyin: 150,
        venue: 'New Casino',
        date: '2024-12-31T20:00:00Z',
      }

      const mockCreatedTournament = {
        id: 'new-id',
        user_id: 'user123',
        name: 'New Tournament',
        buyin: 150,
        venue: 'New Casino',
        date: '2024-12-31T20:00:00Z',
        tournament_results: null,
      }

      const mockQuery = mockSupabase.from().insert().select().single
      mockQuery.mockResolvedValue({
        data: mockCreatedTournament,
        error: null,
      })

      const result = await TournamentService.createTournament(tournamentData)

      expect(result.name).toBe('New Tournament')
      expect(result.buyin).toBe(150)
    })

    it('should handle creation errors', async () => {
      const tournamentData = {
        userId: 'user123',
        name: 'Invalid Tournament',
        buyin: -100, // Invalid buyin
      }

      const mockQuery = mockSupabase.from().insert().select().single
      mockQuery.mockResolvedValue({
        data: null,
        error: { message: 'Check constraint violation' },
      })

      await expect(TournamentService.createTournament(tournamentData))
        .rejects.toThrow('Check constraint violation')
    })
  })

  describe('updateTournament', () => {
    it('should update tournament successfully', async () => {
      const updates = {
        name: 'Updated Tournament',
        buyin: 250,
      }

      const mockUpdatedTournament = {
        id: '1',
        name: 'Updated Tournament',
        buyin: 250,
        venue: 'Original Casino',
      }

      const mockQuery = mockSupabase.from().update().eq().select().single
      mockQuery.mockResolvedValue({
        data: mockUpdatedTournament,
        error: null,
      })

      const result = await TournamentService.updateTournament('1', updates)

      expect(result?.name).toBe('Updated Tournament')
      expect(result?.buyin).toBe(250)
    })
  })

  describe('addTournamentResult', () => {
    it('should add result using upsert', async () => {
      const resultData = {
        position: 1,
        payout: 1000,
        notes: 'Great game!',
      }

      const mockUpdatedTournament = {
        id: '1',
        name: 'Tournament with Result',
        tournament_results: {
          tournament_id: '1',
          position: 1,
          payout: 1000,
          notes: 'Great game!',
        },
      }

      // Mock upsert for tournament_results
      const mockUpsertQuery = mockSupabase.from().upsert().onConflict().select().single
      mockUpsertQuery.mockResolvedValue({
        data: { tournament_id: '1', position: 1, payout: 1000 },
        error: null,
      })

      // Mock get tournament with result
      const mockGetQuery = mockSupabase.from().select().eq().single
      mockGetQuery.mockResolvedValue({
        data: mockUpdatedTournament,
        error: null,
      })

      const result = await TournamentService.addTournamentResult('1', resultData)

      expect(result?.result?.position).toBe(1)
      expect(result?.result?.payout).toBe(1000)
    })

    it('should handle upsert errors', async () => {
      const resultData = {
        position: 1,
        payout: 1000,
      }

      const mockUpsertQuery = mockSupabase.from().upsert().onConflict().select().single
      mockUpsertQuery.mockResolvedValue({
        data: null,
        error: { message: 'Upsert failed' },
      })

      await expect(TournamentService.addTournamentResult('1', resultData))
        .rejects.toThrow('Upsert failed')
    })
  })

  describe('deleteTournament', () => {
    it('should delete tournament successfully', async () => {
      const mockDeleteQuery = mockSupabase.from().delete().eq
      mockDeleteQuery.mockResolvedValue({
        error: null,
      })

      await expect(TournamentService.deleteTournament('1'))
        .resolves.not.toThrow()
    })

    it('should handle deletion errors', async () => {
      const mockDeleteQuery = mockSupabase.from().delete().eq
      mockDeleteQuery.mockResolvedValue({
        error: { message: 'Deletion failed' },
      })

      await expect(TournamentService.deleteTournament('1'))
        .rejects.toThrow('Deletion failed')
    })
  })

  describe('data mapping', () => {
    it('should map tournament results correctly when results is an array', async () => {
      const mockTournament = {
        id: '1',
        name: 'Tournament',
        tournament_results: [
          {
            position: 3,
            payout: 200,
            notes: 'Good run',
          },
        ],
      }

      const mockQuery = mockSupabase.from().select().eq().single
      mockQuery.mockResolvedValue({
        data: mockTournament,
        error: null,
      })

      const result = await TournamentService.getTournamentById('1')

      expect(result?.result?.position).toBe(3)
      expect(result?.result?.payout).toBe(200)
      expect(result?.result?.notes).toBe('Good run')
    })

    it('should map tournament results correctly when results is an object', async () => {
      const mockTournament = {
        id: '1',
        name: 'Tournament',
        tournament_results: {
          position: 5,
          payout: 100,
          notes: 'Almost ITM',
        },
      }

      const mockQuery = mockSupabase.from().select().eq().single
      mockQuery.mockResolvedValue({
        data: mockTournament,
        error: null,
      })

      const result = await TournamentService.getTournamentById('1')

      expect(result?.result?.position).toBe(5)
      expect(result?.result?.payout).toBe(100)
      expect(result?.result?.notes).toBe('Almost ITM')
    })

    it('should handle null tournament results', async () => {
      const mockTournament = {
        id: '1',
        name: 'Tournament',
        tournament_results: null,
      }

      const mockQuery = mockSupabase.from().select().eq().single
      mockQuery.mockResolvedValue({
        data: mockTournament,
        error: null,
      })

      const result = await TournamentService.getTournamentById('1')

      expect(result?.result).toBeNull()
    })
  })
})
