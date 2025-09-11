/**
 * Оптимизированный API роут для управления polling режимом бота
 * Решает проблемы timeout на Vercel
 */

import { type NextRequest, NextResponse } from "next/server";
import { getBotInstance, initializeBot } from "../../../../bot";

// Максимальное время выполнения для Vercel (25 секунд из 30)
const MAX_EXECUTION_TIME = 25000;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { command, data } = body;

    console.log(`[Bot Polling API Optimized] Команда: ${command}`);

    let bot = getBotInstance();
    if (!bot) {
      bot = await initializeBot();
    }

    switch (command) {
      case "start":
        if (!bot.getStatus().isRunning) {
          // Запускаем бота асинхронно, не ждем полной инициализации
          bot.start().catch(error => {
            console.error("Ошибка запуска бота:", error);
          });
          
          // Возвращаем ответ немедленно
          return NextResponse.json({
            success: true,
            message: "Polling запускается...",
            status: { isRunning: true, mode: "polling" },
            note: "Инициализация может занять несколько секунд"
          });
        } else {
          return NextResponse.json({
            success: true,
            message: "Polling уже запущен",
            status: bot.getStatus(),
          });
        }

      case "stop":
        if (bot.getStatus().isRunning) {
          // Останавливаем асинхронно
          bot.stop().catch(error => {
            console.error("Ошибка остановки бота:", error);
          });
          
          return NextResponse.json({
            success: true,
            message: "Polling останавливается...",
            status: { isRunning: false, mode: "stopped" },
          });
        } else {
          return NextResponse.json({
            success: true,
            message: "Polling уже остановлен",
            status: bot.getStatus(),
          });
        }

      case "status":
        // Быстрая проверка статуса
        return NextResponse.json({
          success: true,
          status: bot.getStatus(),
          uptime: Date.now() - startTime,
          environment: process.env.NODE_ENV || "development"
        });

      case "health":
        // Health check для мониторинга
        return NextResponse.json({
          success: true,
          health: "ok",
          bot: {
            configured: !!process.env.TELEGRAM_BOT_TOKEN,
            status: bot.getStatus()
          },
          api: {
            appUrl: process.env.NEXT_PUBLIC_APP_URL || "not-configured",
            supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          {
            error: "Неизвестная команда. Доступные: start, stop, status, health",
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Ошибка управления polling:", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        executionTime: Date.now() - startTime
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    let bot = getBotInstance();
    if (!bot) {
      bot = await initializeBot();
    }

    const status = bot.getStatus();

    return NextResponse.json({
      success: true,
      polling: {
        ...status,
        lastUpdate: new Date().toISOString(),
        mode: process.env.BOT_MODE || "polling",
        environment: process.env.NODE_ENV || "development",
        apiUrl: process.env.NEXT_PUBLIC_APP_URL || "not-configured"
      },
    });
  } catch (error) {
    console.error("Ошибка получения статуса polling:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Устанавливаем максимальное время выполнения для Vercel
export const maxDuration = 25; // 25 секунд (меньше лимита Vercel)
