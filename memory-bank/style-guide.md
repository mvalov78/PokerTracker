# PokerTracker Style Guide

## Code Style

### TypeScript

1. **Type Definitions**
   ```typescript
   // Prefer interfaces for object definitions
   interface Tournament {
     id: string;
     name: string;
     date: string;
     buyin: number;
   }
   
   // Use type for unions, intersections, and aliases
   type TournamentType = "freezeout" | "rebuy" | "addon" | "bounty" | "satellite";
   ```

2. **Function Declarations**
   ```typescript
   // Prefer arrow functions for components
   const TournamentCard: React.FC<TournamentCardProps> = ({ tournament }) => {
     return (
       // Component JSX
     );
   };
   
   // Use function declarations for hooks and utility functions
   function useTournaments() {
     // Hook implementation
   }
   
   // Always include return types for non-React functions
   function calculateROI(buyin: number, payout: number): number {
     return ((payout - buyin) / buyin) * 100;
   }
   ```

3. **Async/Await**
   ```typescript
   // Prefer async/await over .then chains
   async function fetchTournament(id: string): Promise<Tournament> {
     try {
       const { data, error } = await supabase
         .from('tournaments')
         .select('*')
         .eq('id', id)
         .single();
         
       if (error) throw error;
       return data;
     } catch (error) {
       console.error('Error fetching tournament:', error);
       throw error;
     }
   }
   ```

4. **Error Handling**
   ```typescript
   // Always use try/catch with async/await
   try {
     const result = await tournamentService.addResult(data);
     return { success: true, data: result };
   } catch (error) {
     console.error('Failed to add result:', error);
     return { success: false, error: 'Failed to add result' };
   }
   ```

### React Components

1. **Component Structure**
   ```tsx
   // Imports
   import React from 'react';
   import { useTournaments } from '@/hooks/useTournaments';
   import { TournamentCard } from '@/components/TournamentCard';
   
   // Types
   interface TournamentListProps {
     userId: string;
     limit?: number;
   }
   
   // Component
   export const TournamentList: React.FC<TournamentListProps> = ({ 
     userId, 
     limit = 10 
   }) => {
     // Hooks
     const { data, isLoading, error } = useTournaments(userId, limit);
     
     // Derived state
     const hasNoTournaments = !isLoading && (!data || data.length === 0);
     
     // Render conditions
     if (isLoading) return <LoadingSpinner />;
     if (error) return <ErrorMessage message={error.message} />;
     if (hasNoTournaments) return <EmptyState type="tournaments" />;
     
     // Main render
     return (
       <div className="tournament-list">
         {data.map(tournament => (
           <TournamentCard key={tournament.id} tournament={tournament} />
         ))}
       </div>
     );
   };
   ```

2. **Hooks Usage**
   ```tsx
   // Custom hooks at the top of component
   const { data } = useTournaments();
   const [isEditing, setIsEditing] = useState(false);
   
   // useEffect with proper dependencies
   useEffect(() => {
     if (data) {
       // Do something with data
     }
   }, [data]); // Always include dependencies
   ```

3. **Event Handlers**
   ```tsx
   // Prefix with 'handle'
   const handleSubmit = async (event: React.FormEvent) => {
     event.preventDefault();
     // Handler logic
   };
   
   // Inline handlers for simple cases
   <button onClick={() => setIsOpen(true)}>Open</button>
   ```

### File Organization

1. **Component Files**
   - One component per file
   - Named exports (not default)
   - File name matches component name

2. **Directory Structure**
   - Group by domain, then by type
   - Shared components in `/components/ui`
   - Feature-specific components in feature directories

3. **Import Order**
   ```tsx
   // 1. React and Next.js imports
   import { useState, useEffect } from 'react';
   import { useRouter } from 'next/navigation';
   
   // 2. Third-party libraries
   import { useQuery } from '@tanstack/react-query';
   import { format } from 'date-fns';
   
   // 3. Internal modules (with alias paths)
   import { useTournaments } from '@/hooks/useTournaments';
   import { TournamentService } from '@/services/tournamentService';
   
   // 4. UI components
   import { Button } from '@/components/ui/button';
   import { Card } from '@/components/ui/card';
   
   // 5. Types, utilities, constants
   import type { Tournament } from '@/types';
   import { formatCurrency } from '@/utils/format';
   ```

## UI Components

### Component Hierarchy

```
UI (generic, reusable)
├── Button
├── Card
├── Input
├── Select
├── Textarea
├── ...

Domain (feature-specific)
├── TournamentCard
├── ResultForm
├── BankrollChart
├── ...
```

### Props Pattern

```tsx
// Props grouped by purpose
interface ButtonProps {
  // Content
  children: React.ReactNode;
  
  // Appearance
  variant?: 'default' | 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  
  // Behavior
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  
  // State
  disabled?: boolean;
  loading?: boolean;
  
  // Other
  className?: string;
}
```

## CSS & Styling

### Tailwind Conventions

1. **Class Order**
   ```tsx
   // Layout, dimensions, spacing, background, text, interactive, other
   <div className="
     flex flex-col                  /* Layout */
     w-full h-48 m-4 p-3            /* Dimensions & Spacing */
     bg-white rounded-lg shadow-md  /* Background & Borders */
     text-gray-800 font-medium      /* Typography */
     hover:bg-gray-50               /* Interactive */
     dark:bg-gray-800               /* Variants */
   ">
   ```

2. **Component-Specific Styles**
   ```tsx
   // Use cn utility for conditional classes
   import { cn } from '@/lib/utils';
   
   <button 
     className={cn(
       "px-4 py-2 rounded-md font-medium",
       variant === "primary" && "bg-blue-500 text-white hover:bg-blue-600",
       variant === "secondary" && "bg-gray-200 text-gray-800 hover:bg-gray-300",
       disabled && "opacity-50 cursor-not-allowed"
     )}
   >
     {children}
   </button>
   ```

3. **Responsive Design**
   ```tsx
   // Mobile-first approach
   <div className="
     grid grid-cols-1       /* Mobile */
     sm:grid-cols-2         /* Small screens (640px+) */
     md:grid-cols-3         /* Medium screens (768px+) */
     lg:grid-cols-4         /* Large screens (1024px+) */
     gap-4
   ">
   ```

## Form Patterns

### React Hook Form

```tsx
// Standard form pattern
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema definition
const tournamentSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  buyin: z.number().positive('Buy-in must be positive'),
  date: z.string(),
  venue: z.string().optional(),
});

type TournamentFormData = z.infer<typeof tournamentSchema>;

// Form component
export function TournamentForm({ onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: '',
      buyin: 0,
      date: new Date().toISOString().split('T')[0],
      venue: '',
    }
  });
  
  const processSubmit = async (data: TournamentFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(processSubmit)}>
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium">
            Tournament Name
          </label>
          <input 
            id="name"
            {...register('name')}
            className="w-full px-3 py-2 border rounded-md"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>
        
        {/* Other fields */}
        
        <button 
          type="submit" 
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Tournament'}
        </button>
      </div>
    </form>
  );
}
```

## API Patterns

### API Route Structure

```typescript
// src/app/api/tournaments/[id]/route.ts
import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase';
import { tournamentService } from '@/services/tournamentService';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient();
    const tournament = await tournamentService.getTournament(params.id);
    
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    );
  }
}
```

### Error Handling

```typescript
// Standard error response format
{
  error: string;           // User-friendly error message
  details?: unknown;       // Optional details (development only)
  code?: string;           // Optional error code
}

// Error handling in API routes
try {
  // Operation
} catch (error) {
  console.error('Operation failed:', error);
  
  if (error.code === 'PGRST404') {
    return NextResponse.json(
      { error: 'Resource not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(
    { 
      error: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    },
    { status: 500 }
  );
}
```

## Testing Patterns

### Component Tests

```typescript
// src/__tests__/components/TournamentCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TournamentCard } from '@/components/TournamentCard';

const mockTournament = {
  id: '123',
  name: 'Weekend Tournament',
  date: '2025-10-15',
  buyin: 100,
  venue: 'Poker Club',
};

describe('TournamentCard', () => {
  it('renders tournament details correctly', () => {
    render(<TournamentCard tournament={mockTournament} />);
    
    expect(screen.getByText('Weekend Tournament')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('Poker Club')).toBeInTheDocument();
  });
  
  it('calls onEdit when edit button is clicked', async () => {
    const handleEdit = jest.fn();
    render(
      <TournamentCard 
        tournament={mockTournament}
        onEdit={handleEdit}
      />
    );
    
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(handleEdit).toHaveBeenCalledWith(mockTournament.id);
  });
});
```

### API Route Tests

```typescript
// src/__tests__/api/tournaments.test.ts
import { createRequest, createResponse } from 'node-mocks-http';
import { GET } from '@/app/api/tournaments/route';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  createServerComponentClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [{ id: '123', name: 'Test Tournament' }],
            error: null
          }))
        }))
      }))
    }))
  }))
}));

describe('GET /api/tournaments', () => {
  it('returns tournaments for authenticated user', async () => {
    const req = createRequest({
      method: 'GET',
    });
    
    const res = await GET(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Test Tournament');
  });
});
```

## Naming Conventions

### General

- **Files**: kebab-case (`tournament-card.tsx`)
- **Components**: PascalCase (`TournamentCard`)
- **Functions**: camelCase (`getTournament`)
- **Constants**: UPPER_SNAKE_CASE for true constants (`MAX_TOURNAMENTS`)
- **Interfaces/Types**: PascalCase (`TournamentProps`)
- **Enum values**: PascalCase (`TournamentType.Freezeout`)

### API Routes

- **Routes**: plural nouns (`/tournaments`)
- **Parameters**: singular descriptive names (`/tournaments/:tournamentId`)
- **Query parameters**: camelCase (`?sortBy=date&limit=10`)

### Database

- **Tables**: plural, snake_case (`tournament_results`)
- **Columns**: snake_case (`user_id`, `created_at`)
- **Primary keys**: `id` (default)
- **Foreign keys**: singular entity name + `_id` (`tournament_id`)

## Documentation

### Component Documentation

```tsx
/**
 * Displays a tournament card with summary information
 * 
 * @param tournament - Tournament object to display
 * @param onEdit - Optional callback when edit button is clicked
 * @param onDelete - Optional callback when delete button is clicked
 */
export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  onEdit,
  onDelete
}) => {
  // Implementation
};
```

### Function Documentation

```typescript
/**
 * Calculates the Return on Investment (ROI) for a tournament
 * 
 * @param buyin - The tournament buy-in amount
 * @param payout - The tournament payout amount
 * @returns The ROI as a percentage (e.g., 50 for 50%)
 * 
 * @example
 * const roi = calculateROI(100, 150);
 * console.log(roi); // 50
 */
export function calculateROI(buyin: number, payout: number): number {
  return ((payout - buyin) / buyin) * 100;
}
```
