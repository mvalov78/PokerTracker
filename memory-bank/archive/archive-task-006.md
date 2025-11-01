# Archive: TASK-006 - Implement Chart Component Factory

## Task Information
- **ID**: TASK-006
- **Title**: Implement Chart Component Factory
- **Status**: Completed
- **Completion Date**: 2025-10-30
- **Complexity**: Level 2 - Simple Enhancement

## Task Description
Implement the chart component factory to reduce duplication in chart components.

## Approach Taken
1. Created a BaseChart component that encapsulates common chart functionality
2. Extracted shared tooltip, styling, and formatting code into utility functions
3. Refactored ProfitChart, ROIChart, and PositionChart to use the BaseChart
4. Added comprehensive tests for the new components and utilities

## Implementation Details

### Chart Formatting Utilities
Created a new utilities module for shared chart functions:

```typescript
// src/components/charts/utils/formatting.ts
export function formatTooltipValue(value: number, type: string): [string, string] {
  switch (type) {
    case 'profit':
      return [formatCurrency(value), 'Прибыль']
    case 'cumulative':
      return [formatCurrency(value), 'Накопительная прибыль']
    case 'roi':
      return [formatPercentage(value), 'ROI']
    case 'tournaments':
      return [value.toString(), 'Турниров']
    case 'value':
      return [value.toString(), 'Значение']
    default:
      return [value.toString(), type]
  }
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', { 
    day: '2-digit', 
    month: '2-digit' 
  })
}

export function getRoiColor(roi: number): string {
  if (roi > 20) {return '#10b981'} // Зеленый для отличного ROI
  if (roi > 0) {return '#f59e0b'}  // Желтый для положительного ROI
  return '#ef4444'                 // Красный для отрицательного ROI
}

export function getDefaultTooltipStyles() {
  return {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    border: 'none',
    borderRadius: '8px',
    color: 'white'
  }
}
```

### BaseChart Component
Created a flexible BaseChart component that serves as the foundation for all charts:

```tsx
// src/components/charts/BaseChart.tsx
export interface BaseChartProps {
  children: ReactNode;
  width?: string | number;
  height?: string | number;
  className?: string;
  tooltipStyles?: React.CSSProperties;
  tooltipFormatter?: (value: number, name: string, props: any) => [string, string];
  labelFormatter?: (label: string) => string;
  showTooltip?: boolean;
}

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
    ...tooltipStyles
  };

  return (
    <div className={className}>
      <ResponsiveContainer width={width} height={height}>
        {React.cloneElement(
          children as React.ReactElement,
          {},
          ...(React.Children.toArray(
            (children as React.ReactElement).props.children
          ) || []),
          showTooltip && (
            <Tooltip 
              formatter={tooltipFormatter}
              labelFormatter={labelFormatter}
              contentStyle={mergedTooltipStyles}
            />
          )
        )}
      </ResponsiveContainer>
    </div>
  );
}
```

### Refactored Chart Components

#### ProfitChart
```tsx
export default function ProfitChart({ data, className }: ProfitChartProps) {
  return (
    <BaseChart 
      className={className}
      tooltipFormatter={(value, name) => formatTooltipValue(value, name)}
      labelFormatter={(label) => `Дата: ${formatDate(label)}`}
    >
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="cumulative" 
          stroke="#10b981" 
          strokeWidth={3}
          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
        />
      </LineChart>
    </BaseChart>
  )
}
```

#### ROIChart
```tsx
export default function ROIChart({ data, className }: ROIChartProps) {
  return (
    <BaseChart 
      className={className}
      tooltipFormatter={(value, name) => formatTooltipValue(value, name)}
      labelFormatter={(label) => `Тип: ${label}`}
    >
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
      </BarChart>
    </BaseChart>
  )
}
```

#### PositionChart
```tsx
export default function PositionChart({ data, className }: PositionChartProps) {
  const formatPositionTooltip = (value: number, name: string) => {
    return [`${value} турниров`, name]
  }

  const renderCustomLabel = (entry: any) => {
    const percent = ((entry.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)
    return `${percent}%`
  }

  return (
    <BaseChart 
      className={className}
      tooltipFormatter={formatPositionTooltip}
    >
      <PieChart>
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
            paddingTop: '20px'
          }}
        />
      </PieChart>
    </BaseChart>
  )
}
```

### Added Tests

#### BaseChart Tests
Created tests to verify the BaseChart component's functionality:

```tsx
// src/__tests__/components/charts/BaseChart.test.tsx
describe('BaseChart', () => {
  it('renders chart with children', () => {
    const { container } = render(
      <BaseChart>
        <LineChart data={mockData}>
          <Line type="monotone" dataKey="value" stroke="#8884d8" />
        </LineChart>
      </BaseChart>
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  // Additional tests...
});
```

#### Formatting Utilities Tests
Created tests to verify the formatting utility functions:

```tsx
// src/__tests__/components/charts/utils/formatting.test.ts
describe('Chart formatting utilities', () => {
  describe('formatTooltipValue', () => {
    it('formats profit values correctly', () => {
      const [value, label] = formatTooltipValue(1000, 'profit');
      expect(value).toBe('$1,000.00');
      expect(label).toBe('Прибыль');
    });

    // Additional tests...
  });

  // Additional test suites...
});
```

## Results

### Code Reduction
- Removed ~20 lines of duplicated tooltip code
- Eliminated ~30 lines of duplicated ResponsiveContainer code
- Centralized formatting functions previously duplicated across components

### Improved Consistency
- All charts now use the same tooltip styling
- Formatting functions are consistent across all charts
- Layout patterns are standardized

### Better Maintainability
- Changes to chart styling can be made in a single place
- Adding new charts is simpler with the BaseChart foundation
- Chart-specific logic is more isolated from common functionality

## Verification
- All refactored chart components render correctly
- All tests pass successfully
- No regression in functionality or appearance

## Future Work
- Consider further abstractions for specific chart types
- Add theming support to BaseChart
- Add animation configuration options
