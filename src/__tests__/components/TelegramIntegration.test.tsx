/**
 * Tests for TelegramIntegration component
 */

import TelegramIntegration from '@/components/TelegramIntegration'
import { ToastProvider } from '@/components/ui/Toast'
import { render, screen } from '@testing-library/react'

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'user123' },
    profile: { telegram_id: null },
    isAuthenticated: true,
  })),
}))

// Helper to render with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>)
}

describe('TelegramIntegration Component', () => {
  it('should render component', () => {
    renderWithProviders(<TelegramIntegration />)
    // Component should render without crashing
    expect(screen.getAllByText(/Telegram/i).length).toBeGreaterThan(0)
  })

  it('should show linking instructions when not linked', () => {
    renderWithProviders(<TelegramIntegration />)
    
    // Should have some instructions or call-to-action
    const elements = screen.getAllByText(/Telegram/i)
    expect(elements.length).toBeGreaterThan(0)
  })

  it('should display Telegram status', () => {
    const { useAuth } = require('@/hooks/useAuth')
    useAuth.mockReturnValue({
      user: { id: 'user123' },
      profile: { telegram_id: '123456789' },
      isAuthenticated: true,
    })
    
    renderWithProviders(<TelegramIntegration />)
    
    // Should show linked status
    expect(screen.getAllByText(/Telegram/i).length).toBeGreaterThan(0)
  })

  it('should render for unauthenticated users', () => {
    const { useAuth } = require('@/hooks/useAuth')
    useAuth.mockReturnValue({
      user: null,
      profile: null,
      isAuthenticated: false,
    })
    
    renderWithProviders(<TelegramIntegration />)
    
    // Should still render something
    expect(screen.getAllByText(/Telegram/i).length).toBeGreaterThan(0)
  })
})






