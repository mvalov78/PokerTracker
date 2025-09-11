/**
 * Webhook endpoint для Telegram бота (для продакшена)
 */

import { type NextRequest, NextResponse } from "next/server";
import { getBotInstance, initializeBot } from "../../../../bot";
import { BotSettingsService } from "@/services/botSettingsService";

export async function POST(request: NextRequest) {
  try {
    // Получаем update от Telegram
    const update = await request.json();

    console.log(
      "[Webhook] Получено обновление:",
      JSON.stringify(update, null, 2),
    );

    // Получаем или создаем экземпляр бота
    let bot = getBotInstance();
    if (!bot) {
      bot = await initializeBot();
    }

    // Обрабатываем обновление
    await bot.handleUpdate(update);

    // Обновляем время последнего обновления
    await BotSettingsService.updateLastUpdateTime();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Webhook] Ошибка обработки:", error);

    // Увеличиваем счетчик ошибок
    await BotSettingsService.incrementErrorCount();

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Для проверки здоровья webhook
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "Telegram webhook is running",
  });
}
