# PokerTracker System Patterns

## Architecture Patterns

### 1. Next.js App Router Architecture
```
app/
├── (routes)/           # Public routes
├── admin/              # Admin-only routes
├── api/                # API endpoints
├── layout.tsx          # Root layout (applied to all routes)
└── page.tsx            # Homepage
```

- **Pattern**: File-based routing with nested layouts
- **Benefits**: Clear organization, code splitting, shared layouts
- **Implementation**: Routes organized by domain, with shared layouts for sections

### 2. Service Layer Pattern
```
services/
├── authService.ts      # Authentication related operations
├── tournamentService.ts # Tournament CRUD operations
└── botService.ts       # Bot management operations
```

- **Pattern**: Business logic separated from UI components
- **Benefits**: Testability, reusability, separation of concerns
- **Implementation**: Each service focuses on a specific domain

### 3. Repository Pattern (via Supabase)
```typescript
// Example from tournament service
export async function getTournaments(userId: string) {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data;
}
```

- **Pattern**: Data access abstracted through repository methods
- **Benefits**: Consistent data access, query optimization
- **Implementation**: Supabase queries encapsulated in service functions

## UI Patterns

### 1. Component Composition
```tsx
// Example pattern
<Card>
  <CardHeader>
    <CardTitle>Tournament Results</CardTitle>
    <CardDescription>Your recent performance</CardDescription>
  </CardHeader>
  <CardContent>
    <ResultsChart data={results} />
  </CardContent>
  <CardFooter>
    <Button>View All</Button>
  </CardFooter>
</Card>
```

- **Pattern**: Building complex UI from smaller components
- **Benefits**: Reusability, maintainability, consistent styling
- **Implementation**: UI components composed to create feature-specific views

### 2. Container/Presentation Pattern
```tsx
// Container component
function TournamentListContainer() {
  const { data, isLoading, error } = useTournaments();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <TournamentList tournaments={data} />;
}

// Presentation component
function TournamentList({ tournaments }) {
  return (
    <ul>
      {tournaments.map(tournament => (
        <TournamentItem key={tournament.id} tournament={tournament} />
      ))}
    </ul>
  );
}
```

- **Pattern**: Separation of data fetching from presentation
- **Benefits**: Reusable UI components, better testing
- **Implementation**: Container components use hooks, presentation components are pure

## State Management Patterns

### 1. React Query for Server State
```tsx
// Example pattern
function useTournaments() {
  return useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentService.getTournaments()
  });
}
```

- **Pattern**: Server state managed through React Query
- **Benefits**: Caching, loading states, error handling
- **Implementation**: Custom hooks wrapping React Query for specific data needs

### 2. Form State with React Hook Form
```tsx
// Example pattern
function TournamentForm() {
  const { register, handleSubmit, errors } = useForm({
    resolver: zodResolver(tournamentSchema)
  });
  
  const onSubmit = (data) => {
    // Submit logic
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} />
      {errors.name && <span>{errors.name.message}</span>}
      <button type="submit">Save</button>
    </form>
  );
}
```

- **Pattern**: Form state and validation with React Hook Form and Zod
- **Benefits**: Performance, validation, error handling
- **Implementation**: Schema-based validation with controlled inputs

## API Patterns

### 1. RESTful API Routes
```
api/
├── tournaments/
│   ├── [id]/
│   │   ├── route.ts    # GET, PUT, DELETE for specific tournament
│   └── route.ts        # GET, POST for tournaments collection
└── bot/
    ├── webhook/
    │   └── route.ts    # POST for webhook updates
    └── polling/
        └── route.ts    # GET for polling updates
```

- **Pattern**: Resource-oriented API endpoints
- **Benefits**: Clear organization, standard HTTP methods
- **Implementation**: Next.js API routes organized by resource

### 2. API Middleware Pattern
```typescript
// Example middleware pattern
export async function withAuth(
  req: NextRequest,
  handler: (context: AuthContext) => Promise<Response>
) {
  const session = await getSession();
  
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return handler({ req, session });
}
```

- **Pattern**: Middleware functions for API routes
- **Benefits**: Reusable authentication, logging, error handling
- **Implementation**: Higher-order functions wrapping route handlers

## Bot Patterns

### 1. Command Handler Pattern
```typescript
// Example pattern
bot.command("start", async (ctx) => {
  try {
    await commands.start(ctx);
  } catch (error) {
    await ctx.reply("Error processing command");
  }
});
```

- **Pattern**: Structured command handlers
- **Benefits**: Organization, error handling, testability
- **Implementation**: Commands abstracted to separate modules

### 2. Session Management Pattern
```typescript
// Example pattern
bot.use((ctx, next) => {
  if (!ctx.from?.id) return next();
  
  if (!sessions.has(ctx.from.id)) {
    sessions.set(ctx.from.id, { /* initial state */ });
  }
  
  ctx.session = sessions.get(ctx.from.id);
  return next();
});
```

- **Pattern**: User session tracking for multi-step operations
- **Benefits**: State persistence, context-aware commands
- **Implementation**: In-memory or database-backed session store

## Testing Patterns

### 1. Component Testing
```typescript
// Example pattern
describe('TournamentList', () => {
  it('renders tournaments correctly', () => {
    render(<TournamentList tournaments={mockTournaments} />);
    expect(screen.getByText('Tournament 1')).toBeInTheDocument();
  });
});
```

- **Pattern**: Isolated component testing
- **Benefits**: Ensures UI renders correctly with given props
- **Implementation**: React Testing Library with mock data

### 2. API Route Testing
```typescript
// Example pattern
describe('GET /api/tournaments', () => {
  it('returns user tournaments', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      session: { user: { id: 'user-1' } }
    });
    
    await getTournaments(req, res);
    
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Tournament 1' })
    ]));
  });
});
```

- **Pattern**: Mock request/response testing
- **Benefits**: Validates API behavior without database
- **Implementation**: Jest mocks with node-mocks-http
