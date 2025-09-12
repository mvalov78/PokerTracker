/**
 * Тесты для Telegram API endpoints
 */

import { POST as generateCodePOST } from "@/app/api/telegram/generate-code/route";
import { GET as statusGET } from "@/app/api/telegram/status/route";
import { POST as unlinkPOST } from "@/app/api/telegram/unlink/route";
import { POST as linkPOST } from "@/app/api/telegram/link/route";
import { NextRequest } from "next/server";

// Мокаем Supabase
jest.mock("@/lib/supabase");

describe("Telegram API Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.resetMocks?.();
  });

  describe("/api/telegram/generate-code", () => {
    test("should generate linking code successfully", async () => {
      global.setMockData({
        id: "code-id",
        user_id: "test-user-id",
        linking_code: "ABC123XY",
        expires_at: new Date(Date.now() + 600000).toISOString(),
        is_used: false,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/telegram/generate-code",
        {
          method: "POST",
          body: JSON.stringify({ userId: "test-user-id" }),
        },
      );

      const response = await generateCodePOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.code).toBeDefined();
      expect(data.expiresAt).toBeDefined();
    });

    test("should handle missing userId", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/telegram/generate-code",
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );

      const response = await generateCodePOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("User ID is required");
    });
  });

  describe("/api/telegram/status", () => {
    test("should return linking status", async () => {
      global.setMockData({
        id: "profile-id",
        telegram_id: 123456789,
      });

      const url = new URL(
        "http://localhost:3000/api/telegram/status?userId=test-user-id",
      );
      const request = new NextRequest(url);

      const response = await statusGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.isLinked).toBeDefined();
    });

    test("should handle missing userId parameter", async () => {
      const url = new URL("http://localhost:3000/api/telegram/status");
      const request = new NextRequest(url);

      const response = await statusGET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("User ID is required");
    });
  });

  describe("/api/telegram/link", () => {
    test("should link accounts successfully", async () => {
      // Мокаем успешное получение кода
      global.setMockData({
        id: "code-id",
        user_id: "test-user-id",
        linking_code: "ABC123XY",
        expires_at: new Date(Date.now() + 600000).toISOString(),
        is_used: false,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/telegram/link",
        {
          method: "POST",
          body: JSON.stringify({
            telegramId: "123456789",
            linkingCode: "ABC123XY",
          }),
        },
      );

      const response = await linkPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("успешно связаны");
    });

    test("should handle invalid linking code", async () => {
      global.setMockData(null); // Код не найден

      const request = new NextRequest(
        "http://localhost:3000/api/telegram/link",
        {
          method: "POST",
          body: JSON.stringify({
            telegramId: "123456789",
            linkingCode: "INVALID",
          }),
        },
      );

      const response = await linkPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid linking code");
    });

    test("should handle missing parameters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/telegram/link",
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );

      const response = await linkPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Telegram ID and linking code are required");
    });
  });

  describe("/api/telegram/unlink", () => {
    test("should unlink account successfully", async () => {
      global.setMockData({
        id: "profile-id",
        telegram_id: null,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/telegram/unlink",
        {
          method: "POST",
          body: JSON.stringify({ userId: "test-user-id" }),
        },
      );

      const response = await unlinkPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("успешно отвязан");
    });

    test("should handle missing userId", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/telegram/unlink",
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );

      const response = await unlinkPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("User ID is required");
    });
  });
});

