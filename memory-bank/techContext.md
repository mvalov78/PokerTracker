# PokerTracker Technical Context

## Technology Stack
- **Frontend**: Next.js 15.5.2, React 19.1.0, Tailwind CSS 3.4.17
- **Backend**: Supabase (PostgreSQL) with Row Level Security
- **State Management**: React Query 5.86.0, React hooks
- **API**: Next.js API Routes with Server Actions
- **Authentication**: Supabase Auth with SSR integration
- **Bot Framework**: Telegraf.js 4.16.3
- **Form Management**: React Hook Form 7.62.0, Zod 4.1.5
- **Testing**: Jest 30.1.3, React Testing Library 16.3.0
- **Linting**: ESLint 9.38.0, Biome 2.2.0
- **Types**: TypeScript with strict mode enabled
- **Charting**: Recharts 3.1.2 for data visualization
- **UI Utilities**: clsx, tailwind-merge for styling utilities
- **Date Handling**: date-fns 4.1.0
- **Environment**: dotenv 17.2.2

## Key Development Patterns
- **App Router**: File-system based routing with route groups
- **Server Components**: RSC for static content, client components for interactivity
- **API Organization**: RESTful endpoints organized by domain
- **Service Layer**: Abstracts business logic from UI components
- **Type Safety**: Full TypeScript type definitions for all components and APIs
- **Component Composition**: Over inheritance, with specialized hooks
- **RLS Policies**: Row level security in database for data protection
- **Singleton Pattern**: For bot instance management

## Environment Setup
- **Development**: Local Next.js server with Supabase connection
- **Testing**: Jest with JSDOM for component testing
- **Production**: Vercel deployment with production Supabase instance

## Configuration Management
- Environment variables for sensitive configuration
- Feature flags for enabling/disabling functionality
- Bot settings stored in database and environment variables

## API Structure
- RESTful endpoints under `/api/` routes
- Admin-specific endpoints with authorization checks
- Bot-specific endpoints for Telegram integration
- Tournament management endpoints

## Performance Considerations
- React Query for caching and query optimization
- Server components to reduce client bundle size
- Image optimization with Next.js Image component
- Bundle analysis and optimization

## Security Implementation
- Supabase Row Level Security policies
- Server-side validation of all inputs
- Protected API routes with authentication checks
- Environment variable encryption

## Testing Strategy
- Unit tests for components and utility functions
- Integration tests for critical user flows
- API route tests with mocked responses
- Bot command testing with simulated updates

## Deployment Pipeline
- Vercel integration for continuous deployment
- Environment-specific configurations
- Preview deployments for pull requests
