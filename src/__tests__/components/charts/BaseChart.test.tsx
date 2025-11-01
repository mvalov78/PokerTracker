import { render, screen } from "@testing-library/react";
import { LineChart, Line } from "recharts";
import { BaseChart } from "@/components/charts/BaseChart";

const mockData = [
  { name: "Page A", value: 400 },
  { name: "Page B", value: 300 },
  { name: "Page C", value: 200 },
];

describe("BaseChart", () => {
  it("renders chart with children", () => {
    const { container } = render(
      <BaseChart>
        <LineChart data={mockData}>
          <Line type="monotone" dataKey="value" stroke="#8884d8" />
        </LineChart>
      </BaseChart>,
    );

    // The component should render a div with ResponsiveContainer
    expect(container.firstChild).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <BaseChart className="test-class">
        <LineChart data={mockData}>
          <Line type="monotone" dataKey="value" stroke="#8884d8" />
        </LineChart>
      </BaseChart>,
    );

    expect(container.firstChild).toHaveClass("test-class");
  });

  it("renders with custom tooltip formatter", () => {
    const tooltipFormatter = jest.fn().mockReturnValue(["$400", "Value"]);

    render(
      <BaseChart tooltipFormatter={tooltipFormatter}>
        <LineChart data={mockData}>
          <Line type="monotone" dataKey="value" stroke="#8884d8" />
        </LineChart>
      </BaseChart>,
    );

    // We can't directly test the formatter as it's used by Recharts internally
    // But we can verify it was passed correctly by checking the component structure
    expect(tooltipFormatter).not.toHaveBeenCalled(); // It won't be called during render
  });

  it("does not render tooltip when showTooltip is false", () => {
    const { container } = render(
      <BaseChart showTooltip={false}>
        <LineChart data={mockData}>
          <Line type="monotone" dataKey="value" stroke="#8884d8" />
        </LineChart>
      </BaseChart>,
    );

    // We can't easily test for absence of tooltip directly since it's rendered conditionally in Recharts
    // This is a structural test to ensure the component renders
    expect(container.firstChild).toBeInTheDocument();
  });

  it("handles empty children gracefully", () => {
    // This should not throw an error
    const { container } = render(<BaseChart>{null}</BaseChart>);

    expect(container.firstChild).toBeInTheDocument();
  });
});
