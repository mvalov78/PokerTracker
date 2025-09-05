import type { User, Tournament, TournamentResult, UserStats } from '@/types'

// Мок пользователь
export const mockUser: User = {
  id: 'user-1',
  username: 'pokerking',
  email: 'player@example.com',
  avatarUrl: null,
  telegramId: null,
  preferences: {
    theme: 'dark',
    language: 'ru'
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

// Мок результаты турниров
export const mockTournamentResults: TournamentResult[] = [
  {
    id: 'result-1',
    tournamentId: 'tournament-1',
    position: 3,
    payout: 850,
    roi: 70,
    notes: 'Хорошая игра в финальном столе',
    createdAt: '2024-01-15T20:00:00Z'
  },
  {
    id: 'result-2',
    tournamentId: 'tournament-2',
    position: 15,
    payout: 0,
    roi: -100,
    notes: 'Неудачный блеф на префлопе',
    createdAt: '2024-01-10T18:30:00Z'
  },
  {
    id: 'result-3',
    tournamentId: 'tournament-3',
    position: 1,
    payout: 2500,
    roi: 150,
    notes: 'Победа! Отличная игра',
    createdAt: '2024-01-05T22:00:00Z'
  },
  {
    id: 'result-4',
    tournamentId: 'tournament-4',
    position: 8,
    payout: 200,
    roi: -60,
    notes: 'ITM, но мог играть лучше',
    createdAt: '2024-01-01T19:45:00Z'
  }
]

// Ключ для localStorage
const TOURNAMENTS_STORAGE_KEY = 'poker-tracker-tournaments'

// Инициализация мок данных турниров
const initialTournaments: Tournament[] = [
  {
    id: 'tournament-1',
    userId: 'user-1',
    name: 'Sunday Million',
    date: '2024-01-15T18:00:00Z',
    venue: 'PokerStars Casino',
    buyin: 500,
    tournamentType: 'freezeout',
    structure: 'NL Hold\'em',
    participants: 250,
    prizePool: 125000,
    blindLevels: '15 минут',
    startingStack: 30000,
    ticketImageUrl: null,
    notes: 'Крупный воскресный турнир',
    status: 'finished',
    createdAt: '2024-01-15T17:00:00Z',
    updatedAt: '2024-01-15T20:00:00Z',
    result: mockTournamentResults[0]
  },
  {
    id: 'tournament-2',
    userId: 'user-1',
    name: 'Daily Deep Stack',
    date: '2024-01-10T17:00:00Z',
    venue: 'Aria Casino',
    buyin: 300,
    tournamentType: 'rebuy',
    structure: 'NL Hold\'em',
    participants: 180,
    prizePool: 54000,
    blindLevels: '20 минут',
    startingStack: 50000,
    ticketImageUrl: null,
    notes: 'Глубокий стек, много времени на игру',
    status: 'finished',
    createdAt: '2024-01-10T16:00:00Z',
    updatedAt: '2024-01-10T18:30:00Z',
    result: mockTournamentResults[1]
  },
  {
    id: 'tournament-3',
    userId: 'user-1',
    name: 'Friday Night Special',
    date: '2024-01-05T19:00:00Z',
    venue: 'Bellagio',
    buyin: 1000,
    tournamentType: 'freezeout',
    structure: 'NL Hold\'em',
    participants: 120,
    prizePool: 120000,
    blindLevels: '30 минут',
    startingStack: 25000,
    ticketImageUrl: null,
    notes: 'Престижный пятничный турнир',
    status: 'finished',
    createdAt: '2024-01-05T18:00:00Z',
    updatedAt: '2024-01-05T22:00:00Z',
    result: mockTournamentResults[2]
  },
  {
    id: 'tournament-4',
    userId: 'user-1',
    name: 'New Year Bounty',
    date: '2024-01-01T18:00:00Z',
    venue: 'Wynn Casino',
    buyin: 500,
    tournamentType: 'bounty',
    structure: 'NL Hold\'em',
    participants: 200,
    prizePool: 100000,
    blindLevels: '20 минут',
    startingStack: 40000,
    ticketImageUrl: null,
    notes: 'Новогодний турнир с баунти',
    status: 'finished',
    createdAt: '2024-01-01T17:00:00Z',
    updatedAt: '2024-01-01T19:45:00Z',
    result: mockTournamentResults[3]
  },
  {
    id: 'tournament-5',
    userId: 'user-1',
    name: 'Upcoming Tournament',
    date: '2024-02-15T18:00:00Z',
    venue: 'MGM Grand',
    buyin: 750,
    tournamentType: 'freezeout',
    structure: 'NL Hold\'em',
    participants: null,
    prizePool: null,
    blindLevels: '25 минут',
    startingStack: 35000,
    ticketImageUrl: null,
    notes: 'Предстоящий турнир',
    status: 'registered',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z'
  }
]

// Функции для работы с localStorage
function loadTournamentsFromStorage(): Tournament[] {
  if (typeof window === 'undefined') {
    return initialTournaments
  }
  
  try {
    const stored = localStorage.getItem(TOURNAMENTS_STORAGE_KEY)
    if (stored) {
      const parsedTournaments = JSON.parse(stored)
      return Array.isArray(parsedTournaments) ? parsedTournaments : initialTournaments
    }
  } catch (error) {
    console.error('Error loading tournaments from localStorage:', error)
  }
  
  return initialTournaments
}

function saveTournamentsToStorage(tournaments: Tournament[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(tournaments))
  } catch (error) {
    console.error('Error saving tournaments to localStorage:', error)
  }
}

// Инициализация турниров с загрузкой из localStorage
export let mockTournaments: Tournament[] = loadTournamentsFromStorage()

// Функция для инициализации данных (вызывается при первом запуске)
export function initializeTournamentData(): void {
  if (typeof window === 'undefined') return
  
  // Проверяем, есть ли данные в localStorage
  const stored = localStorage.getItem(TOURNAMENTS_STORAGE_KEY)
  if (!stored) {
    // Если данных нет, сохраняем начальные данные
    saveTournamentsToStorage(initialTournaments)
    mockTournaments = [...initialTournaments]
  } else {
    // Если данные есть, загружаем их
    mockTournaments = loadTournamentsFromStorage()
  }
}

// Мок статистика пользователя
export const mockUserStats: UserStats = {
  totalTournaments: 4,
  totalBuyin: 2300,
  totalWinnings: 3550,
  profit: 1250,
  roi: 54.35,
  itmRate: 75,
  bestPosition: 1,
  bestPayout: 2500,
  firstTournament: '2024-01-01T18:00:00Z',
  lastTournament: '2024-01-15T18:00:00Z'
}

// Утилитарные функции для работы с мок данными

export const getTournamentsByUser = (userId: string): Tournament[] => {
  return mockTournaments.filter(t => t.userId === userId)
}

export const getRecentTournaments = (userId: string, limit = 5): Tournament[] => {
  return mockTournaments
    .filter(t => t.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
}

export const calculateUserStats = (userId: string): UserStats => {
  const userTournaments = getTournamentsByUser(userId)
  const finishedTournaments = userTournaments.filter(t => t.status === 'finished' && t.result)
  
  if (finishedTournaments.length === 0) {
    return {
      totalTournaments: 0,
      totalBuyin: 0,
      totalWinnings: 0,
      profit: 0,
      roi: 0,
      itmRate: 0,
      bestPosition: null,
      bestPayout: null,
      firstTournament: null,
      lastTournament: null
    }
  }

  const totalBuyin = finishedTournaments.reduce((sum, t) => sum + t.buyin, 0)
  const totalWinnings = finishedTournaments.reduce((sum, t) => sum + (t.result?.payout || 0), 0)
  const profit = totalWinnings - totalBuyin
  const roi = totalBuyin > 0 ? (profit / totalBuyin) * 100 : 0
  const itmTournaments = finishedTournaments.filter(t => (t.result?.payout || 0) > 0)
  const itmRate = finishedTournaments.length > 0 ? (itmTournaments.length / finishedTournaments.length) * 100 : 0
  
  const positions = finishedTournaments.map(t => t.result?.position || 999)
  const payouts = finishedTournaments.map(t => t.result?.payout || 0)
  
  return {
    totalTournaments: finishedTournaments.length,
    totalBuyin,
    totalWinnings,
    profit,
    roi: Math.round(roi * 100) / 100,
    itmRate: Math.round(itmRate * 100) / 100,
    bestPosition: Math.min(...positions),
    bestPayout: Math.max(...payouts),
    firstTournament: finishedTournaments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]?.date || null,
    lastTournament: finishedTournaments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date || null
  }
}

// Мок данные для графиков
export const mockProfitChartData = [
  { date: '2024-01-01', profit: -500, cumulative: -500 },
  { date: '2024-01-05', profit: 1500, cumulative: 1000 },
  { date: '2024-01-10', profit: -300, cumulative: 700 },
  { date: '2024-01-15', profit: 350, cumulative: 1050 },
  { date: '2024-01-20', profit: -200, cumulative: 850 },
  { date: '2024-01-25', profit: 400, cumulative: 1250 },
]

export const mockROIChartData = [
  { type: 'Freezeout', roi: 45.2, tournaments: 8 },
  { type: 'Rebuy', roi: -12.5, tournaments: 3 },
  { type: 'Bounty', roi: 78.3, tournaments: 5 },
  { type: 'Satellite', roi: 23.1, tournaments: 2 },
  { type: 'Deep Stack', roi: 15.7, tournaments: 6 },
]

export const mockPositionData = [
  { name: '1-3 место', value: 4, color: '#10b981' },
  { name: '4-10 место', value: 6, color: '#f59e0b' },
  { name: '11-20 место', value: 3, color: '#f97316' },
  { name: '20+ место', value: 2, color: '#ef4444' },
]

export const mockVenueStats = [
  { venue: 'PokerStars Casino', tournaments: 5, profit: 850, roi: 42.5 },
  { venue: 'Aria Casino', tournaments: 3, profit: -150, roi: -8.3 },
  { venue: 'Bellagio', tournaments: 4, profit: 1200, roi: 75.0 },
  { venue: 'Wynn Casino', tournaments: 2, profit: -200, roi: -20.0 },
  { venue: 'MGM Grand', tournaments: 1, profit: 0, roi: 0 },
]

export const mockBankrollHistory = [
  { date: '2023-12-01', bankroll: 5000 },
  { date: '2024-01-01', bankroll: 4500 },
  { date: '2024-01-05', bankroll: 6000 },
  { date: '2024-01-10', bankroll: 5700 },
  { date: '2024-01-15', bankroll: 6050 },
  { date: '2024-01-20', bankroll: 5850 },
  { date: '2024-01-25', bankroll: 6250 },
]

// Функции для работы с турнирами
export function getTournamentById(id: string): Tournament | null {
  return mockTournaments.find(tournament => tournament.id === id) || null
}

// Функция для получения всех турниров
export function getAllTournaments(): Tournament[] {
  return [...mockTournaments]
}

// Функция для добавления нового турнира
export function addTournament(tournamentData: Partial<Tournament>): Tournament {
  const newTournament: Tournament = {
    id: `tournament-${Date.now()}`,
    userId: 'user-1',
    name: tournamentData.name || '',
    date: tournamentData.date || new Date().toISOString(),
    venue: tournamentData.venue || '',
    buyin: tournamentData.buyin || 0,
    tournamentType: tournamentData.tournamentType || 'freezeout',
    status: 'registered',
    structure: tournamentData.structure || '',
    participants: tournamentData.participants || undefined,
    prizePool: tournamentData.prizePool || undefined,
    blindLevels: tournamentData.blindLevels || undefined,
    startingStack: tournamentData.startingStack || undefined,
    notes: tournamentData.notes || undefined,
    ticketImageUrl: undefined,
    result: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  // Добавляем турнир в начало массива (последние сверху)
  mockTournaments.unshift(newTournament)
  
  // Сохраняем в localStorage
  saveTournamentsToStorage(mockTournaments)
  
  return newTournament
}

// Функция для обновления турнира
export function updateTournament(id: string, updates: Partial<Tournament>): Tournament | null {
  const index = mockTournaments.findIndex(t => t.id === id)
  if (index === -1) return null
  
  mockTournaments[index] = {
    ...mockTournaments[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  // Сохраняем в localStorage
  saveTournamentsToStorage(mockTournaments)
  
  return mockTournaments[index]
}

// Функция для удаления турнира
export function deleteTournament(id: string): boolean {
  const index = mockTournaments.findIndex(t => t.id === id)
  if (index === -1) return false
  
  mockTournaments.splice(index, 1)
  
  // Сохраняем в localStorage
  saveTournamentsToStorage(mockTournaments)
  
  return true
}
