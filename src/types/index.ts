// Базовые типы для PokerTracker Pro

export interface User {
  id: string
  username: string | null
  email: string
  avatarUrl: string | null
  telegramId: number | null
  preferences: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface Tournament {
  id: string
  userId: string
  name: string
  date: string
  venue: string | null
  buyin: number
  tournamentType: 'freezeout' | 'rebuy' | 'addon' | 'bounty' | 'satellite'
  structure: string | null
  participants: number | null
  prizePool: number | null
  blindLevels: string | null
  startingStack: number | null
  ticketImageUrl: string | null
  notes: string | null
  status: 'registered' | 'playing' | 'finished' | 'cancelled'
  createdAt: string
  updatedAt: string
  result?: TournamentResult
  photos?: TournamentPhoto[]
}

export interface TournamentResult {
  id: string
  tournamentId: string
  position: number
  payout: number
  roi: number
  notes: string | null
  createdAt: string
}

export interface TournamentPhoto {
  id: string
  tournamentId: string
  photoUrl: string
  photoType: 'ticket' | 'result' | 'general'
  caption: string | null
  createdAt: string
}

export interface UserSettings {
  id: string
  userId: string
  currency: 'USD' | 'EUR' | 'RUB'
  timezone: string
  notifications: {
    telegram: boolean
    email: boolean
  }
  privacy: {
    profilePublic: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface UserStats {
  totalTournaments: number
  totalBuyin: number
  totalWinnings: number
  profit: number
  roi: number
  itmRate: number
  bestPosition: number | null
  bestPayout: number | null
  firstTournament: string | null
  lastTournament: string | null
}

// Типы для форм
export interface TournamentFormData {
  name: string
  date: string
  venue?: string
  buyin: number
  tournamentType: Tournament['tournamentType']
  structure?: string
  participants?: number
  prizePool?: number
  blindLevels?: string
  startingStack?: number
  notes?: string
}

export interface TournamentResultFormData {
  position: number
  payout: number
  notes?: string
}

export interface AuthFormData {
  email: string
  password: string
  username?: string
}

// Типы для OCR
export interface OCRResult {
  success: boolean
  data?: Partial<TournamentFormData>
  error?: string
  confidence?: number
}

// Типы для аналитики
export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface AnalyticsData {
  profitByMonth: ChartDataPoint[]
  roiByTournamentType: ChartDataPoint[]
  winrateByVenue: ChartDataPoint[]
  bankrollHistory: ChartDataPoint[]
}

// Утилитарные типы
export type ApiResponse<T = any> = {
  data: T
  error?: string
  success: boolean
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface PaginationParams {
  page: number
  limit: number
}

export interface SortParams {
  field: string
  direction: 'asc' | 'desc'
}

export interface FilterParams {
  dateFrom?: string
  dateTo?: string
  venue?: string
  tournamentType?: Tournament['tournamentType']
  minBuyin?: number
  maxBuyin?: number
}

export interface TournamentFormData {
  name: string
  date: string
  venue?: string
  buyin: number
  tournamentType: string
  structure?: string
  participants?: number
  prizePool?: number
  blindLevels?: string
  startingStack?: number
  notes?: string
}
