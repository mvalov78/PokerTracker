import { TournamentService } from '@/services/tournamentService'

// Используем глобальные функции управления моками
const { setMockData, setMockError, resetMocks } = global

// Сбрасываем моки перед каждым тестом
beforeEach(() => {
  resetMocks()
})

describe('TournamentService', () => {
  const mockDbTournament = {
    id: '1',
    name: 'Test Tournament',
    venue: 'Test Casino',
    buyin: 100,
    date: '2024-01-01T18:00:00Z',
    starting_stack: 10000,
    structure: "NL Hold'em",
    type: 'tournament',
    user_id: 'user123',
    created_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
    participants: 100,
    tournament_results: [{
      position: 5,
      payout: 200,
      notes: 'Good game'
    }],
    tournament_photos: []
  }

  describe('getTournamentsByUserId', () => {
    it('should get tournaments for specific user', async () => {
      setMockData([mockDbTournament])

      const result = await TournamentService.getTournamentsByUserId('user123')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Test Tournament')
      expect(result[0].result?.position).toBe(5)
      expect(result[0].userId).toBe('user123')
    })

    it('should return empty array when no tournaments found', async () => {
      setMockData([])

      const result = await TournamentService.getTournamentsByUserId('user123')

      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      setMockError({ message: 'Database error' })

      await expect(TournamentService.getTournamentsByUserId('user123'))
        .rejects.toThrow('Failed to fetch tournaments: Database error')
    })
  })

  describe('getTournamentById', () => {
    it('should get tournament by ID', async () => {
      setMockData(mockDbTournament)

      const result = await TournamentService.getTournamentById('1')

      expect(result).toBeTruthy()
      expect(result?.name).toBe('Test Tournament')
      expect(result?.result?.position).toBe(5)
    })

    it('should return null for non-existent tournament', async () => {
      setMockData(null)

      const result = await TournamentService.getTournamentById('999')

      expect(result).toBeNull()
    })
  })

  describe('createTournament', () => {
    it('should create tournament successfully', async () => {
      const tournamentData = {
        name: 'New Tournament',
        venue: 'New Casino',
        buyin: 150,
        date: '2024-02-01T18:00:00Z',
        startingStack: 15000,
        structure: "NL Hold'em",
        type: 'tournament' as const,
        userId: 'user123',
        participants: 120
      }

      const mockCreatedTournament = {
        id: 'new-id',
        name: 'New Tournament',
        venue: 'New Casino',
        buyin: 150,
        date: '2024-02-01T18:00:00Z',
        starting_stack: 15000,
        structure: "NL Hold'em",
        type: 'tournament',
        user_id: 'user123',
        participants: 120,
        created_at: '2024-02-01T12:00:00Z',
        updated_at: '2024-02-01T12:00:00Z',
        tournament_results: [],
        tournament_photos: []
      }

      setMockData(mockCreatedTournament)

      const result = await TournamentService.createTournament(tournamentData)

      expect(result).toBeTruthy()
      expect(result.name).toBe('New Tournament')
      expect(result.userId).toBe('user123')
    })
  })

  describe('updateTournament', () => {
    it('should update tournament successfully', async () => {
      const updates = {
        name: 'Updated Tournament',
        buyin: 200
      }

      const mockUpdatedTournament = {
        ...mockDbTournament,
        name: 'Updated Tournament',
        buyin: 200,
        updated_at: '2024-01-01T13:00:00Z'
      }

      setMockData(mockUpdatedTournament)

      const result = await TournamentService.updateTournament('1', updates)

      expect(result).toBeTruthy()
      expect(result?.name).toBe('Updated Tournament')
      expect(result?.buyin).toBe(200)
    })
  })

  describe('deleteTournament', () => {
    it('should delete tournament successfully', async () => {
      setMockError(null)

      const result = await TournamentService.deleteTournament('1')

      expect(result).toBe(true)
    })

    it('should handle deletion errors', async () => {
      setMockError({ message: 'Deletion failed' })

      await expect(TournamentService.deleteTournament('1'))
        .rejects.toThrow('Failed to delete tournament: Deletion failed')
    })
  })
})