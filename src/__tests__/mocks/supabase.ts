/**
 * Enhanced Supabase mocks for testing
 */

export interface MockSupabaseResponse<T = any> {
  data: T | null;
  error: any | null;
}

export function createMockSupabaseClient() {
  let mockData: any = null;
  let mockError: any = null;

  const createChain = () => ({
    from: jest.fn(() => createChain()),
    select: jest.fn(() => createChain()),
    insert: jest.fn(() => createChain()),
    update: jest.fn(() => createChain()),
    upsert: jest.fn(() => createChain()),
    delete: jest.fn(() => createChain()),
    eq: jest.fn(() => createChain()),
    single: jest.fn(() =>
      Promise.resolve({ data: mockData, error: mockError }),
    ),
    order: jest.fn(() => createChain()),
    limit: jest.fn(() => createChain()),
    not: jest.fn(() => createChain()),
    in: jest.fn(() => createChain()),
    rpc: jest.fn(() => Promise.resolve({ data: mockData, error: mockError })),
    then: jest.fn((callback) => callback({ data: mockData, error: mockError })),
    catch: jest.fn(),
  });

  return {
    client: createChain(),
    setMockData: (data: any) => {
      mockData = data;
    },
    setMockError: (error: any) => {
      mockError = error;
    },
    resetMocks: () => {
      mockData = null;
      mockError = null;
    },
  };
}

export function createMockAdminClient() {
  return createMockSupabaseClient();
}

export interface MockBotSession {
  user_id: number;
  session_data: any;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface MockBotSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  created_at: string;
  updated_at: string;
}

export interface MockUserSettings {
  id: string;
  user_id: string;
  current_venue?: string;
  notification_preferences: any;
  created_at: string;
  updated_at: string;
}

export function createMockBotSession(
  overrides?: Partial<MockBotSession>,
): MockBotSession {
  return {
    user_id: 123456789,
    session_data: {
      userId: "123456789",
      currentAction: undefined,
      tournamentData: undefined,
      ocrData: undefined,
    },
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockBotSetting(
  key: string,
  value: string,
  overrides?: Partial<MockBotSetting>,
): MockBotSetting {
  return {
    id: `setting_${key}`,
    setting_key: key,
    setting_value: value,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockUserSettings(
  overrides?: Partial<MockUserSettings>,
): MockUserSettings {
  return {
    id: "settings_123",
    user_id: "user_123",
    current_venue: "Test Casino",
    notification_preferences: {
      reminders: true,
      weeklyStats: true,
      achievements: true,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
