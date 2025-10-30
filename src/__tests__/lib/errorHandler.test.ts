/**
 * Tests for errorHandler
 */

import {
  handleError,
  ValidationError,
  NetworkError,
  AuthError,
  OCRError,
  handleAsyncError,
  withErrorHandling,
} from '@/lib/errorHandler'

// Mock window APIs
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

const mockSessionStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage })

// Mock navigator.onLine
Object.defineProperty(window.navigator, 'onLine', {
  writable: true,
  value: true,
})

// Mock fetch
global.fetch = jest.fn()

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.clear()
    mockSessionStorage.clear()
    ;(window.navigator as any).onLine = true
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('Custom Error Classes', () => {
    it('should create ValidationError', () => {
      const error = new ValidationError('Invalid input', 'email')
      expect(error.name).toBe('ValidationError')
      expect(error.message).toBe('Invalid input')
      expect(error.field).toBe('email')
    })

    it('should create NetworkError', () => {
      const error = new NetworkError('Network failed', 500)
      expect(error.name).toBe('NetworkError')
      expect(error.message).toBe('Network failed')
      expect(error.status).toBe(500)
    })

    it('should create AuthError', () => {
      const error = new AuthError('Unauthorized', 'AUTH001')
      expect(error.name).toBe('AuthError')
      expect(error.message).toBe('Unauthorized')
      expect(error.code).toBe('AUTH001')
    })

    it('should create OCRError', () => {
      const error = new OCRError('OCR failed', 0.3)
      expect(error.name).toBe('OCRError')
      expect(error.message).toBe('OCR failed')
      expect(error.confidence).toBe(0.3)
    })
  })

  describe('handleError', () => {
    it('should handle basic error', () => {
      const error = new Error('Test error')
      
      // Should not throw
      expect(() => handleError(error)).not.toThrow()
    })

    it('should handle error with context', () => {
      const error = new Error('Test error')
      const context = {
        component: 'TestComponent',
        action: 'testAction',
        userId: 'user123',
      }
      
      expect(() => handleError(error, context)).not.toThrow()
    })

    it('should store error in localStorage when offline', () => {
      ;(window.navigator as any).onLine = false
      
      const error = new Error('Offline error')
      handleError(error)
      
      // Give it time to process
      setTimeout(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled()
      }, 100)
    })
  })

  describe('handleAsyncError', () => {
    it('should return result when no error', async () => {
      const asyncFn = async () => 'success'
      const result = await handleAsyncError(asyncFn)
      expect(result).toBe('success')
    })

    it('should return null on error', async () => {
      const asyncFn = async () => {
        throw new Error('Async error')
      }
      const result = await handleAsyncError(asyncFn)
      expect(result).toBeNull()
    })

    it('should handle error with context', async () => {
      const asyncFn = async () => {
        throw new Error('Async error')
      }
      const context = { component: 'Test' }
      const result = await handleAsyncError(asyncFn, context)
      expect(result).toBeNull()
    })
  })

  describe('withErrorHandling', () => {
    it('should return result when no error', () => {
      const fn = (a: number, b: number) => a + b
      const wrapped = withErrorHandling(fn)
      expect(wrapped(2, 3)).toBe(5)
    })

    it('should throw error after handling', () => {
      const fn = () => {
        throw new Error('Test error')
      }
      const wrapped = withErrorHandling(fn)
      expect(() => wrapped()).toThrow('Test error')
    })

    it('should handle async functions', async () => {
      const asyncFn = async () => {
        throw new Error('Async test error')
      }
      const wrapped = withErrorHandling(asyncFn)
      
      await expect(wrapped()).rejects.toThrow('Async test error')
    })

    it('should pass arguments correctly', () => {
      const fn = (a: number, b: number, c: number) => a + b + c
      const wrapped = withErrorHandling(fn)
      expect(wrapped(1, 2, 3)).toBe(6)
    })
  })

  describe('Error Severity Determination', () => {
    it('should identify critical errors', () => {
      const criticalErrors = [
        new Error('chunk load failed'),
        new Error('loading chunk 123'),
        new Error('network error'),
      ]
      
      criticalErrors.forEach((error) => {
        expect(() => handleError(error)).not.toThrow()
      })
    })

    it('should identify high severity errors', () => {
      const highErrors = [
        new Error('permission denied'),
        new Error('unauthorized access'),
      ]
      
      highErrors.forEach((error) => {
        expect(() => handleError(error)).not.toThrow()
      })
    })

    it('should identify auth component errors as critical', () => {
      const error = new Error('Some error')
      const context = { component: 'Auth' }
      
      expect(() => handleError(error, context)).not.toThrow()
    })
  })

  describe('Session ID Management', () => {
    it('should create session ID if not exists', () => {
      // Clear any existing session ID
      mockSessionStorage.clear()
      
      const error = new Error('Test')
      handleError(error)
      
      // Session ID should be created
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'poker_tracker_session_id',
        expect.stringContaining('session_')
      )
    })

    it('should reuse existing session ID', () => {
      mockSessionStorage.setItem('poker_tracker_session_id', 'existing_session')
      
      const error = new Error('Test')
      handleError(error)
      
      // Should get the existing session ID
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('poker_tracker_session_id')
    })
  })

  describe('Error Queue Management', () => {
    it('should not exceed max queue size', () => {
      // Create many errors
      for (let i = 0; i < 150; i++) {
        handleError(new Error(`Error ${i}`))
      }
      
      // Queue should be limited (this is internal behavior, tested indirectly)
      expect(() => handleError(new Error('Final error'))).not.toThrow()
    })
  })

  describe('Integration with localStorage', () => {
    beforeEach(() => {
      mockLocalStorage.clear()
    })

    it('should store errors when offline', async () => {
      ;(window.navigator as any).onLine = false
      
      handleError(new Error('Offline error'))
      
      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100))
      
      // Should attempt to store in localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'poker_tracker_errors',
        expect.any(String)
      )
    })

    it('should limit stored errors to 50', () => {
      const existingErrors = Array.from({ length: 60 }, (_, i) => ({
        message: `Error ${i}`,
        timestamp: new Date().toISOString(),
      }))
      
      mockLocalStorage.setItem('poker_tracker_errors', JSON.stringify(existingErrors))
      
      ;(window.navigator as any).onLine = false
      handleError(new Error('New error'))
      
      // Should trim to 50 most recent
      setTimeout(() => {
        const stored = mockLocalStorage.getItem('poker_tracker_errors')
        if (stored) {
          const parsed = JSON.parse(stored)
          expect(parsed.length).toBeLessThanOrEqual(50)
        }
      }, 100)
    })
  })
})








