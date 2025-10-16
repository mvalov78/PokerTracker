/**
 * API endpoint для получения обновлений от Telegram через webhook
 * Используется когда бот работает в webhook режиме
 */

import { type NextRequest, NextResponse } from "next/server";
import { getBotInstance } from "../../../../bot";

/**
 * POST handler для webhook от Telegram
 * Telegram отправляет сюда обновления когда бот работает в webhook режиме
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем тело запроса от Telegram
    const update = await request.json();

    console.log("[Telegram Webhook] Получено обновление:", {
      updateId: update.update_id,
      hasMessage: !!update.message,
      hasCallbackQuery: !!update.callback_query,
      timestamp: new Date().toISOString(),
    });

    // Получаем экземпляр бота
    const bot = getBotInstance();

    if (!bot) {
      console.error("[Telegram Webhook] Бот не инициализирован");
      // Возвращаем 200 чтобы Telegram не пытался переотправить
      return NextResponse.json(
        {
          ok: false,
          error: "Bot not initialized",
        },
        { status: 200 },
      );
    }

    // Обрабатываем обновление через экземпляр бота
    await bot.handleUpdate(update);

    console.log(
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

