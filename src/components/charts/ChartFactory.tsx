"use client";

import React, { ReactNode } from "react";
import { ResponsiveContainer, Tooltip, TooltipProps } from "recharts";
import {
  getDefaultTooltipStyles,
  formatTooltipValue,
} from "./utils/formatting";

export interface ChartFactoryProps {
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
 * Chart factory that creates charts with common configuration
 * Use this instead of using BaseChart directly
 */
export function createChart<TProps extends object = Record<string, never>>(
  ChartComponent: React.ComponentType<TProps>,
  defaultConfig: {
    tooltipFormatter?: (
      value: number,
      name: string,
      props: any,
    ) => [string, string];
    labelFormatter?: (label: string) => string;
    chartProps?: Partial<TProps>;
  } = {},
) {
  // Return a higher-order component that wraps BaseChart
  return function EnhancedChart({
    data,
    className,
    tooltipFormatter = defaultConfig.tooltipFormatter,
    labelFormatter = defaultConfig.labelFormatter,
    chartProps = {},
    ...rest
  }: {
    data: any[];
    className?: string;
    tooltipFormatter?: (
      value: number,
      name: string,
      props: any,
    ) => [string, string];
    labelFormatter?: (label: string) => string;
    chartProps?: Partial<TProps>;
  } & Omit<ChartFactoryProps, "children">) {
    return (
      <BaseChart
        className={className}
        tooltipFormatter={tooltipFormatter}
        labelFormatter={labelFormatter}
        {...rest}
      >
        <ChartComponent
          data={data}
          {...(defaultConfig.chartProps as any)}
          {...(chartProps as any)}
        />
      </BaseChart>
    );
  };
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
}: ChartFactoryProps) {
  const defaultTooltipStyles = getDefaultTooltipStyles();

  const mergedTooltipStyles = {
    ...defaultTooltipStyles,
    ...tooltipStyles,
  };

  // Safe check for null or missing children
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
