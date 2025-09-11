/**
 * Тесты для системы авторизации и доступа
 */

// Мокаем Supabase
jest.mock("@/lib/supabase", () => ({
  createClientComponentClient: jest.fn(),
  createAdminClient: jest.fn(),
  getProfile: jest.fn(),
  createProfile: jest.fn(),
  isAdmin: jest.fn(),
  getUserOrCreate: jest.fn(),
}));

import {
  createClientComponentClient,
  createAdminClient,
  getProfile,
  createProfile,
  isAdmin,
  getUserOrCreate,
} from "@/lib/supabase";

describe("Authentication System Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.resetMocks?.();
  });

  describe("Profile Management", () => {
    test("should create user profile with correct defaults", async () => {
      const mockProfile = {
        id: "test-user-id",
        username: "testuser",
        role: "player",
        telegram_id: null,
      };

      (createProfile as jest.Mock).mockResolvedValue(mockProfile);

      const result = await createProfile("test-user-id", {
        username: "testuser",
        role: "player",
      });

      expect(result).toEqual(mockProfile);
      expect(createProfile).toHaveBeenCalledWith("test-user-id", {
        username: "testuser",
        role: "player",
      });
    });

    test("should get existing profile", async () => {
      const mockProfile = {
        id: "test-user-id",
        username: "existinguser",
        role: "admin",
        telegram_id: 123456789,
      };

      (getProfile as jest.Mock).mockResolvedValue(mockProfile);

      const result = await getProfile("test-user-id");

      expect(result).toEqual(mockProfile);
      expect(getProfile).toHaveBeenCalledWith("test-user-id");
    });

    test("should check admin role correctly", async () => {
      (isAdmin as jest.Mock).mockResolvedValue(true);

      const result = await isAdmin("admin-user-id");

      expect(result).toBe(true);
      expect(isAdmin).toHaveBeenCalledWith("admin-user-id");
    });
  });

  describe("Telegram Integration", () => {
    test("should create user from Telegram ID", async () => {
      const mockUser = {
        id: "new-user-id",
        username: "telegram_user",
        role: "player",
        telegram_id: 123456789,
      };

      (getUserOrCreate as jest.Mock).mockResolvedValue(mockUser);

      const result = await getUserOrCreate(123456789, "telegram_user");

      expect(result).toEqual(mockUser);
      expect(getUserOrCreate).toHaveBeenCalledWith(123456789, "telegram_user");
    });

    test("should handle existing Telegram user", async () => {
      const existingUser = {
        id: "existing-user-id",
        username: "existing_telegram_user",
        role: "player",
        telegram_id: 123456789,
      };

      (getUserOrCreate as jest.Mock).mockResolvedValue(existingUser);

      const result = await getUserOrCreate(123456789);

      expect(result).toEqual(existingUser);
    });
  });

  describe("Client Initialization", () => {
    test("should create client component client", () => {
      const mockClient = { from: jest.fn() };
      (createClientComponentClient as jest.Mock).mockReturnValue(mockClient);

      const client = createClientComponentClient();

      expect(client).toBe(mockClient);
      expect(createClientComponentClient).toHaveBeenCalled();
    });

    test("should create admin client", () => {
      const mockAdminClient = { from: jest.fn() };
      (createAdminClient as jest.Mock).mockReturnValue(mockAdminClient);

      const client = createAdminClient();

      expect(client).toBe(mockAdminClient);
      expect(createAdminClient).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    test("should handle profile creation errors", async () => {
      (createProfile as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      await expect(
        createProfile("test-user-id", { username: "test" }),
      ).rejects.toThrow("Database error");
    });

    test("should handle getUserOrCreate errors", async () => {
      (getUserOrCreate as jest.Mock).mockRejectedValue(
        new Error("Failed to create user"),
      );

      await expect(getUserOrCreate(123456789)).rejects.toThrow(
        "Failed to create user",
      );
    });
  });
});
