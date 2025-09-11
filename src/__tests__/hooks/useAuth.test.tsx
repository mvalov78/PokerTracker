/**
 * Тесты для useAuth хука
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import * as supabaseLib from '@/lib/supabase'

// Мокаем Supabase
jest.mock('@/lib/supabase')

describe('useAuth Hook Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.resetMocks?.()
  })

  test('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBe(null)
    expect(result.current.profile).toBe(null)
  })

  test('should handle successful sign in', async () => {
    const mockUser = { id: 'user-id', email: 'test@example.com' }
    const mockProfile = { id: 'user-id', username: 'testuser', role: 'player' }

    // Мокаем успешный вход
    const mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(() => Promise.resolve({
          data: { user: mockUser },
          error: null
        })),
        onAuthStateChange: jest.fn((callback) => {
          setTimeout(() => callback('SIGNED_IN', { user: mockUser }), 0)
          return { data: { subscription: { unsubscribe: jest.fn() } } }
        }),
        getSession: jest.fn(() => Promise.resolve({
          data: { session: { user: mockUser } },
          error: null
        }))
      }
    }

    ;(supabaseLib.createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)
    ;(supabaseLib.getProfile as jest.Mock).mockResolvedValue(mockProfile)

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signIn('test@example.com', 'password')
    })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.profile).toEqual(mockProfile)
    })
  })

  test('should handle sign in error', async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(() => Promise.resolve({
          data: { user: null },
          error: { message: 'Invalid credentials' }
        })),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } }
        })),
        getSession: jest.fn(() => Promise.resolve({
          data: { session: null },
          error: null
        }))
      }
    }

    ;(supabaseLib.createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signIn('test@example.com', 'wrongpassword')
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBe(null)
  })

  test('should handle sign up', async () => {
    const mockUser = { id: 'new-user-id', email: 'new@example.com' }

    const mockSupabase = {
      auth: {
        signUp: jest.fn(() => Promise.resolve({
          data: { user: mockUser },
          error: null
        })),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } }
        })),
        getSession: jest.fn(() => Promise.resolve({
          data: { session: null },
          error: null
        }))
      }
    }

    ;(supabaseLib.createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signUp('new@example.com', 'password')
    })

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password'
    })
  })

  test('should handle sign out', async () => {
    const mockSupabase = {
      auth: {
        signOut: jest.fn(() => Promise.resolve({ error: null })),
        onAuthStateChange: jest.fn((callback) => {
          setTimeout(() => callback('SIGNED_OUT', null), 0)
          return { data: { subscription: { unsubscribe: jest.fn() } } }
        }),
        getSession: jest.fn(() => Promise.resolve({
          data: { session: null },
          error: null
        }))
      }
    }

    ;(supabaseLib.createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  test('should handle Google OAuth', async () => {
    const mockSupabase = {
      auth: {
        signInWithOAuth: jest.fn(() => Promise.resolve({
          data: { url: 'https://oauth-url.com' },
          error: null
        })),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } }
        })),
        getSession: jest.fn(() => Promise.resolve({
          data: { session: null },
          error: null
        }))
      }
    }

    ;(supabaseLib.createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signInWithGoogle()
    })

    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  })
})

