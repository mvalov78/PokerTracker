/**
 * API endpoint для получения обновлений от Telegram через webhook
 * Используется когда бот работает в webhook режиме
 */

import { type NextRequest, NextResponse } from "next/server";
import { Telegraf } from "telegraf";
import { BotCommands } from "../../../../bot/commands";
import { PhotoHandler } from "../../../../bot/handlers/photoHandler";

// Создаем экземпляр бота для webhook режима (глобальный для serverless)
let webhookBot: Telegraf | null = null;
let commands: BotCommands | null = null;
let photoHandler: PhotoHandler | null = null;

/**
 * Инициализация бота для webhook режима
 */
function initializeWebhookBot() {
  if (webhookBot) {
    return webhookBot;
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || botToken === "mock-bot-token") {
    console.error("[Telegram Webhook] TELEGRAM_BOT_TOKEN не установлен");
    return null;
  }

  console.warn("[Telegram Webhook] Инициализация бота для webhook режима...");

  webhookBot = new Telegraf(botToken);
  commands = new BotCommands();
  photoHandler = new PhotoHandler();
  
  // Хранилище сессий для webhook режима
  const sessions = new Map();
  
  // Middleware для сессий (аналогично как в src/bot/index.ts)
  webhookBot.use((ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) {
      console.warn("[Telegram Webhook] Нет userId, пропускаем middleware сессии");
      return next();
    }
    
    if (!sessions.has(userId)) {
      console.warn(`[Telegram Webhook] Создаем новую сессию для пользователя: ${userId}`);
      sessions.set(userId, {
        userId: userId.toString(),
        currentAction: undefined,
        tournamentData: undefined,
        ocrData: undefined,
      });
    }
    
    const session = sessions.get(userId);
    if (!session) {
      console.error(`[Telegram Webhook] Не удалось получить сессию для пользователя: ${userId}`);
      return next();
    }
    
    ctx.session = session;
    console.warn(`[Telegram Webhook] Сессия установлена для пользователя: ${userId}`);
    return next();
  });

  // Настраиваем обработчики команд
  webhookBot.command("start", async (ctx) => {
    console.warn("[Telegram Webhook] Команда /start");
    await commands!.start(ctx);
  });

  webhookBot.command("link", async (ctx) => {
    console.warn("[Telegram Webhook] Команда /link");
    await commands!.link(ctx);
  });

  webhookBot.command("help", async (ctx) => {
    console.warn("[Telegram Webhook] Команда /help");
    await commands!.help(ctx);
  });

  webhookBot.command("register", async (ctx) => {
    console.warn("[Telegram Webhook] Команда /register");
    await commands!.registerTournament(ctx);
  });

  webhookBot.command("result", async (ctx) => {
    console.warn("[Telegram Webhook] Команда /result");
    await commands!.addResult(ctx);
  });

  webhookBot.command("stats", async (ctx) => {
    console.warn("[Telegram Webhook] Команда /stats");
    await commands!.getStats(ctx);
  });

  webhookBot.command("tournaments", async (ctx) => {
    console.warn("[Telegram Webhook] Команда /tournaments");
    await commands!.listTournaments(ctx);
  });

  webhookBot.command("settings", async (ctx) => {
    console.warn("[Telegram Webhook] Команда /settings");
    await commands!.settings(ctx);
  });

  webhookBot.command("venue", async (ctx) => {
    console.warn("[Telegram Webhook] Команда /venue");
    await commands!.showCurrentVenue(ctx);
  });

  webhookBot.command("setvenue", async (ctx) => {
    console.warn("[Telegram Webhook] Команда /setvenue");
    await commands!.setCurrentVenue(ctx);
  });

  // Обработка фотографий
  webhookBot.on("photo", async (ctx) => {
    console.warn("[Telegram Webhook] Получена фотография");
    await photoHandler!.handlePhoto(ctx);
  });

  // Обработка документов
  webhookBot.on("document", async (ctx) => {
    console.warn("[Telegram Webhook] Получен документ");
    if (ctx.message.document.mime_type?.startsWith("image/")) {
      await photoHandler!.handleDocumentAsPhoto(ctx);
    }
  });

  // Обработка callback queries (кнопки inline клавиатуры)
  webhookBot.on("callback_query", async (ctx) => {
    console.warn("[Telegram Webhook] Получен callback_query:", ctx.callbackQuery.data);
    
    if (!ctx.callbackQuery.data) {
      return;
    }

    switch (ctx.callbackQuery.data) {
      case "confirm_tournament":
        await photoHandler!.confirmTournament(ctx);
        break;
      case "cancel_tournament":
        await photoHandler!.cancelTournament(ctx);
        break;
      case "edit_tournament":
        await photoHandler!.editTournament(ctx);
        break;
      default:
        await ctx.answerCbQuery("Неизвестная команда");
    }
  });

  console.warn("[Telegram Webhook] Бот инициализирован успешно");

  return webhookBot;
}

/**
 * POST handler для webhook от Telegram
 * Telegram отправляет сюда обновления когда бот работает в webhook режиме
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем тело запроса от Telegram
    const update = await request.json();

    console.warn("[Telegram Webhook] Получено обновление:", {
      updateId: update.update_id,
      hasMessage: !!update.message,
      hasCallbackQuery: !!update.callback_query,
      timestamp: new Date().toISOString(),
    });

    // Инициализируем бота если нужно
    const bot = initializeWebhookBot();

    if (!bot) {
      console.error("[Telegram Webhook] Не удалось инициализировать бота");
      return NextResponse.json(
        {
          ok: false,
          error: "Bot initialization failed - check TELEGRAM_BOT_TOKEN",
        },
        { status: 200 },
      );
    }

    // Обрабатываем обновление через Telegraf
    await bot.handleUpdate(update);

    console.warn(
      "[Telegram Webhook] Обновление успешно обработано:",
      update.update_id,
    );

    // Возвращаем успех
    return NextResponse.json({
      ok: true,
      message: "Update processed successfully",
    });
  } catch (error) {
    console.error("[Telegram Webhook] Ошибка обработки webhook:", error);

    // Возвращаем 200 даже при ошибке, чтобы Telegram не спамил повторными попытками
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 },
    );
  }
}

/**
 * GET handler для проверки доступности webhook endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    ok: true,
    message: "Telegram webhook endpoint is active",
    timestamp: new Date().toISOString(),
    info: "Send POST requests with Telegram updates to this endpoint",
  });
}

