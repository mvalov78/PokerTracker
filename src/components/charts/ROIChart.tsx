"use client";

import { formatPercentage } from "@/lib/common/formatters";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { createChart } from "./ChartFactory";
import { formatTooltipValue, getRoiColor } from "./utils/formatting";

interface ROIChartProps {
  data: Array<{
    type: string;
    roi: number;
    tournaments: number;
  }>;
  className?: string;
}

export const ROIChart = createChart<typeof BarChart>(BarChart, {
  tooltipFormatter: (value, name) => formatTooltipValue(value, name),
  labelFormatter: (label) => `Тип: ${label}`,
  chartProps: {
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
  },
});

/**
 * ROI chart component showing return on investment by tournament type
 */
export function ROIChartComponent({ data, className }: ROIChartProps) {
  return (
    <ROIChart data={data} className={className}>
      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
      <XAxis
        dataKey="type"
        className="text-sm text-gray-600 dark:text-gray-400"
      />
      <YAxis
        tickFormatter={(value) => formatPercentage(value)}
        className="text-sm text-gray-600 dark:text-gray-400"
      />
      <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={getRoiColor(entry.roi)} />
        ))}
      </Bar>
    </ROIChart>
  );
}

// For backward compatibility - replace with ROIChart directly after tests are updated
export { ROIChartComponent as ROIChart };
