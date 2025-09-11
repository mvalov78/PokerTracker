/**
 * Оптимизированный webhook endpoint для Telegram бота на продакшене
 */

import { type NextRequest, NextResponse } from "next/server";
import { getBotInstance, initializeBot } from "../../../../bot";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const update = await request.json();
    console.log("📨 [Webhook] Получено обновление:", update.update_id);

    let bot = getBotInstance();
    if (!bot) {
      console.log("🤖 [Webhook] Инициализируем бота...");
      bot = await initializeBot();
    }

    // Обрабатываем обновление асинхронно
    bot.handleUpdate(update).catch(error => {
      console.error("❌ [Webhook] Ошибка обработки обновления:", error);
    });

    // Возвращаем ответ немедленно (Telegram требует быстрый ответ)
    return NextResponse.json({ 
      success: true,
      processed: true,
      updateId: update.update_id,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error("❌ [Webhook] Критическая ошибка:", error);
    
    // Всегда возвращаем 200 для Telegram, чтобы не было повторных отправок
    return NextResponse.json({ 
      success: false,
      error: "Internal processing error",
      processingTime: Date.now() - startTime
    });
  }
}

// Максимальное время выполнения для Vercel
export const maxDuration = 10; // 10 секунд для webhook
