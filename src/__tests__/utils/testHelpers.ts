/**
 * Test helper utilities for common testing patterns
 */

import type { Tournament, TournamentResult } from '@/types'

export function createMockTournament(overrides?: Partial<Tournament>): Tournament {
  return {
    id: 'tournament_123',
    name: 'Test Tournament',
    venue: 'Test Casino',
    buyin: 100,
    date: '2024-01-15T18:00:00Z',
    startingStack: 20000,
    structure: "NL Hold'em",
    type: 'tournament',
    userId: 'user_123',
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
    participants: 100,
    ...overrides,
  }
}

export function createMockTournamentResult(overrides?: Partial<TournamentResult>): TournamentResult {
  return {
    position: 5,
    payout: 200,
    notes: 'Good game',
    ...overrides,
  }
}

export function createMockTournamentWithResult(
  tournamentOverrides?: Partial<Tournament>,
  resultOverrides?: Partial<TournamentResult>
): Tournament {
  return {
    ...createMockTournament(tournamentOverrides),
    result: createMockTournamentResult(resultOverrides),
  }
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function mockFetch(response: any, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  } as Response)
}

export function mockFetchError(error: Error) {
  global.fetch = jest.fn().mockRejectedValue(error)
}

export function resetFetchMock() {
  if (global.fetch && jest.isMockFunction(global.fetch)) {
    (global.fetch as jest.Mock).mockReset()
  }
}

export interface MockOCRResult {
  success: boolean
  confidence: number
  data?: {
    name: string
    buyin: number
    date: string
    venue: string
    startingStack?: number
    tournamentType?: string
    structure?: string
    participants?: number
    prizePool?: number
    blindLevels?: string
  }
  error?: string
}

export function createMockOCRResult(overrides?: Partial<MockOCRResult>): MockOCRResult {
  return {
    success: true,
    confidence: 0.95,
    data: {
      name: 'RPF Tournament #123',
      buyin: 275,
      date: '2024-01-15T18:00:00Z',
      venue: 'Russian Poker Federation',
      startingStack: 25000,
      tournamentType: 'freezeout',
      structure: "NL Hold'em",
      participants: 120,
    },
    ...overrides,
  }
}

export function mockConsole() {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  }

  beforeEach(() => {
    console.log = jest.fn()
    console.error = jest.fn()
    console.warn = jest.fn()
    console.info = jest.fn()
  })

  afterEach(() => {
    console.log = originalConsole.log
    console.error = originalConsole.error
    console.warn = originalConsole.warn
    console.info = originalConsole.info
  })
}

export function expectToContainText(element: HTMLElement, text: string) {
  expect(element.textContent).toContain(text)
}

export function expectNotToContainText(element: HTMLElement, text: string) {
  expect(element.textContent).not.toContain(text)
}

export const testUser = {
  id: 'user_123',
  telegramId: '123456789',
  email: 'test@example.com',
  username: 'testuser',
}

export const testDates = {
  past: '2023-01-01T18:00:00Z',
  now: new Date().toISOString(),
  future: '2025-12-31T18:00:00Z',
}








