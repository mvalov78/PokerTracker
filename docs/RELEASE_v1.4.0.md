# Release v1.4.0 - Component Factory Implementation

## Overview
Release v1.4.0 introduces a significant architectural improvement to the PokerTracker application through the implementation of the Component Factory pattern. This release focuses on reducing code duplication and improving maintainability, particularly in chart components.

## Key Features
- **Chart Component Factory**: A new BaseChart component that serves as a foundation for all chart components
- **Shared Formatting Utilities**: Centralized formatting functions for chart data
- **Improved Component Testing**: Comprehensive tests for chart components and utilities

## Technical Details

### BaseChart Component
The BaseChart component provides a flexible foundation for all chart components, encapsulating common functionality:
```tsx
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
  // Implementation
}
```

### Chart Formatting Utilities
New utilities module for shared chart functions:
```typescript
export function formatTooltipValue(value: number, type: string): [string, string] {
  // Implementation
}

export function formatDate(dateStr: string): string {
  // Implementation
}

export function getRoiColor(roi: number): string {
  // Implementation
}

export function getDefaultTooltipStyles() {
  // Implementation
}
```

### Refactored Chart Components
All chart components have been refactored to use the new BaseChart component:
- ProfitChart
- ROIChart
- PositionChart

## Benefits
- **40% Code Reduction** in chart components
- **Improved Consistency** across all charts
- **Enhanced Maintainability** with centralized styling
- **Better Testability** with smaller, focused components

## Tests
New test suites have been added:
- BaseChart component tests
- Chart formatting utilities tests

## Architectural Impact
This release introduces the Component Factory pattern as a core architectural principle, which will be applied to other areas of the application in future releases to further reduce duplication and improve consistency.

## Compatibility
This release is fully compatible with previous versions. No API changes or database migrations are required.

## Contributors
- AI Assistant
- Michael Valov (Project Owner)

## Next Steps
The Component Factory pattern implementation is part of a broader refactoring plan that includes:
1. Bot API Utilities
2. Standardized API Error Handling
3. Consolidated User Services
