// Мок для @supabase/ssr
export const createBrowserClient = jest.fn(() => ({
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        maybeSingle: jest.fn(() =>
          Promise.resolve({ data: null, error: null }),
        ),
      })),
      limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
      order: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
    })),
    upsert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ error: null })),
    })),
  })),
  auth: {
    signInWithPassword: jest.fn(() =>
      Promise.resolve({ data: { user: null }, error: null }),
    ),
    signUp: jest.fn(() =>
      Promise.resolve({ data: { user: null }, error: null }),
    ),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    signInWithOAuth: jest.fn(() =>
      Promise.resolve({ data: { url: "mock-url" }, error: null }),
    ),
    getUser: jest.fn(() =>
      Promise.resolve({ data: { user: null }, error: null }),
    ),
    getSession: jest.fn(() =>
      Promise.resolve({ data: { session: null }, error: null }),
    ),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
}));

export const createServerClient = jest.fn(() => createBrowserClient());
