"use client";

import { formatCurrency } from "@/lib/common/formatters";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { createChart } from "./ChartFactory";
import { formatDate, formatTooltipValue } from "./utils/formatting";

interface ProfitChartProps {
  data: Array<{
    date: string;
    profit: number;
    cumulative: number;
  }>;
  className?: string;
}

export const ProfitChart = createChart<typeof LineChart>(LineChart, {
  tooltipFormatter: (value, name) => formatTooltipValue(value, name),
  labelFormatter: (label) => `Дата: ${formatDate(label)}`,
  chartProps: {
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  },
});

/**
 * Profit chart component showing tournament profit over time
 */
export function ProfitChartComponent({ data, className }: ProfitChartProps) {
  return (
    <ProfitChart data={data} className={className}>
      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
      <XAxis
        dataKey="date"
        tickFormatter={formatDate}
        className="text-sm text-gray-600 dark:text-gray-400"
      />
      <YAxis
        tickFormatter={(value) => formatCurrency(value)}
        className="text-sm text-gray-600 dark:text-gray-400"
      />
      <Line
        type="monotone"
        dataKey="profit"
        stroke="#ef4444"
        strokeWidth={2}
        dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
        activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2 }}
      />
      <Line
        type="monotone"
        dataKey="cumulative"
        stroke="#10b981"
        strokeWidth={3}
        dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
        activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
      />
    </ProfitChart>
  );
}

// For backward compatibility - replace with ProfitChart directly after tests are updated
export { ProfitChartComponent as ProfitChart };
