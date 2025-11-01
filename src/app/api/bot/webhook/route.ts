/**
 * API роут для управления Telegram ботом в polling режиме
 */

import { NextRequest, NextResponse } from "next/server";
import { getBotInstance, initializeBot } from "../../../../bot";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    console.warn(`[Bot API] Получен запрос: ${action}`);

    let bot = getBotInstance();
    if (!bot) {
      bot = await initializeBot();
    }

    switch (action) {
      case "process_update":
        // Обработка внешнего обновления (для тестирования)
        await bot.handleUpdate(data);
        return NextResponse.json({
          success: true,
          message: "Update processed",
        });

      case "start":
        await bot.start();
        return NextResponse.json({ success: true, message: "Bot started" });

      case "stop":
        await bot.stop();
        return NextResponse.json({ success: true, message: "Bot stopped" });

      case "status": {
        const status = bot.getStatus();
        return NextResponse.json({ success: true, status });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch {
    console.error("Ошибка обработки запроса к боту:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  // Эндпоинт для проверки статуса бота
  try {
    let bot = getBotInstance();
    if (!bot) {
      bot = await initializeBot();
    }

    const status = bot.getStatus();

    return NextResponse.json({
      ...status,
      message: `Bot is ${status.status} in ${status.mode} mode`,
      timestamp: new Date().toISOString(),
    });
  } catch {
    console.error("Ошибка проверки статуса бота:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
