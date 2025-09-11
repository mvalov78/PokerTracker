// Мок для @/lib/supabase
export const createClientComponentClient = jest.fn(() => ({
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
        single: jest.fn(() =>
          Promise.resolve({
            data: {
              id: "mock-id",
              user_id: "mock-user-id",
              name: "Mock Tournament",
              date: new Date().toISOString(),
              buyin: 100,
              venue: "Mock Venue",
            },
            error: null,
          }),
        ),
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
      Promise.resolve({
        data: {
          user: {
            id: "mock-user-id",
            email: "test@example.com",
          },
        },
        error: null,
      }),
    ),
    signUp: jest.fn(() =>
      Promise.resolve({
        data: {
          user: {
            id: "mock-user-id",
            email: "test@example.com",
          },
        },
        error: null,
      }),
    ),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    signInWithOAuth: jest.fn(() =>
      Promise.resolve({
        data: { url: "https://mock-oauth-url.com" },
        error: null,
      }),
    ),
    getUser: jest.fn(() =>
      Promise.resolve({
        data: {
          user: {
            id: "mock-user-id",
            email: "test@example.com",
          },
        },
        error: null,
      }),
    ),
    getSession: jest.fn(() =>
      Promise.resolve({
        data: {
          session: {
            user: {
              id: "mock-user-id",
              email: "test@example.com",
            },
          },
        },
        error: null,
      }),
    ),
    onAuthStateChange: jest.fn((callback) => {
      // Симулируем аутентифицированного пользователя
      setTimeout(() => {
        callback("SIGNED_IN", {
          user: { id: "mock-user-id", email: "test@example.com" },
        });
      }, 0);

      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      };
    }),
  },
}));

export const createServerComponentClient = jest.fn(() =>
  createClientComponentClient(),
);

export const createAdminClient = jest.fn(() => createClientComponentClient());

// Мок для helper функций
export const getProfile = jest.fn(() =>
  Promise.resolve({
    id: "mock-user-id",
    username: "testuser",
    role: "player",
    telegram_id: null,
  }),
);

export const createProfile = jest.fn(() =>
  Promise.resolve({
    id: "mock-user-id",
    username: "testuser",
    role: "player",
    telegram_id: null,
  }),
);

export const updateProfile = jest.fn(() =>
  Promise.resolve({
    id: "mock-user-id",
    username: "testuser",
    role: "player",
    telegram_id: null,
  }),
);

export const getProfileByTelegramId = jest.fn(() => Promise.resolve(null));

export const isAdmin = jest.fn(() => Promise.resolve(false));

export const getUserOrCreate = jest.fn(() =>
  Promise.resolve({
    id: "mock-user-id",
    username: "testuser",
    role: "player",
    telegram_id: 123456789,
  }),
);

// Backward compatibility exports
export const supabase = createClientComponentClient();
export const supabaseAdmin = createAdminClient();
