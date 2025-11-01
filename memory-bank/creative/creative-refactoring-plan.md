# Code Duplication Analysis and Refactoring Plan

## Overview
After analyzing the PokerTracker codebase, we've identified several areas with potential code duplication and opportunities for refactoring. This document outlines a comprehensive plan to improve code quality by eliminating redundancy, improving reusability, and standardizing patterns across the codebase.

## Areas of Duplication

### 1. Chart Components
- **Problem**: The chart components (`ProfitChart.tsx`, `ROIChart.tsx`, `PositionChart.tsx`) contain significant duplication, particularly in formatting, styling, and container elements.
- **Duplication Type**: Visual component structure, styling, and tooltip configuration
- **Files Affected**:
  - `src/components/charts/ProfitChart.tsx`
  - `src/components/charts/ROIChart.tsx`
  - `src/components/charts/PositionChart.tsx`

### 2. Bot API Routes
- **Problem**: The webhook and polling API routes (`webhook/route.ts` and `polling/route.ts`) have similar error handling, status checking, and bot instance management code.
- **Duplication Type**: Error handling logic, bot initialization, status response formatting
- **Files Affected**:
  - `src/app/api/bot/webhook/route.ts`
  - `src/app/api/bot/polling/route.ts`
  - Other bot-related API routes

### 3. Simple Page Templates
- **Problem**: Multiple pages use nearly identical layouts with slight variations, particularly `simple-page.tsx` files.
- **Duplication Type**: Layout structure, card components, styling
- **Files Affected**:
  - `src/app/simple-page.tsx`
  - `src/app/tournaments/[id]/edit/simple-page.tsx`

### 4. User-Related Services
- **Problem**: The user and settings services contain overlapping functionality for fetching and creating user data.
- **Duplication Type**: Database operations, error handling, data mapping
- **Files Affected**:
  - `src/services/userService.ts`
  - `src/services/userSettingsService.ts`

### 5. Repeated UI Patterns
- **Problem**: Common UI patterns like card layouts, form structures, and error handling are duplicated across components.
- **Duplication Type**: Component structure, styling, error handling
- **Files Affected**: Multiple components across the UI

### 6. API Error Handling
- **Problem**: Similar error handling patterns are duplicated across API routes.
- **Duplication Type**: Try-catch blocks, error response formatting
- **Files Affected**: Multiple API route files

## Refactoring Plan

### 1. Create a Chart Component Factory

#### Action Items:
1. Create a base `BaseChart` component with common chart configurations
2. Extract shared tooltip, styling, and formatting code into reusable utilities
3. Refactor existing chart components to use the base component
4. Create type-safe props interfaces for each chart variation

#### Implementation:
```tsx
// src/components/charts/BaseChart.tsx
export interface BaseChartProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  tooltipStyles?: object;
  // Other common props
}

export function BaseChart({
  width = "100%",
  height = "100%",
  className,
  tooltipStyles,
  children
}) {
  const defaultTooltipStyles = {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    border: 'none',
    borderRadius: '8px',
    color: 'white'
  };
  
  return (
    <div className={className}>
      <ResponsiveContainer width={width} height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
```

### 2. Create Bot API Utilities

#### Action Items:
1. Extract common bot initialization and error handling code into a shared utility
2. Create standardized response formatters for bot status
3. Implement middleware for common bot API operations
4. Refactor API routes to use the shared utilities

#### Implementation:
```typescript
// src/app/api/bot/utils.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBotInstance, initializeBot } from '@/bot';

export async function getBotOrInit() {
  let bot = getBotInstance();
  if (!bot) {
    bot = await initializeBot();
  }
  return bot;
}

export function formatBotStatus(status: any) {
  return {
    ...status,
    timestamp: new Date().toISOString()
  };
}

export async function handleBotApiError(error: any) {
  console.error('Bot API error:', error);
  return NextResponse.json(
    { error: 'Internal server error' }, 
    { status: 500 }
  );
}
```

### 3. Create Page Layout Templates

#### Action Items:
1. Extract common page layouts into reusable templates
2. Create a `PageLayout` component with configurable sections
3. Refactor duplicate page structures to use the common layouts
4. Document the available layouts and their usage

#### Implementation:
```tsx
// src/components/layouts/DashboardLayout.tsx
export interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function DashboardLayout({
  title,
  subtitle,
  children,
  actions
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-gray-600">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex space-x-4">
              {actions}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
```

### 4. Consolidate User Services

#### Action Items:
1. Merge `userService.ts` and `userSettingsService.ts` into a comprehensive user service
2. Create clear interfaces for all user-related data
3. Standardize error handling across user operations
4. Implement a more robust user data cache

#### Implementation:
```typescript
// src/services/userService.ts (refactored)
export class UserService {
  // User profile methods
  static async getProfileByUserId(userId: string): Promise<UserProfile | null> { /* ... */ }
  static async getProfileByTelegramId(telegramId: number): Promise<UserProfile | null> { /* ... */ }
  static async createProfile(data: CreateProfileData): Promise<UserProfile | null> { /* ... */ }
  static async updateProfile(userId: string, data: UpdateProfileData): Promise<UserProfile | null> { /* ... */ }
  
  // User settings methods
  static async getSettings(userId: string): Promise<UserSettings | null> { /* ... */ }
  static async updateSettings(userId: string, data: UpdateSettingsData): Promise<UserSettings | null> { /* ... */ }
  static async getCurrentVenue(userId: string): Promise<string | null> { /* ... */ }
  static async updateCurrentVenue(userId: string, venue: string): Promise<UserSettings | null> { /* ... */ }
  
  // Helper methods
  private static handleDatabaseError(error: any, context: string): null { /* ... */ }
  private static mapDbProfileToType(dbProfile: any): UserProfile { /* ... */ }
  private static mapDbSettingsToType(dbSettings: any): UserSettings { /* ... */ }
}
```

### 5. Create a UI Component Library

#### Action Items:
1. Audit existing UI components for duplication
2. Create a standardized component library in `src/components/ui`
3. Implement common patterns like cards, form groups, and status indicators
4. Document the component library for developer usage

#### Implementation:
```tsx
// src/components/ui/Card.tsx (enhanced)
export interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'outline';
}

export function Card({
  title,
  subtitle,
  children,
  footer,
  className,
  variant = 'default'
}: CardProps) {
  // Implementation with standardized styling
}

// Usage example:
<Card
  title="Tournament Results"
  subtitle="Your recent performance"
  footer={<Button>View All</Button>}
  variant="primary"
>
  <ResultsTable data={results} />
</Card>
```

### 6. Create API Error Handling Utilities

#### Action Items:
1. Create standardized error handling utilities for API routes
2. Implement consistent error response formatting
3. Add robust logging for API errors
4. Create middleware for common API patterns

#### Implementation:
```typescript
// src/lib/apiUtils.ts
import { NextResponse } from 'next/server';

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export function handleApiError(error: any, context: string): NextResponse {
  // Log with context
  console.error(`API Error in ${context}:`, error);
  
  // Determine status code
  let status = 500;
  let message = 'An unexpected error occurred';
  let code = 'INTERNAL_ERROR';
  
  if (error.code === 'PGRST116') {
    status = 404;
    message = 'Resource not found';
    code = 'NOT_FOUND';
  } else if (error.code === 'PGRST103') {
    status = 403;
    message = 'Unauthorized';
    code = 'FORBIDDEN';
  }
  
  return NextResponse.json(
    {
      error: message,
      code,
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    },
    { status }
  );
}
```

## Prioritized Refactoring Tasks

1. **Chart Component Refactoring** - High impact, moderate effort
   - Create the chart component factory
   - Refactor existing chart components
   - Add tests for chart components

2. **Bot API Utilities** - High impact, low effort
   - Create bot API utilities
   - Refactor webhook and polling routes
   - Add tests for bot API utilities

3. **API Error Handling** - High impact, low effort
   - Create standardized error handling utilities
   - Update API routes to use the utilities
   - Improve error logging

4. **User Service Consolidation** - Medium impact, medium effort
   - Merge user-related services
   - Improve interfaces and type safety
   - Add tests for the consolidated service

5. **Page Layout Templates** - Medium impact, high effort
   - Create reusable page layouts
   - Refactor existing pages to use templates
   - Document layout components

6. **UI Component Library** - High impact, high effort
   - Audit UI components for duplication
   - Create standardized component library
   - Update components to use the library
   - Add comprehensive tests

## Benefits and Risks

### Benefits
1. **Reduced Code Size**: By eliminating duplication, the overall codebase will be smaller and more maintainable
2. **Improved Consistency**: Standardized patterns will make the code more predictable and easier to understand
3. **Better Testability**: Shared components and utilities are easier to test thoroughly
4. **Faster Development**: Reusable components will speed up feature development
5. **Enhanced Reliability**: Centralized error handling improves error recovery and reporting

### Risks
1. **Regression**: Changes to shared components could cause unintended side effects
2. **Over-abstraction**: Creating overly generic components may reduce readability
3. **Learning Curve**: New patterns require developer adaptation time
4. **Migration Effort**: Incremental adoption may lead to temporarily inconsistent code

## Implementation Approach

1. **Incremental Adoption**: Refactor one area at a time to minimize disruption
2. **Comprehensive Testing**: Add tests before and after refactoring to ensure behavior is preserved
3. **Documentation**: Document new patterns and components as they are created
4. **Code Reviews**: Conduct thorough code reviews for each refactoring phase

## Next Steps

1. Begin with the Chart Component refactoring to establish patterns
2. Create API error handling utilities to improve reliability
3. Schedule regular refactoring sessions to maintain momentum
4. Track progress against this plan in the project task management system
