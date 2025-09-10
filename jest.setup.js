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
  supabase: mockSupabaseClient,
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
