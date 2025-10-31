import { render, screen } from '@testing-library/react';
import { ROIChart } from '@/components/charts/ROIChart';

describe('ROIChart component', () => {
  const mockData = [
    { type: 'freezeout', roi: 15.5, tournaments: 10 },
    { type: 'rebuy', roi: -5.2, tournaments: 5 },
    { type: 'turbo', roi: 8.7, tournaments: 7 },
  ];

  it('renders without crashing', () => {
    const { container } = render(<ROIChart data={mockData} />);
    // The component uses SVG for rendering
    // In jsdom environment, the charts don't render properly due to sizing limitations
    // Just verify the component renders without errors
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy();
  });

  it('handles empty data', () => {
    const { container } = render(<ROIChart data={[]} />);
    // Even with empty data, the chart should render without errors
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(<ROIChart data={mockData} className="test-class" />);
    // Find the parent div and check if it has the custom class
    const chartContainer = container.firstChild as HTMLElement;
    expect(chartContainer).toHaveClass('test-class');
  });
});
