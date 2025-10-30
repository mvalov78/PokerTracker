/**
 * Global error handling utilities for PokerTracker Pro
 */

export interface ErrorReport {
  message: string
  stack?: string
  componentStack?: string
  timestamp: string
  userAgent: string
  url: string
  userId?: string
  sessionId?: string
  buildVersion?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  additionalData?: Record<string, any>
}

class ErrorHandler {
  private errorQueue: ErrorReport[] = []
  private isOnline = navigator.onLine
  private maxQueueSize = 100

  constructor() {
    this.setupGlobalErrorHandlers()
    this.setupNetworkStatusListeners()
  }

  private setupGlobalErrorHandlers() {
    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        component: 'Global',
        action: 'JavaScript Error',
        additionalData: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      })
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          component: 'Global',
          action: 'Promise Rejection',
          additionalData: {
            reason: event.reason,
          },
        }
      )
    })

    // Handle console errors (in development)
    if (process.env.NODE_ENV === 'development') {
      const originalConsoleError = console.error
      console.error = (...args) => {
        this.handleError(new Error(args.join(' ')), {
          component: 'Console',
          action: 'Console Error',
          additionalData: { args },
        })
        originalConsoleError.apply(console, args)
      }
    }
  }

  private setupNetworkStatusListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.flushErrorQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  public handleError(error: Error, context: ErrorContext = {}) {
    const errorReport = this.createErrorReport(error, context)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Handler')
      console.error('Error:', error)
      console.log('Context:', context)
      console.log('Report:', errorReport)
      console.groupEnd()
    }

    // Add to queue
    this.addToQueue(errorReport)

    // Try to send immediately if online
    if (this.isOnline) {
      this.flushErrorQueue()
    }
  }

  private createErrorReport(error: Error, context: ErrorContext): ErrorReport {
    const severity = this.determineSeverity(error, context)
    
    return {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context.userId,
      sessionId: this.getSessionId(),
      buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION,
      severity,
      ...context.additionalData,
    }
  }

  private determineSeverity(error: Error, context: ErrorContext): ErrorReport['severity'] {
    const message = error.message.toLowerCase()
    
    // Critical errors
    if (
      message.includes('chunk load failed') ||
      message.includes('loading chunk') ||
      message.includes('network error') ||
      context.component === 'Auth'
    ) {
      return 'critical'
    }

    // High severity
    if (
      message.includes('permission denied') ||
      message.includes('unauthorized') ||
      message.includes('payment') ||
      context.component === 'Payment'
    ) {
      return 'high'
    }

    // Medium severity
    if (
      message.includes('validation') ||
      message.includes('form') ||
      context.action?.includes('submit')
    ) {
      return 'medium'
    }

    // Low severity (default)
    return 'low'
  }

  private addToQueue(errorReport: ErrorReport) {
    this.errorQueue.push(errorReport)
    
    // Prevent queue from growing too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize)
    }
  }

  private async flushErrorQueue() {
    if (this.errorQueue.length === 0) {return}

    const errors = [...this.errorQueue]
    this.errorQueue = []

    try {
      await this.sendErrors(errors)
    } catch (error) {
      // If sending fails, add errors back to queue
      this.errorQueue.unshift(...errors)
      console.warn('Failed to send error reports:', error)
    }
  }

  private async sendErrors(errors: ErrorReport[]) {
    // In a real application, you would send these to your error tracking service
    // Examples: Sentry, LogRocket, Bugsnag, etc.
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Would send error reports:', errors)
      return
    }

    // Example implementation for a hypothetical error service
    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      // If the API fails, we could fall back to localStorage
      this.saveErrorsToLocalStorage(errors)
      throw error
    }
  }

  private saveErrorsToLocalStorage(errors: ErrorReport[]) {
    try {
      const stored = localStorage.getItem('poker_tracker_errors')
      const existingErrors = stored ? JSON.parse(stored) : []
      const allErrors = [...existingErrors, ...errors]
      
      // Keep only the last 50 errors
      const recentErrors = allErrors.slice(-50)
      
      localStorage.setItem('poker_tracker_errors', JSON.stringify(recentErrors))
    } catch (error) {
      console.warn('Failed to save errors to localStorage:', error)
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('poker_tracker_session_id')
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('poker_tracker_session_id', sessionId)
    }
    
    return sessionId
  }

  public getStoredErrors(): ErrorReport[] {
    try {
      const stored = localStorage.getItem('poker_tracker_errors')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.warn('Failed to retrieve stored errors:', error)
      return []
    }
  }

  public clearStoredErrors() {
    try {
      localStorage.removeItem('poker_tracker_errors')
    } catch (error) {
      console.warn('Failed to clear stored errors:', error)
    }
  }
}

// Singleton instance
const errorHandler = new ErrorHandler()

// Export functions for use throughout the app
export const handleError = (error: Error, context?: ErrorContext) => {
  errorHandler.handleError(error, context)
}

export const getStoredErrors = () => errorHandler.getStoredErrors()
export const clearStoredErrors = () => errorHandler.clearStoredErrors()

// Utility functions for common error scenarios
export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  context: ErrorContext = {}
): Promise<T | null> => {
  try {
    return await asyncFn()
  } catch (error) {
    handleError(error as Error, context)
    return null
  }
}

export const withErrorHandling = <T extends (...args: any[]) => any>(
  fn: T,
  context: ErrorContext = {}
): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args)
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          handleError(error, context)
          throw error
        })
      }
      
      return result
    } catch (error) {
      handleError(error as Error, context)
      throw error
    }
  }) as T
}

// Error types for better categorization
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NetworkError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export class OCRError extends Error {
  constructor(message: string, public confidence?: number) {
    super(message)
    this.name = 'OCRError'
  }
}

export default errorHandler
