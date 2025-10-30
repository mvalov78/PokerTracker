/**
 * Tests for ErrorBoundary component
 */

import { render, screen } from '@testing-library/react'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No Error</div>
}

describe('ErrorBoundary Component', () => {
  // Suppress console.error for these tests
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    ;(console.error as jest.Mock).mockRestore()
  })

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Child Component</div>
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Child Component')).toBeInTheDocument()
  })

  it('should catch and display error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    // Should show error message
    expect(screen.queryByText('No Error')).not.toBeInTheDocument()
  })

  it('should render custom fallback', () => {
    const fallback = <div>Custom Error UI</div>
    
    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument()
  })

  it('should not crash when child renders successfully', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('No Error')).toBeInTheDocument()
  })
})








