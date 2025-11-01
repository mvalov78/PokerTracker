/**
 * Tests for bot utilities
 */

import {
  formatCurrency,
  formatPercentage,
  formatDate,
  formatTimeUntil,
  createInlineKeyboard,
  createSelectionKeyboard,
  escapeMarkdown,
  getUserInfo,
  checkUserAccess,
  createProgressBar,
  generateId,
  validateTournamentData,
  validateTournamentResult,
  parseCommand,
  createErrorMessage,
  createSuccessMessage,
  truncateText,
  createPaginatedMenu,
} from "@/bot/utils";
import { createMockBotContext } from "../mocks/telegraf";

describe("Bot Utilities", () => {
  describe("formatCurrency", () => {
    it("should format USD currency", () => {
      expect(formatCurrency(1000, "USD")).toBe("$1,000");
      expect(formatCurrency(500)).toBe("$500");
    });

    it("should format EUR currency", () => {
      expect(formatCurrency(1000, "EUR")).toBe("€1,000");
    });

    it("should format RUB currency", () => {
      expect(formatCurrency(1000, "RUB")).toBe("₽1,000");
    });

    it("should handle zero amount", () => {
      expect(formatCurrency(0)).toBe("$0");
    });

    it("should handle negative amounts", () => {
      expect(formatCurrency(-500)).toContain("-");
      expect(formatCurrency(-500)).toContain("500");
    });
  });

  describe("formatPercentage", () => {
    it("should format positive percentage", () => {
      expect(formatPercentage(25.5)).toBe("+25.5%");
    });

    it("should format negative percentage", () => {
      expect(formatPercentage(-15.3)).toBe("-15.3%");
    });

    it("should respect decimal places", () => {
      expect(formatPercentage(25.567, 2)).toBe("+25.57%");
      expect(formatPercentage(25.567, 0)).toBe("+26%");
    });
  });

  describe("formatDate", () => {
    it("should format date string", () => {
      const date = "2024-01-15T18:00:00Z";
      const result = formatDate(date);

      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });

    it("should format Date object", () => {
      const date = new Date("2024-01-15T18:00:00Z");
      const result = formatDate(date);

      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });

    it("should accept custom options", () => {
      const date = "2024-01-15T18:00:00Z";
      const options = { year: "numeric" as const, month: "short" as const };
      const result = formatDate(date, options);

      expect(result).toBeTruthy();
    });
  });

  describe("formatTimeUntil", () => {
    it("should show days and hours for future date", () => {
      const futureDate = new Date(Date.now() + 25 * 60 * 60 * 1000); // 25 hours
      const result = formatTimeUntil(futureDate);

      expect(result).toContain("через");
      expect(result).toContain("дн.");
    });

    it("should show hours and minutes for near future", () => {
      const futureDate = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours
      const result = formatTimeUntil(futureDate);

      expect(result).toContain("через");
      expect(result).toContain("ч.");
    });

    it("should show minutes only for very near future", () => {
      const futureDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      const result = formatTimeUntil(futureDate);

      expect(result).toContain("через");
      expect(result).toContain("мин.");
    });

    it('should show "Прошло" for past date', () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000);
      const result = formatTimeUntil(pastDate);

      expect(result).toBe("Прошло");
    });
  });

  describe("createInlineKeyboard", () => {
    it("should create keyboard with single row", () => {
      const keyboard = createInlineKeyboard([
        [
          { text: "Button 1", data: "btn1" },
          { text: "Button 2", data: "btn2" },
        ],
      ]);

      expect(keyboard.inline_keyboard).toHaveLength(1);
      expect(keyboard.inline_keyboard[0]).toHaveLength(2);
      expect(keyboard.inline_keyboard[0][0].text).toBe("Button 1");
      expect(keyboard.inline_keyboard[0][0].callback_data).toBe("btn1");
    });

    it("should create keyboard with multiple rows", () => {
      const keyboard = createInlineKeyboard([
        [{ text: "Button 1", data: "btn1" }],
        [{ text: "Button 2", data: "btn2" }],
      ]);

      expect(keyboard.inline_keyboard).toHaveLength(2);
    });
  });

  describe("createSelectionKeyboard", () => {
    it("should create selection keyboard from items", () => {
      const items = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
        { id: "3", name: "Item 3" },
      ];

      const keyboard = createSelectionKeyboard(
        items,
        (item) => item.name,
        (item) => item.id,
        "select",
      );

      expect(keyboard.inline_keyboard).toHaveLength(3);
      expect(keyboard.inline_keyboard[0][0].text).toBe("Item 1");
      expect(keyboard.inline_keyboard[0][0].callback_data).toBe("select:1");
    });

    it("should support multiple items per row", () => {
      const items = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
        { id: "3", name: "Item 3" },
        { id: "4", name: "Item 4" },
      ];

      const keyboard = createSelectionKeyboard(
        items,
        (item) => item.name,
        (item) => item.id,
        "select",
        2,
      );

      expect(keyboard.inline_keyboard).toHaveLength(2);
      expect(keyboard.inline_keyboard[0]).toHaveLength(2);
    });
  });

  describe("escapeMarkdown", () => {
    it("should escape special characters", () => {
      expect(escapeMarkdown("Test_text")).toBe("Test\\_text");
      expect(escapeMarkdown("Test*text")).toBe("Test\\*text");
      expect(escapeMarkdown("Test[text]")).toBe("Test\\[text\\]");
    });

    it("should escape multiple special characters", () => {
      const text = "_*[]()~`>#+=|{}.!-";
      const escaped = escapeMarkdown(text);

      expect(escaped).toContain("\\");
      expect(escaped.length).toBeGreaterThan(text.length);
    });
  });

  describe("getUserInfo", () => {
    it("should extract user info from context", () => {
      const ctx = createMockBotContext();

      const info = getUserInfo(ctx as any);

      expect(info.id).toBe("123456789");
      expect(info.username).toBe("testuser");
      expect(info.firstName).toBe("Test");
      expect(info.lastName).toBe("User");
      expect(info.fullName).toBe("Test User");
    });

    it("should handle context without user", () => {
      const ctx = createMockBotContext({ from: undefined });

      const info = getUserInfo(ctx as any);

      expect(info.id).toBe("unknown");
      expect(info.fullName).toBe("Неизвестный пользователь");
    });

    it("should handle user without last name", () => {
      const ctx = createMockBotContext({
        from: { id: 123, first_name: "Test", username: "test" },
      });

      const info = getUserInfo(ctx as any);

      expect(info.fullName).toBe("Test");
    });
  });

  describe("checkUserAccess", () => {
    it("should allow all users when no list provided", () => {
      const ctx = createMockBotContext();

      expect(checkUserAccess(ctx as any)).toBe(true);
      expect(checkUserAccess(ctx as any, [])).toBe(true);
    });

    it("should allow user in allowed list", () => {
      const ctx = createMockBotContext();

      expect(checkUserAccess(ctx as any, ["123456789"])).toBe(true);
    });

    it("should allow user by username", () => {
      const ctx = createMockBotContext();

      expect(checkUserAccess(ctx as any, ["@testuser"])).toBe(true);
    });

    it("should deny user not in allowed list", () => {
      const ctx = createMockBotContext();

      expect(checkUserAccess(ctx as any, ["999999"])).toBe(false);
    });
  });

  describe("createProgressBar", () => {
    it("should create full progress bar", () => {
      const bar = createProgressBar(10, 10, 10);

      expect(bar).toBe("██████████");
      expect(bar.length).toBe(10);
    });

    it("should create half progress bar", () => {
      const bar = createProgressBar(5, 10, 10);

      expect(bar).toContain("█");
      expect(bar).toContain("░");
      expect(bar.length).toBe(10);
    });

    it("should create empty progress bar", () => {
      const bar = createProgressBar(0, 10, 10);

      expect(bar).toBe("░░░░░░░░░░");
    });

    it("should handle progress over 100%", () => {
      const bar = createProgressBar(15, 10, 10);

      expect(bar).toBe("██████████");
    });
  });

  describe("generateId", () => {
    it("should generate random ID", () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it("should include prefix", () => {
      const id = generateId("user_");

      expect(id).toMatch(/^user_/);
    });

    it("should respect length parameter", () => {
      const id = generateId("", 12);

      expect(id.length).toBe(12);
    });
  });

  describe("validateTournamentData", () => {
    it("should validate complete tournament data", () => {
      const data = {
        name: "Test Tournament",
        date: "2024-01-15T18:00:00Z",
        buyin: "100",
      };

      const result = validateTournamentData(data);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing name", () => {
      const data = {
        name: "",
        date: "2024-01-15T18:00:00Z",
        buyin: "100",
      };

      const result = validateTournamentData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Название турнира не может быть пустым");
    });

    it("should detect invalid date", () => {
      const data = {
        name: "Test",
        date: "invalid-date",
        buyin: "100",
      };

      const result = validateTournamentData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Некорректная дата турнира");
    });

    it("should detect invalid buyin", () => {
      const data = {
        name: "Test",
        date: "2024-01-15T18:00:00Z",
        buyin: "invalid",
      };

      const result = validateTournamentData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Бай-ин должен быть положительным числом",
      );
    });
  });

  describe("validateTournamentResult", () => {
    it("should validate complete result data", () => {
      const data = {
        position: "5",
        payout: "200",
      };

      const result = validateTournamentResult(data);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect invalid position", () => {
      const data = {
        position: "0",
        payout: "200",
      };

      const result = validateTournamentResult(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Место должно быть положительным числом");
    });

    it("should detect negative payout", () => {
      const data = {
        position: "5",
        payout: "-100",
      };

      const result = validateTournamentResult(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Выигрыш должен быть неотрицательным числом",
      );
    });
  });

  describe("parseCommand", () => {
    it("should parse command without arguments", () => {
      const result = parseCommand("/start");

      expect(result.command).toBe("/start");
      expect(result.args).toHaveLength(0);
    });

    it("should parse command with arguments", () => {
      const result = parseCommand("/setvenue Royal Casino");

      expect(result.command).toBe("/setvenue");
      expect(result.args).toEqual(["Royal", "Casino"]);
    });

    it("should handle multiple spaces", () => {
      const result = parseCommand("/command  arg1   arg2");

      expect(result.command).toBe("/command");
      expect(result.args).toEqual(["arg1", "arg2"]);
    });
  });

  describe("createErrorMessage", () => {
    it("should create error message without suggestion", () => {
      const message = createErrorMessage("Something went wrong");

      expect(message).toContain("❌");
      expect(message).toContain("Something went wrong");
    });

    it("should create error message with suggestion", () => {
      const message = createErrorMessage("Error occurred", "Try again");

      expect(message).toContain("❌");
      expect(message).toContain("Error occurred");
      expect(message).toContain("💡");
      expect(message).toContain("Try again");
    });
  });

  describe("createSuccessMessage", () => {
    it("should create success message without details", () => {
      const message = createSuccessMessage("Operation completed");

      expect(message).toContain("✅");
      expect(message).toContain("Operation completed");
    });

    it("should create success message with details", () => {
      const message = createSuccessMessage("Done", "Additional info");

      expect(message).toContain("✅");
      expect(message).toContain("Done");
      expect(message).toContain("Additional info");
    });
  });

  describe("truncateText", () => {
    it("should not truncate short text", () => {
      const text = "Short text";
      expect(truncateText(text)).toBe("Short text");
    });

    it("should truncate long text", () => {
      const text = "x".repeat(5000);
      const truncated = truncateText(text, 100);

      expect(truncated.length).toBeLessThanOrEqual(100);
      expect(truncated).toContain("...");
    });

    it("should respect maxLength parameter", () => {
      const text = "Hello world this is a long text";
      const truncated = truncateText(text, 15);

      expect(truncated.length).toBeLessThanOrEqual(15);
    });
  });

  describe("createPaginatedMenu", () => {
    const items = Array.from({ length: 25 }, (_, i) => ({
      id: `item_${i}`,
      name: `Item ${i}`,
    }));

    it("should create first page", () => {
      const result = createPaginatedMenu(
        items,
        0,
        10,
        (item) => item.name,
        (item) => `select:${item.id}`,
        "page",
      );

      expect(result.keyboard.inline_keyboard.length).toBeGreaterThan(0);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    it("should create middle page", () => {
      const result = createPaginatedMenu(
        items,
        1,
        10,
        (item) => item.name,
        (item) => `select:${item.id}`,
        "page",
      );

      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });

    it("should create last page", () => {
      const result = createPaginatedMenu(
        items,
        2,
        10,
        (item) => item.name,
        (item) => `select:${item.id}`,
        "page",
      );

      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });

    it("should handle single page", () => {
      const smallItems = items.slice(0, 5);
      const result = createPaginatedMenu(
        smallItems,
        0,
        10,
        (item) => item.name,
        (item) => `select:${item.id}`,
        "page",
      );

      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });
  });
});
