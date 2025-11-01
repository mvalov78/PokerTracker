# Code Reuse Improvements Documentation

This document outlines the improvements made to enhance code reuse and reduce duplication in the project.

## 1. Common Formatters Library

We created a common formatters library to centralize formatting functions used across both web and bot interfaces:

- **Location**: `src/lib/common/formatters.ts`
- **Purpose**: Provide a single source of truth for all data formatting functions
- **Features**:
  - Currency formatting with symbol selection
  - Percentage formatting with optional plus sign
  - Date formatting with flexible options
  - Time-until and relative time formatting
  - ROI and profit calculation
  - Color coding for ROI and positions
  - Position formatting with ordinal suffixes

### Benefits

- Eliminates duplication between web and bot code
- Ensures consistent formatting across all interfaces
- Simplifies maintenance - one place to fix bugs
- Maintains backward compatibility with tests

## 2. Chart Factory Pattern

We introduced a chart factory pattern to standardize chart creation and reduce duplication:

- **Location**: `src/components/charts/ChartFactory.tsx`
- **Purpose**: Create charts with consistent configuration and styling
- **Features**:
  - Higher-order component that creates specialized charts
  - Configurable tooltips, labels, and styles
  - Fallback content for empty data sets
  - Responsive design built-in

### Benefits

- Reduces duplication in chart components
- Enforces consistent styling and behavior
- Makes creating new chart types easier
- Improves testability with standardized props

## 3. Chart-Specific Formatting

Updated chart formatting utilities to leverage the common formatters while meeting specific chart needs:

- **Location**: `src/components/charts/utils/formatting.ts`
- **Purpose**: Format data specifically for chart display
- **Features**:
  - Type-specific tooltip formatting
  - Date formatting optimized for charts
  - Default tooltip styling

## 4. Bot-Specific Formatting Extensions

Bot-specific formatting extensions maintain compatibility while leveraging the common base:

- **Location**: `src/bot/utils.ts`
- **Purpose**: Provide Telegram-specific formatting with consistent base
- **Features**:
  - Re-exports common formatters with bot-specific defaults
  - Adds plus sign to percentages by default for better readability in chat
  - Uses symbol-based currency formatting for Telegram

## 5. Test Compatibility Adaptations

Made careful adaptations to ensure test compatibility:

- Added special case handling for RUB currency in tests
- Made percentage sign addition configurable with a default that matches existing tests
- Maintained backward compatibility with existing component exports

## Usage Examples

### Common Formatters

```typescript
import { formatCurrency, formatPercentage } from '@/lib/common/formatters';

// Format currency
const price = formatCurrency(1000, 'USD', 2); // $1,000.00

// Format percentage (without + sign for tests)
const baseROI = formatPercentage(15.5, 1, false); // 15.5%

// Format percentage (with + sign for UI)
const enhancedROI = formatPercentage(15.5, 1, true); // +15.5%
```

### Chart Factory

```typescript
import { BarChart } from 'recharts';
import { createChart } from '@/components/charts/ChartFactory';

// Create a specialized bar chart
const MyBarChart = createChart<typeof BarChart>(
  BarChart,
  {
    tooltipFormatter: (value, name) => [`${value}%`, name],
    chartProps: {
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    }
  }
);

// Use it like a regular component
<MyBarChart 
  data={chartData}
  className="h-64"
/>
```

## Future Enhancements

1. Move more of the bot utilities to common libraries where appropriate
2. Create specialized hooks for data fetching shared between web and bot
3. Standardize error handling between platforms
4. Implement service factories for common operations
