/**
 * Тесты для команд Telegram бота
 */

import { BotCommands } from "@/bot/commands";
import { UserSettingsService } from "@/services/userSettingsService";
import type { BotContext } from "@/bot/index";

// Мокаем сервисы
jest.mock("@/services/userSettingsService");
jest.mock("@/lib/supabase");

describe("Bot Commands Tests", () => {
  let commands: BotCommands;
  let mockCtx: Partial<BotContext>;

  beforeEach(() => {
    jest.clearAllMocks();
    global.resetMocks?.();

    commands = new BotCommands();
    mockCtx = {
      reply: jest.fn(),
      answerCbQuery: jest.fn(),
      editMessageText: jest.fn(),
      from: { id: 123456789, username: "testuser" },
      session: {
        userId: "123456789",
        currentAction: undefined,
        tournamentData: undefined,
        ocrData: undefined,
      },
      message: {
        text: "/help",
        from: { id: 123456789, username: "testuser" },
      },
    };
  });

  describe("start command", () => {
    test("should send welcome message", async () => {
      await commands.start(mockCtx as BotContext);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Добро пожаловать в PokerTracker Pro Bot!"),
        { parse_mode: "Markdown" },
      );
    });
  });

  describe("help command", () => {
    test("should send help message", async () => {
      await commands.help(mockCtx as BotContext);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Справка по командам PokerTracker Pro Bot"),
        { parse_mode: "Markdown" },
      );
    });

    test("should handle markdown errors gracefully", async () => {
      // Мокаем ошибку markdown
      (mockCtx.reply as jest.Mock)
        .mockRejectedValueOnce(new Error("Markdown error"))
        .mockResolvedValueOnce(undefined);

      await commands.help(mockCtx as BotContext);

      // Должен попробовать отправить без markdown
      expect(mockCtx.reply).toHaveBeenCalledTimes(2);
    });
  });

  describe("link command", () => {
    test("should show link instructions when no code provided", async () => {
      mockCtx.message!.text = "/link";

      await commands.link(mockCtx as BotContext);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Связывание с веб-аккаунтом"),
        { parse_mode: "Markdown" },
      );
    });

    test("should process linking code", async () => {
      mockCtx.message!.text = "/link ABC123XY";

      // Мокаем успешный API ответ
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              user: { username: "testuser" },
            }),
        }),
      ) as jest.Mock;

      await commands.link(mockCtx as BotContext);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Аккаунты успешно связаны!"),
        { parse_mode: "Markdown" },
      );
    });

    test("should handle linking errors", async () => {
      mockCtx.message!.text = "/link INVALID";

      // Мокаем ошибку API
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              success: false,
              error: "Invalid linking code",
            }),
        }),
      ) as jest.Mock;

      await commands.link(mockCtx as BotContext);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Неверный код связывания"),
        { parse_mode: "Markdown" },
      );
    });
  });

  describe("venue management", () => {
    test("should show current venue", async () => {
      (UserSettingsService.getCurrentVenue as jest.Mock).mockResolvedValue(
        "PokerStars Live",
      );

      await commands.showCurrentVenue(mockCtx as BotContext);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Текущая площадка: PokerStars Live"),
        { parse_mode: "Markdown" },
      );
    });

    test("should handle no venue set", async () => {
      (UserSettingsService.getCurrentVenue as jest.Mock).mockResolvedValue(
        null,
      );

      await commands.showCurrentVenue(mockCtx as BotContext);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Текущая площадка не установлена"),
        { parse_mode: "Markdown" },
      );
    });

    test("should set venue successfully", async () => {
      mockCtx.message!.text = "/setvenue PokerStars Live";
      (UserSettingsService.updateCurrentVenue as jest.Mock).mockResolvedValue({
        currentVenue: "PokerStars Live",
      });

      await commands.setCurrentVenue(mockCtx as BotContext);

      expect(UserSettingsService.updateCurrentVenue).toHaveBeenCalledWith(
        "123456789",
        "PokerStars Live",
      );
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Площадка установлена: PokerStars Live"),
        { parse_mode: "Markdown" },
      );
    });

    test("should handle invalid venue command format", async () => {
      mockCtx.message!.text = "/setvenue";

      await commands.setCurrentVenue(mockCtx as BotContext);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Неверный формат команды"),
        { parse_mode: "Markdown" },
      );
    });
  });

  describe("tournament management", () => {
    test("should list tournaments", async () => {
      // Мокаем API ответ
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              tournaments: [
                {
                  id: "tournament-1",
                  name: "Test Tournament",
                  buyin: 100,
                  venue: "Test Venue",
                  date: new Date().toISOString(),
                  result: null,
                },
              ],
            }),
        }),
      ) as jest.Mock;

      await commands.listTournaments(mockCtx as BotContext);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Ваши турниры:"),
        { parse_mode: "Markdown" },
      );
    });

    test("should handle no tournaments", async () => {
      // Мокаем пустой ответ
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              tournaments: [],
            }),
        }),
      ) as jest.Mock;

      await commands.listTournaments(mockCtx as BotContext);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        "📝 У вас пока нет зарегистрированных турниров.",
      );
    });
  });

  describe("statistics", () => {
    test("should calculate and display stats", async () => {
      const mockTournaments = [
        {
          id: "tournament-1",
          buyin: 100,
          result: { position: 1, payout: 500 },
        },
        {
          id: "tournament-2",
          buyin: 200,
          result: { position: 5, payout: 300 },
        },
      ];

      // Мокаем API ответ
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              tournaments: mockTournaments,
            }),
        }),
      ) as jest.Mock;

      await commands.getStats(mockCtx as BotContext);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Ваша статистика"),
        { parse_mode: "Markdown" },
      );
    });

    test("should handle no tournaments for stats", async () => {
      // Мокаем пустой ответ
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              tournaments: [],
            }),
        }),
      ) as jest.Mock;

      await commands.getStats(mockCtx as BotContext);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        "📊 У вас пока нет турниров для статистики.",
      );
    });
  });
});

