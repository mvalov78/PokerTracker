// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Mock Next.js server APIs
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, init) => ({
    url: url || 'http://localhost:3000',
    method: init?.method || 'GET',
    headers: new Map(),
    json: jest.fn(() => Promise.resolve({})),
    ...init
  })),
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data)
    }))
  }
}))

// Простая система мокирования Supabase
let mockData = null
let mockError = null

const createMockChain = () => ({
  from: jest.fn(() => createMockChain()),
  select: jest.fn(() => createMockChain()),
  insert: jest.fn(() => createMockChain()),
  update: jest.fn(() => createMockChain()),
  upsert: jest.fn(() => createMockChain()),
  delete: jest.fn(() => createMockChain()),
  eq: jest.fn(() => createMockChain()),
  single: jest.fn(() => Promise.resolve({ data: mockData, error: mockError })),
  order: jest.fn(() => createMockChain()),
  limit: jest.fn(() => createMockChain()),
  not: jest.fn(() => createMockChain()),
  in: jest.fn(() => createMockChain()),
  then: jest.fn((callback) => callback({ data: mockData, error: mockError })),
  catch: jest.fn(),
})

const mockSupabaseClient = createMockChain()

jest.mock('@/lib/supabase', () => ({
  createClientComponentClient: jest.fn(() => mockSupabaseClient),
  createServerComponentClient: jest.fn(() => mockSupabaseClient),
  createAdminClient: jest.fn(() => mockSupabaseClient),
  supabase: mockSupabaseClient,
  supabaseAdmin: mockSupabaseClient,
  getProfile: jest.fn(() => Promise.resolve({
    id: 'mock-user-id',
    username: 'testuser',
    role: 'player',
    telegram_id: null
  })),
  createProfile: jest.fn(() => Promise.resolve({
    id: 'mock-user-id',
    username: 'testuser',
    role: 'player',
    telegram_id: null
  })),
  updateProfile: jest.fn(() => Promise.resolve({
    id: 'mock-user-id',
    username: 'testuser',
    role: 'player',
    telegram_id: null
  })),
  getProfileByTelegramId: jest.fn(() => Promise.resolve(null)),
  isAdmin: jest.fn(() => Promise.resolve(false)),
  getUserOrCreate: jest.fn(() => Promise.resolve({
    id: 'mock-user-id',
    username: 'testuser',
    role: 'player',
    telegram_id: 123456789
  }))
}))

// Глобальные функции для управления моками
global.mockSupabase = mockSupabaseClient
global.setMockData = (data) => { mockData = data }
global.setMockError = (error) => { mockError = error }
global.resetMocks = () => { 
  mockData = null
  mockError = null
  jest.clearAllMocks()
}
