/**
 * Tests for bot commands
 */

import { BotCommands } from "@/bot/commands";
import { createMockBotContext } from "../mocks/telegraf";
import { mockFetch, resetFetchMock } from "../utils/testHelpers";

// Mock user settings service
jest.mock("@/services/userSettingsService", () => ({
  UserSettingsService: {
    getCurrentVenue: jest.fn(),
    updateCurrentVenue: jest.fn(),
  },
}));

import { UserSettingsService } from "@/services/userSettingsService";

const mockGetCurrentVenue =
  UserSettingsService.getCurrentVenue as jest.MockedFunction<
    typeof UserSettingsService.getCurrentVenue
  >;
const mockUpdateCurrentVenue =
  UserSettingsService.updateCurrentVenue as jest.MockedFunction<
    typeof UserSettingsService.updateCurrentVenue
  >;

describe("BotCommands", () => {
  let commands: BotCommands;

  beforeEach(() => {
    commands = new BotCommands();
    jest.clearAllMocks();
    resetFetchMock();
  });

  afterEach(() => {
    resetFetchMock();
  });

  describe("start command", () => {
    it("should send welcome message", async () => {
      const ctx = createMockBotContext();

      await commands.start(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Добро пожаловать"),
        expect.objectContaining({ parse_mode: "Markdown" }),
      );
    });

    it("should include basic commands", async () => {
      const ctx = createMockBotContext();

      await commands.start(ctx as any);

      const callArgs = (ctx.reply as jest.Mock).mock.calls[0][0];
      expect(callArgs).toContain("/link");
      expect(callArgs).toContain("/register");
      expect(callArgs).toContain("/result");
      expect(callArgs).toContain("/tournaments");
      expect(callArgs).toContain("/stats");
    });
  });

  describe("link command", () => {
    it("should show help when no code provided", async () => {
      const ctx = createMockBotContext({
        message: {
          ...createMockBotContext().message!,
          text: "/link",
        },
      });

      await commands.link(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Связывание с веб-аккаунтом"),
        expect.objectContaining({ parse_mode: "Markdown" }),
      );
    });

    it("should process linking code", async () => {
      const ctx = createMockBotContext({
        message: {
          ...createMockBotContext().message!,
          text: "/link ABC123",
        },
      });

      mockFetch({
        success: true,
        message: "Linked successfully",
        user: {
          id: "user123",
          username: "testuser",
        },
      });

      await commands.link(ctx as any);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/telegram/link"),
        expect.any(Object),
      );
    });

    it("should handle missing telegram ID", async () => {
      const ctx = createMockBotContext({
        from: undefined,
        message: {
          ...createMockBotContext().message!,
          text: "/link ABC123",
        },
      });

      await commands.link(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Не удалось получить ваш Telegram ID"),
      );
    });

    it("should handle linking errors", async () => {
      const ctx = createMockBotContext({
        message: {
          ...createMockBotContext().message!,
          text: "/link ABC123",
        },
      });

      mockFetch({ success: false, error: "Invalid code" }, 400);

      await commands.link(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Ошибка"),
        expect.any(Object),
      );
    });
  });

  describe("showCurrentVenue command", () => {
    it("should show current venue", async () => {
      const ctx = createMockBotContext();

      mockGetCurrentVenue.mockResolvedValue("Royal Casino");

      await commands.showCurrentVenue(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Royal Casino"),
        expect.any(Object),
      );
    });

    it("should show message when no venue set", async () => {
      const ctx = createMockBotContext();

      mockGetCurrentVenue.mockResolvedValue(null);

      await commands.showCurrentVenue(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("не установлена"),
        expect.any(Object),
      );
    });
  });

  describe("setCurrentVenue command", () => {
    it("should set venue successfully", async () => {
      const ctx = createMockBotContext({
        message: {
          ...createMockBotContext().message!,
          text: "/setvenue Royal Casino",
        },
      });

      mockUpdateCurrentVenue.mockResolvedValue({} as any);

      await commands.setCurrentVenue(ctx as any);

      expect(mockUpdateCurrentVenue).toHaveBeenCalled();
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("установлена"),
        expect.any(Object),
      );
    });

    it("should handle setting errors", async () => {
      const ctx = createMockBotContext({
        message: {
          ...createMockBotContext().message!,
          text: "/setvenue Test Casino",
        },
      });

      mockUpdateCurrentVenue.mockRejectedValue(new Error("Update failed"));

      await commands.setCurrentVenue(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining("Ошибка"));
    });
  });

  describe("settings command", () => {
    it("should show settings menu", async () => {
      const ctx = createMockBotContext();

      await commands.settings(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Настройки"),
        expect.objectContaining({
          parse_mode: "Markdown",
          reply_markup: expect.any(Object),
        }),
      );
    });

    it("should include notification settings", async () => {
      const ctx = createMockBotContext();

      await commands.settings(ctx as any);

      const callArgs = (ctx.reply as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toContain("уведомлен");
    });
  });

  describe("help command", () => {
    it("should show help message", async () => {
      const ctx = createMockBotContext();

      await commands.help(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Справка"),
        expect.objectContaining({ parse_mode: "Markdown" }),
      );
    });

    it("should list available commands", async () => {
      const ctx = createMockBotContext();

      await commands.help(ctx as any);

      const callArgs = (ctx.reply as jest.Mock).mock.calls[0][0];
      expect(callArgs).toContain("/start");
      expect(callArgs).toContain("/register");
      expect(callArgs).toContain("/stats");
    });
  });

  describe("registerTournament command", () => {
    it("should start registration process", async () => {
      const ctx = createMockBotContext();

      await commands.registerTournament(ctx as any);

      expect(ctx.session.currentAction).toBe("register_tournament");
    });
  });

  describe("addResult command", () => {
    it("should check for tournaments", async () => {
      const ctx = createMockBotContext();

      mockFetch({ success: true, tournaments: [] });

      await commands.addResult(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
    });
  });

  describe("getStats command", () => {
    it("should show user statistics", async () => {
      const ctx = createMockBotContext();

      mockFetch({
        success: true,
        tournaments: [
          {
            id: "1",
            name: "Tournament 1",
            buyin: 100,
            result: { position: 1, payout: 500 },
          },
        ],
      });

      await commands.getStats(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
    });
  });

  describe("listTournaments command", () => {
    it("should list user tournaments", async () => {
      const ctx = createMockBotContext();

      mockFetch({
        success: true,
        tournaments: [
          {
            id: "1",
            name: "Tournament 1",
            date: "2024-01-15T18:00:00Z",
            buyin: 100,
          },
        ],
      });

      await commands.listTournaments(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
    });
  });

  describe("handleResultInput", () => {
    it("should parse result with | separator", async () => {
      const ctx = createMockBotContext({
        session: {
          currentAction: "add_result",
          tournamentData: { tournamentId: "test-id" },
        },
        message: {
          ...createMockBotContext().message!,
          text: "1 | 2500",
        },
      });

      mockFetch({
        success: true,
        tournament: {
          id: "test-id",
          name: "Test Tournament",
          buyin: 100,
          result: { position: 1, payout: 2500, profit: 2400, roi: 2400 },
        },
      });

      await commands.handleResultInput(ctx as any, "1 | 2500");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/tournaments/test-id"),
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining('"position":1'),
        }),
      );
    });

    it("should parse result with - separator", async () => {
      const ctx = createMockBotContext({
        session: {
          currentAction: "add_result",
          tournamentData: { tournamentId: "test-id" },
        },
        message: {
          ...createMockBotContext().message!,
          text: "15 - 0",
        },
      });

      mockFetch({
        success: true,
        tournament: {
          id: "test-id",
          name: "Test Tournament",
          buyin: 100,
          result: { position: 15, payout: 0, profit: -100, roi: -100 },
        },
      });

      await commands.handleResultInput(ctx as any, "15 - 0");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/tournaments/test-id"),
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining('"position":15'),
        }),
      );
    });

    it("should show error for invalid format", async () => {
      const ctx = createMockBotContext({
        session: {
          currentAction: "add_result",
          tournamentData: { tournamentId: "test-id" },
        },
      });

      await commands.handleResultInput(ctx as any, "1,2500");

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Неверный формат"),
        expect.any(Object),
      );
    });

    it("should cancel result input", async () => {
      const ctx = createMockBotContext({
        session: {
          currentAction: "add_result",
          tournamentData: { tournamentId: "test-id" },
        },
      });

      await commands.handleResultInput(ctx as any, "/cancel");

      expect(ctx.session.currentAction).toBeUndefined();
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("отменено"),
      );
    });
  });

  describe("handleTournamentRegistration", () => {
    it("should parse tournament data with | separator", async () => {
      const ctx = createMockBotContext({
        session: {
          currentAction: "register_tournament",
          tournamentData: {},
        },
      });

      await commands.handleTournamentRegistration(
        ctx as any,
        "Sunday Special | 15.12.2024 | 500 | Aria Casino",
      );

      // Should process the input (implementation creates tournament)
      expect(ctx.reply).toHaveBeenCalled();
    });

    it("should parse tournament data with - separator", async () => {
      const ctx = createMockBotContext({
        session: {
          currentAction: "register_tournament",
          tournamentData: {},
        },
      });

      await commands.handleTournamentRegistration(
        ctx as any,
        "Sunday Special - 15.12.2024 - 500 - Aria Casino",
      );

      // Should process the input (implementation creates tournament)
      expect(ctx.reply).toHaveBeenCalled();
    });

    it("should show error for invalid format", async () => {
      const ctx = createMockBotContext({
        session: {
          currentAction: "register_tournament",
          tournamentData: {},
        },
      });

      await commands.handleTournamentRegistration(ctx as any, "Invalid format");

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Неверный формат"),
        expect.any(Object),
      );
    });

    it("should cancel tournament registration", async () => {
      const ctx = createMockBotContext({
        session: {
          currentAction: "register_tournament",
          tournamentData: {},
        },
      });

      await commands.handleTournamentRegistration(ctx as any, "/cancel");

      expect(ctx.session.currentAction).toBeUndefined();
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("отменена"),
      );
    });
  });

  describe("Error handling", () => {
    it("should handle API errors gracefully", async () => {
      const ctx = createMockBotContext({
        message: {
          ...createMockBotContext().message!,
          text: "/link ABC123",
        },
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      await commands.link(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        "❌ Произошла ошибка при связывании аккаунтов. Попробуйте позже.",
      );
    });

    it("should handle missing user context", async () => {
      const ctx = createMockBotContext({ from: undefined });

      await commands.start(ctx as any);

      // Should still send welcome message
      expect(ctx.reply).toHaveBeenCalled();
    });
  });
});
