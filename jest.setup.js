// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock ResizeObserver
class ResizeObserverMock {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
}

global.ResizeObserver = ResizeObserverMock

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

// Mock Next.js server components
global.Request = class Request {
  constructor(input, init) {
    this.url = input
    this.method = init?.method || 'GET'
    this.headers = new Map(Object.entries(init?.headers || {}))
    this._body = init?.body
  }
  
  get body() {
    return this._body
  }
  
  async json() {
    if (typeof this._body === 'string') {
      return JSON.parse(this._body)
    }
    if (typeof this._body === 'object' && this._body !== null) {
      return this._body
    }
    return {}
  }
  
  async text() {
    if (typeof this._body === 'string') {
      return this._body
    }
    if (typeof this._body === 'object' && this._body !== null) {
      return JSON.stringify(this._body)
    }
    return ''
  }
}

global.Response = class Response {
  constructor(body, init) {
    this.body = body
    this.status = init?.status || 200
    this.headers = new Map(Object.entries(init?.headers || {}))
  }
  
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
  }
}

global.NextResponse = {
  json: (data, init) => new Response(JSON.stringify(data), init),
}

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
  rpc: jest.fn(() => Promise.resolve({ data: mockData, error: mockError })),
  then: jest.fn((callback) => callback({ data: mockData, error: mockError })),
  catch: jest.fn(),
  auth: {
    getUser: jest.fn(() => Promise.resolve({ 
      data: { user: { id: 'test-user-id' } }, 
      error: null 
    })),
    getSession: jest.fn(() => Promise.resolve({ 
      data: { session: { user: { id: 'test-user-id' } } }, 
      error: null 
    })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    onAuthStateChange: jest.fn(() => ({
      data: {
        subscription: {
          unsubscribe: jest.fn()
        }
      }
    })),
  }
})

const mockSupabaseClient = createMockChain()

// Mock для createClientComponentClient
const mockCreateClientComponentClient = jest.fn(() => mockSupabaseClient)

// Mock для createAdminClient
const mockCreateAdminClient = jest.fn(() => mockSupabaseClient)

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
  createClientComponentClient: mockCreateClientComponentClient,
  createAdminClient: mockCreateAdminClient,
  createServerComponentClient: jest.fn(() => mockSupabaseClient),
  supabaseAdmin: mockSupabaseClient,
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
