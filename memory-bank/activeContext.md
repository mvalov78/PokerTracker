# PokerTracker Active Context

## Project Analysis

### Architecture Overview
- **Frontend**: Next.js 15 with React 19, App Router architecture
- **Backend**: Supabase (PostgreSQL) with custom API routes in Next.js
- **Authentication**: Supabase Auth with SSR support
- **Telegram Bot**: Telegraf.js with both polling and webhook modes
- **Styling**: Tailwind CSS with custom UI components
- **State Management**: React Query for server state, React hooks for local state
- **Testing**: Jest with React Testing Library

### Key Components
1. **Next.js App Router**: Organizes routes in a file-system based structure
2. **Supabase Integration**: Database, auth, and storage services
3. **Telegram Bot**: Provides mobile interface for users
4. **API Routes**: RESTful endpoints for client-server communication
5. **UI Components**: Reusable components organized by domain and function
   - **Chart Component Factory**: BaseChart with utility functions for consistent charts
6. **Service Layer**: Abstracts business logic from components
7. **Testing Suite**: Comprehensive test coverage across components and services

### Database Schema
- **profiles**: User profiles linked to auth.users
- **tournaments**: Tournament details
- **tournament_results**: Results of played tournaments
- **tournament_photos**: Images related to tournaments
- **user_settings**: User preferences and settings
- **bot_sessions**: Telegram bot session management
- **bankroll_transactions**: Financial tracking for poker bankroll

### Bot Architecture
- **Dual Mode Support**: Polling (development) and Webhook (production)
- **Command Handlers**: Structured handlers for user commands
- **Session Management**: Tracks user state during multi-step operations
- **Photo Processing**: OCR capability for tournament ticket photos
- **Notifications**: Tournament reminders and updates
- **Admin Controls**: Bot management through admin API

### Current Version
- **Version**: 1.4.0
- **Status**: Active development

## Technical Context
- TypeScript in strict mode
- ESLint and Biome for linting/formatting
- Environment variable configuration
- Security with Row Level Security in Supabase
- Jest for testing

## Project Structure Notes
- Well-organized directory structure following domain-driven design
- Comprehensive test coverage
- Clear separation of concerns between components and services
- Admin section for managing bot settings
- API routes organized by domain

## Recent Activities
- Completed and archived implementation of Chart Component Factory refactoring:
  - Created BaseChart component for common chart functionality
  - Extracted shared formatting utilities to reduce duplication
  - Refactored ProfitChart, ROIChart, and PositionChart to use BaseChart
  - Added comprehensive tests for new components and utilities
- Created a comprehensive refactoring plan for the project
- Updated project architecture documentation

## Next Tasks
- Create Bot API Utilities (TASK-007) to eliminate duplication in bot endpoints
- Standardize API Error Handling (TASK-008) across the application
- Consolidate User Services (TASK-009) into a comprehensive service
