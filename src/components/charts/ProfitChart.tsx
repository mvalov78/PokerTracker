"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ProfitChartProps {
  data: Array<{
    date: string;
    profit: number;
    cumulative: number;
  }>;
  className?: string;
}

export default function ProfitChart({ data, className }: ProfitChartProps) {
  const formatTooltip = (value: number, name: string) => {
    if (name === "profit") {
      return [formatCurrency(value), "Прибыль"];
    }
    if (name === "cumulative") {
      return [formatCurrency(value), "Накопительная прибыль"];
    }
    return [value, name];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
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
          <Tooltip
            formatter={formatTooltip}
            labelFormatter={(label) => `Дата: ${formatDate(label)}`}
            contentStyle={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              border: "none",
              borderRadius: "8px",
              color: "white",
            }}
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
