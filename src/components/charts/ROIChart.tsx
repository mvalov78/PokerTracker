"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatPercentage } from "@/lib/utils";

interface ROIChartProps {
  data: Array<{
    type: string;
    roi: number;
    tournaments: number;
  }>;
  className?: string;
}

export default function ROIChart({ data, className }: ROIChartProps) {
  const formatTooltip = (value: number, name: string) => {
    if (name === "roi") {
      return [formatPercentage(value), "ROI"];
    }
    if (name === "tournaments") {
      return [value, "Турниров"];
    }
    return [value, name];
  };

  const getBarColor = (roi: number) => {
    if (roi > 20) return "#10b981"; // Зеленый для отличного ROI
    if (roi > 0) return "#f59e0b"; // Желтый для положительного ROI
    return "#ef4444"; // Красный для отрицательного ROI
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="type"
            className="text-sm text-gray-600 dark:text-gray-400"
          />
          <YAxis
            tickFormatter={(value) => formatPercentage(value)}
            className="text-sm text-gray-600 dark:text-gray-400"
          />
          <Tooltip
            formatter={formatTooltip}
            labelFormatter={(label) => `Тип: ${label}`}
            contentStyle={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              border: "none",
              borderRadius: "8px",
              color: "white",
            }}
          />
          <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.roi)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
