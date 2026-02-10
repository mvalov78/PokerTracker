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
  let upsertResult: any = null;
  let callCount = 0;
  const dataSequence: any[] = [];
  let lastFromTable: string | null = null;

  // Create a single shared chain object that will be reused
  const createChain = () => {
    const chain: any = {};
    
    // Track table name so select() after upsert (tournament_results) returns upsertResult; select() after from(tournaments) returns chain
    chain.from = jest.fn(function(table: string) {
      lastFromTable = table;
      return chain;
    });
    chain.select = jest.fn(function(query?: string) {
      // Only return upsert result when select() is called after upsert on tournament_results
      if (lastFromTable === "tournament_results" && upsertResult !== null) {
        const result = Promise.resolve({ data: upsertResult, error: mockError });
        upsertResult = null;
        lastFromTable = null;
        return result;
      }
      lastFromTable = null;
      return chain;
    });
    chain.insert = jest.fn(function() { return chain; });
    chain.update = jest.fn(function(data: any) {
      // Update returns chain for chaining, but also supports then/catch
      chain.then = jest.fn((callback) => {
        return Promise.resolve(callback({ data: null, error: mockError }));
      });
      chain.catch = jest.fn();
      return chain;
    });
    chain.upsert = jest.fn(function(data: any, options?: any) {
      // Store the upsert result for select() to return
      upsertResult = Array.isArray(data) ? data : [data];
      return chain; // Return chain so select() can be called
    });
    chain.delete = jest.fn(function() { return chain; });
    chain.eq = jest.fn(function() { return chain; });
    chain.single = jest.fn(() => {
      // Use data sequence if available, otherwise use mockData
      const data = dataSequence.length > 0 
        ? (dataSequence[callCount] ?? dataSequence[dataSequence.length - 1])
        : mockData;
      callCount++;
      return Promise.resolve({ data, error: mockError });
    });
    chain.order = jest.fn(function(column?: string, options?: { ascending?: boolean }) {
      // Return chain, but also support direct promise resolution
      chain.then = jest.fn((callback) => {
        const data = Array.isArray(mockData) ? mockData : (mockData ? [mockData] : []);
        return Promise.resolve(callback({ data, error: mockError }));
      });
      chain.catch = jest.fn();
      return chain;
    });
    chain.limit = jest.fn(function() { return chain; });
    chain.not = jest.fn(function() { return chain; });
    chain.in = jest.fn(function() { return chain; });
    chain.rpc = jest.fn(() => Promise.resolve({ data: mockData, error: mockError }));
    chain.then = jest.fn((callback) => {
      const data = Array.isArray(mockData) ? mockData : (mockData ? [mockData] : []);
      return Promise.resolve(callback({ data, error: mockError }));
    });
    chain.catch = jest.fn();
    
    return chain;
  };

  return {
    client: createChain(),
    setMockData: (data: any) => {
      mockData = data;
    },
    setMockError: (error: any) => {
      mockError = error;
    },
    setUpsertResult: (result: any) => {
      upsertResult = Array.isArray(result) ? result : [result];
    },
    setDataSequence: (sequence: any[]) => {
      dataSequence.length = 0;
      dataSequence.push(...sequence);
      callCount = 0;
    },
    resetMocks: () => {
      mockData = null;
      mockError = null;
      upsertResult = null;
      callCount = 0;
      dataSequence.length = 0;
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
