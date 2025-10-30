/**
 * Интеграционные тесты для API
 */

import { NextRequest, NextResponse } from 'next/server';
import { mockTournaments, addTournament, deleteTournament, getTournamentById, updateTournament, mockResultHistory } from '@/data/mockData';
import { mockUser } from '@/data/mockData';
import { addResultHistoryEntry } from '@/data/mockData';

// Mock Supabase для API тестов
jest.mock('@/lib/supabase', () => ({
  supabase: null, // Будет использовать fallback к mockData
  supabaseAdmin: null,
}));

// Mock Next.js server components для API routes
// This is necessary because Next.js 13+ API routes use Web API Request/Response objects
// which are not fully compatible with node-mocks-http or standard Jest mocks by default.
// We need to ensure `request.json()` and `NextResponse.json()` work as expected.

// Глобальный мок для NextResponse
const originalNextResponse = global.NextResponse;
beforeAll(() => {
  // Create a custom implementation of NextResponse for tests
  global.NextResponse = {
    json: jest.fn().mockImplementation((data, init) => {
      return {
        status: init?.status || 200,
        headers: new Headers(init?.headers),
        json: async () => data,
      };
    }),
  } as unknown as typeof NextResponse;
});

afterAll(() => {
  global.NextResponse = originalNextResponse;
});

// Мок для NextRequest
function createMockRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
}) {
  const { method = 'GET', url = 'http://localhost:3000', headers = {}, body } = options;
  
  const mockRequest = {
    method,
    url,
    headers: new Headers(headers),
    nextUrl: new URL(url),
    json: jest.fn().mockResolvedValue(body),
    searchParams: new URLSearchParams(new URL(url).search),
  } as unknown as NextRequest;

  return mockRequest;
}

describe('API Integration Tests', () => {
  beforeEach(() => {
    // Reset mock data before each test to ensure isolation
    mockTournaments.splice(0, mockTournaments.length);
    mockResultHistory.splice(0, mockResultHistory.length);
    
    // Add sample test data
    addTournament({
      id: 'test-tournament-1',
      userId: 'test-user',
      name: 'Initial Test Tournament',
      date: '2024-01-01T00:00:00Z',
      venue: 'Test Venue',
      buyin: 100,
    }, 'test-user');
    
    addTournament({
      id: 'test-tournament-to-delete',
      userId: 'test-user',
      name: 'Tournament to Delete',
      date: '2024-01-02T00:00:00Z',
      venue: 'Delete Venue',
      buyin: 50,
    }, 'test-user');
    
    addResultHistoryEntry({
      tournamentId: 'test-tournament-1',
      userId: 'test-user',
      changeType: 'created',
      newData: { position: 1, payout: 200 },
      changedFields: ['position', 'payout'],
      reason: 'Initial result',
      timestamp: '2024-01-01T01:00:00Z'
    });
  });

  describe('/api/tournaments', () => {
    it('should handle GET request for tournaments', async () => {
      const { GET } = require('@/app/api/tournaments/route');
      
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/tournaments?userId=test-user',
      });

      const response = await GET(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.tournaments)).toBe(true);
      expect(data.tournaments.length).toBeGreaterThan(0);
      expect(data.tournaments[0].userId).toBe('test-user');
    });

    it('should handle POST request for creating tournament', async () => {
      const { POST } = require('@/app/api/tournaments/route');
      
      const tournamentData = {
        userId: 'test-user',
        name: 'New Test Tournament',
        buyin: 150,
        venue: 'New Test Casino',
        date: '2024-12-31T20:00:00Z',
      };

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/tournaments',
        body: tournamentData,
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.tournament.name).toBe('New Test Tournament');
      expect(getTournamentById(data.tournament.id)).toBeDefined();
    });

    it('should handle DELETE request for tournament', async () => {
      const { DELETE } = require('@/app/api/tournaments/route');
      
      const tournamentToDelete = mockTournaments.find(t => t.id === 'test-tournament-to-delete');
      expect(tournamentToDelete).toBeDefined();

      const request = createMockRequest({
        method: 'DELETE',
        url: `http://localhost:3000/api/tournaments?id=${tournamentToDelete?.id}`,
      });

      const response = await DELETE(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(getTournamentById('test-tournament-to-delete')).toBeNull();
    });
  });

  describe('/api/tournaments/[id]', () => {
    it('should handle GET request for specific tournament', async () => {
      const { GET } = require('@/app/api/tournaments/[id]/route');
      
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/tournaments/test-tournament-1',
      });

      // Mock params
      const params = { params: { id: 'test-tournament-1' } };
      
      const response = await GET(request, params);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.tournament.id).toBe('test-tournament-1');
    });

    it('should handle PUT request for updating tournament', async () => {
      const { PUT } = require('@/app/api/tournaments/[id]/route');
      
      const updateData = {
        result: {
          position: 1,
          payout: 500,
          notes: 'Great game!',
        },
      };

      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3000/api/tournaments/test-tournament-1',
        body: updateData,
      });

      const params = { params: { id: 'test-tournament-1' } };
      
      const response = await PUT(request, params);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.tournament.result).toBeDefined();
      expect(data.tournament.result.position).toBe(1);
      expect(data.tournament.result.payout).toBe(500);
    });
  });
});

describe('Bot API Tests', () => {
  beforeEach(() => {
    // Reset mock data for bot tests
    mockTournaments.splice(0, mockTournaments.length);
    
    addTournament({
      id: 'bot-test-tournament-1',
      userId: mockUser.id,
      name: 'Bot Test Tournament',
      date: '2024-01-01T00:00:00Z',
      venue: 'Bot Venue',
      buyin: 100,
    }, mockUser.id);
  });

  describe('/api/bot/polling', () => {
    it('should handle bot polling start', async () => {
      const { POST } = require('@/app/api/bot/polling/route');
      
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/bot/polling',
        body: { command: 'start', telegramId: mockUser.telegramId },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBeDefined();
    });

    it('should handle bot polling stop', async () => {
      const { POST } = require('@/app/api/bot/polling/route');
      
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/bot/polling',
        body: { command: 'stop', telegramId: mockUser.telegramId },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBeDefined();
    });
  });
});

describe('Data Consistency Tests', () => {
  beforeEach(() => {
    // Reset mock data for consistency tests
    mockTournaments.splice(0, mockTournaments.length);
  });

  it('should maintain data consistency between bot and frontend', async () => {
    const { POST: createTournamentApi } = require('@/app/api/tournaments/route');
    const { GET: getTournamentsApi } = require('@/app/api/tournaments/route');
    
    // Create tournament via API
    const tournamentData = {
      userId: 'consistency-test',
      name: 'Consistency Test Tournament',
      buyin: 200,
      venue: 'Test Venue',
      date: new Date().toISOString(),
    };

    const createReq = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/tournaments',
      body: tournamentData,
    });

    const createResponse = await createTournamentApi(createReq);
    expect(createResponse.status).toBe(201);
    
    const createData = await createResponse.json();
    expect(createData.success).toBe(true);

    // Fetch tournaments via API
    const getReq = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/tournaments?userId=consistency-test',
    });

    const getResponse = await getTournamentsApi(getReq);
    expect(getResponse.status).toBe(200);
    
    const getData = await getResponse.json();
    expect(getData.success).toBe(true);
    
    // Check if created tournament exists in the list
    const createdTournament = getData.tournaments.find(
      (t: any) => t.name === 'Consistency Test Tournament'
    );
    expect(createdTournament).toBeDefined();
    expect(createdTournament.buyin).toBe(200);
  });

  it('should handle venue priority correctly', async () => {
    const { POST: createTournamentApi } = require('@/app/api/tournaments/route');
    
    // Test tournament creation with venue
    const tournamentData = {
      userId: 'venue-test',
      name: 'Venue Priority Test',
      buyin: 150,
      venue: 'Priority Casino', // This should be used
      date: new Date().toISOString(),
    };

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/tournaments',
      body: tournamentData,
    });

    const response = await createTournamentApi(req);
    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.tournament.venue).toBe('Priority Casino');
  });
});