/**
 * Tests for Card component
 */

import Card from '@/components/ui/Card'
import { render, screen } from '@testing-library/react'

describe('Card Component', () => {
  it('should render children', () => {
    render(<Card>Card Content</Card>)
    expect(screen.getByText('Card Content')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<Card className="custom-card">Content</Card>)
    const card = container.firstChild
    expect(card).toHaveClass('custom-card')
  })

  it('should render with different variants', () => {
    const { rerender } = render(<Card variant="default">Content</Card>)
    let card = screen.getByText('Content').parentElement
    expect(card).toBeInTheDocument()

    rerender(<Card variant="outlined">Content</Card>)
    card = screen.getByText('Content').parentElement
    expect(card).toBeInTheDocument()
  })

  it('should render complex children', () => {
    render(
      <Card>
        <div>
          <h2>Title</h2>
          <p>Description</p>
        </div>
      </Card>
    )
    
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  it('should handle padding variants', () => {
    const { rerender } = render(<Card padding="sm">Content</Card>)
    let card = screen.getByText('Content').parentElement
    expect(card).toBeInTheDocument()

    rerender(<Card padding="lg">Content</Card>)
    card = screen.getByText('Content').parentElement
    expect(card).toBeInTheDocument()
  })

  it('should render without padding', () => {
    render(<Card padding="none">Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card).toBeInTheDocument()
  })
})






