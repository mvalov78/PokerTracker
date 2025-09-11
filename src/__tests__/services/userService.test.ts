import { UserService } from "@/services/userService";

// Используем глобальные функции управления моками
const { setMockData, setMockError, resetMocks } = global;

// Сбрасываем моки перед каждым тестом
beforeEach(() => {
  resetMocks();
});

describe("UserService", () => {
  describe("getUserUuidByTelegramId", () => {
    it("should return UUID for existing user", async () => {
      const mockUser = {
        id: "uuid-123",
        telegram_id: "12345",
        created_at: "2024-01-01T00:00:00Z",
      };

      setMockData(mockUser);

      const result = await UserService.getUserUuidByTelegramId("12345");

      expect(result).toBe("uuid-123");
    });

    it("should return null when user not found and creation fails", async () => {
      setMockData(null);

      const result = await UserService.getUserUuidByTelegramId("67890");

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      setMockError({ message: "Database error" });

      const result = await UserService.getUserUuidByTelegramId("12345");

      expect(result).toBeNull();
    });
  });

  describe("createUserFromTelegramId", () => {
    it("should create new user successfully", async () => {
      const mockNewUser = {
        id: "new-uuid-789",
        telegram_id: "99999",
        created_at: "2024-01-01T00:00:00Z",
      };

      setMockData(mockNewUser);

      const result = await UserService.createUserFromTelegramId("99999");

      expect(result).toEqual(mockNewUser);
    });

    it("should handle creation errors", async () => {
      setMockError({ message: "Creation failed" });

      const result = await UserService.createUserFromTelegramId("99999");

      expect(result).toBeNull();
    });
  });
});
