"use client";

import React, { ReactNode } from "react";
import { ResponsiveContainer, Tooltip, TooltipProps } from "recharts";
import { getDefaultTooltipStyles } from "./utils/formatting";

export interface BaseChartProps {
  /**
   * Chart content (LineChart, BarChart, PieChart, etc.)
   */
  children: ReactNode;

  /**
   * Width of the chart container
   */
  width?: string | number;

  /**
   * Height of the chart container
   */
  height?: string | number;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Custom tooltip styles
   */
  tooltipStyles?: React.CSSProperties;

  /**
   * Custom tooltip formatter
   */
  tooltipFormatter?: (
    value: number,
    name: string,
    props: any,
  ) => [string, string];

  /**
   * Custom label formatter for tooltip
   */
  labelFormatter?: (label: string) => string;

  /**
   * Whether to show tooltip
   */
  showTooltip?: boolean;
}

/**
 * BaseChart component that serves as a foundation for all chart components.
 * Provides common configuration options and styling.
 */
export function BaseChart({
  children,
  width = "100%",
  height = "100%",
  className = "",
  tooltipStyles,
  tooltipFormatter,
  labelFormatter,
  showTooltip = true,
}: BaseChartProps) {
  const defaultTooltipStyles = getDefaultTooltipStyles();

  const mergedTooltipStyles = {
    ...defaultTooltipStyles,
    ...tooltipStyles,
  };

  // Безопасная проверка на null или отсутствие children
  if (!children || !React.isValidElement(children)) {
    return (
      <div className={className}>
        <ResponsiveContainer width={width} height={height}>
          {/* Fallback content */}
          <div className="flex items-center justify-center h-full">
            <p>Нет данных для отображения</p>
          </div>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width={width} height={height}>
        {React.cloneElement(
          children,
          {},
          ...React.Children.toArray(children.props?.children || []),
          showTooltip && (
            <Tooltip
              formatter={tooltipFormatter}
              labelFormatter={labelFormatter}
              contentStyle={mergedTooltipStyles}
            />
          ),
        )}
      </ResponsiveContainer>
    </div>
  );
}
