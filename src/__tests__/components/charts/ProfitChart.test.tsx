import { render, screen } from '@testing-library/react';
import { ProfitChart } from '@/components/charts/ProfitChart';

describe('ProfitChart component', () => {
  const mockData = [
    { date: '2025-10-01', profit: 100, cumulative: 100 },
    { date: '2025-10-10', profit: -50, cumulative: 50 },
    { date: '2025-10-20', profit: 200, cumulative: 250 },
  ];

  it('renders without crashing', () => {
    const { container } = render(<ProfitChart data={mockData} />);
    // The component uses SVG for rendering, so checking if the component's container exists
    // In jsdom environment, the charts don't render properly due to sizing limitations
    // Just verify the component renders without errors
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy();
  });

  it('handles empty data', () => {
    const { container } = render(<ProfitChart data={[]} />);
    // Even with empty data, the chart should render without errors
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(<ProfitChart data={mockData} className="test-class" />);
    // Find the parent div and check if it has the custom class
    const chartContainer = container.firstChild as HTMLElement;
    expect(chartContainer).toHaveClass('test-class');
  });
});
