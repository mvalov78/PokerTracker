/**
 * API endpoint для получения обновлений от Telegram через webhook
 * Используется когда бот работает в webhook режиме
 */

import { type NextRequest, NextResponse } from "next/server";
import { Telegraf } from "telegraf";
import { BotCommands } from "../../../../bot/commands";
import { PhotoHandler } from "../../../../bot/handlers/photoHandler";
import { createSessionMiddleware } from "../../../../bot/middleware/sessionMiddleware";

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

  webhookBot.use(createSessionMiddleware("[Telegram Webhook]"));

  webhookBot.catch(async (err, ctx) => {
    console.error("[Telegram Webhook] Unhandled bot error:", err);
    try {
      await ctx.reply(
        "❌ Произошла ошибка при обработке сообщения. Попробуйте ещё раз или /help.",
      );
    } catch (replyError) {
      console.error("[Telegram Webhook] Failed to send error reply:", replyError);
    }
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

  // Обработка текстовых сообщений (для состояний: ввод результата, редактирование и т.д.)
  webhookBot.on("text", async (ctx) => {
    const text = ctx.message.text;
    const session = ctx.session;

    console.warn(`[Telegram Webhook] Текстовое сообщение получено:`, {
      text,
      userId: ctx.from?.id,
      hasSession: !!session,
      currentAction: session?.currentAction,
      sessionData: session
        ? {
            userId: session.userId,
            currentAction: session.currentAction,
            hasTournamentData: !!session.tournamentData,
          }
        : null,
    });

    // Если текст является командой, пропускаем (обработается command handler)
    if (text.startsWith("/")) {
      console.warn("[Telegram Webhook] Это команда, пропускаем text handler");
      return;
    }

    // Если пользователь в процессе регистрации турнира
    if (session?.currentAction === "register_tournament") {
      console.warn("[Telegram Webhook] Обработка регистрации турнира");
      await commands!.handleTournamentRegistration(ctx, text);
      return;
    }

    // Если пользователь добавляет результат
    if (session?.currentAction === "add_result") {
      console.warn(
        "[Telegram Webhook] Обработка ввода результата, tournamentId:",
        session.tournamentData?.tournamentId,
      );
      await commands!.handleResultInput(ctx, text);
      return;
    }

    // Если пользователь редактирует данные турнира
    if (session?.currentAction === "edit_tournament") {
      console.warn("[Telegram Webhook] Обработка редактирования турнира");
      await commands!.handleTournamentEdit(ctx, text);
      return;
    }

    // Обычное текстовое сообщение без контекста
    console.warn(
      "[Telegram Webhook] Текстовое сообщение без активного действия, отправляем help message",
    );
    await ctx.reply(
      "🤖 Я не понимаю эту команду. Используйте /help для получения списка доступных команд.",
    );
  });

  // Обработка callback queries (кнопки inline клавиатуры)
  webhookBot.on("callback_query", async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    console.warn("[Telegram Webhook] Получен callback_query:", callbackData);

    if (!callbackData) {
      await ctx.answerCbQuery("Нет данных в callback");
      return;
    }

    // Парсим callback data (формат: action:param1:param2)
    const [action, ...params] = callbackData.split(":");

    try {
      switch (action) {
        case "tournament_select":
          console.warn(
            `[Telegram Webhook] Обработка выбора турнира: ${params[0]}`,
          );
          await commands!.selectTournament(ctx, params[0]);
          console.warn(`[Telegram Webhook] После selectTournament, сессия:`, {
            currentAction: ctx.session?.currentAction,
            tournamentId: ctx.session?.tournamentData?.tournamentId,
          });
          break;
        case "result_confirm":
          console.warn(
            `[Telegram Webhook] Обработка подтверждения результата: ${params[0]}`,
          );
          await commands!.confirmResult(ctx, params[0]);
          break;
        case "notification_toggle":
          console.warn(
            `[Telegram Webhook] Переключение уведомлений: ${params[0]}`,
          );
          await commands!.toggleNotification(ctx, params[0]);
          break;
        case "confirm_tournament":
          console.warn("[Telegram Webhook] Подтверждение турнира");
          await photoHandler!.confirmTournament(ctx);
          break;
        case "cancel_tournament":
          console.warn("[Telegram Webhook] Отмена турнира");
          await photoHandler!.cancelTournament(ctx);
          break;
        case "edit_tournament":
          console.warn("[Telegram Webhook] Редактирование турнира");
          await photoHandler!.editTournament(ctx);
          break;
        default:
          console.warn(
            `[Telegram Webhook] Неизвестный callback action: ${action}`,
          );
          await ctx.answerCbQuery("Неизвестная команда");
      }
    } catch (error) {
      console.error(
        `[Telegram Webhook] Ошибка обработки callback_query:`,
        error,
      );
      await ctx.answerCbQuery("Произошла ошибка при обработке команды");
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
