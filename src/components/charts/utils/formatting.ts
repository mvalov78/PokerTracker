/**
 * Utilities for formatting chart data and labels
 */
import {
  formatCurrency,
  formatPercentage,
  formatShortDate,
  getRoiColor,
} from "@/lib/common/formatters";

/**
 * Format tooltip value based on data type
 */
export function formatTooltipValue(
  value: number,
  type: string,
): [string, string] {
  switch (type) {
    case "profit":
      return [formatCurrency(value, "USD", 2), "Прибыль"];
    case "cumulative":
      return [formatCurrency(value, "USD", 2), "Накопительная прибыль"];
    case "roi":
      // Use without plus sign to match tests
      return [formatPercentage(value, 2, false), "ROI"];
    case "tournaments":
      return [value.toString(), "Турниров"];
    case "value":
      return [value.toString(), "Значение"];
    default:
      return [value.toString(), type];
  }
}

/**
 * Format date string for chart labels
 */
export function formatDate(dateStr: string): string {
  return formatShortDate(dateStr);
}

/**
 * Re-export getRoiColor for direct use
 */
export { getRoiColor };

/**
 * Get default tooltip styles
 */
export function getDefaultTooltipStyles() {
  return {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    border: "none",
    borderRadius: "8px",
    color: "white",
  };
}
