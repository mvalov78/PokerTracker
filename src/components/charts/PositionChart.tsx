"use client";

import { Cell, Legend, Pie, PieChart } from "recharts";
import { createChart } from "./ChartFactory";

interface PositionChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  className?: string;
}

export const PositionChart = createChart<typeof PieChart>(PieChart, {
  tooltipFormatter: (value, name) => [`${value} турниров`, name],
});

/**
 * Position chart component showing tournament positions as a pie chart
 */
export function PositionChartComponent({
  data,
  className,
}: PositionChartProps) {
  const renderCustomLabel = (entry: any) => {
    const percent = (
      (entry.value / data.reduce((sum, item) => sum + item.value, 0)) *
      100
    ).toFixed(1);
    return `${percent}%`;
  };

  return (
    <PositionChart data={data} className={className}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={renderCustomLabel}
        outerRadius={80}
        fill="#8884d8"
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Legend
        wrapperStyle={{
          paddingTop: "20px",
        }}
      />
    </PositionChart>
  );
}

// For backward compatibility - replace with PositionChart directly after tests are updated
export { PositionChartComponent as PositionChart };
