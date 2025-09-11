/**
 * API роут для управления polling режимом бота
 */

import { type NextRequest, NextResponse } from "next/server";
import { getBotInstance, initializeBot } from "../../../../bot";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, data } = body;

    console.log(`[Bot Polling API] Команда: ${command}`, {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      botToken: process.env.TELEGRAM_BOT_TOKEN ? "SET" : "NOT_SET"
    });

    let bot = getBotInstance();
    if (!bot) {
      console.log("[Bot Polling API] Инициализация бота...");
      
      // Add timeout protection for bot initialization
      const initPromise = initializeBot();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Bot initialization timeout (10s)')), 10000)
      );
      
      try {
        bot = await Promise.race([initPromise, timeoutPromise]);
        console.log("[Bot Polling API] Бот успешно инициализирован");
      } catch (initError) {
        console.error("[Bot Polling API] Ошибка инициализации бота:", initError);
        throw new Error(`Bot initialization failed: ${initError instanceof Error ? initError.message : 'Unknown error'}`);
      }
    }

    switch (command) {
      case "start":
        if (!bot.getStatus().isRunning) {
          await bot.start();
          return NextResponse.json({
            success: true,
            message: "Polling запущен",
            status: bot.getStatus(),
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
          await bot.stop();
          return NextResponse.json({
            success: true,
            message: "Polling остановлен",
            status: bot.getStatus(),
          });
        } else {
          return NextResponse.json({
            success: true,
            message: "Polling уже остановлен",
            status: bot.getStatus(),
          });
        }

      case "restart":
        await bot.stop();
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Пауза 1 сек
        await bot.start();
        return NextResponse.json({
          success: true,
          message: "Polling перезапущен",
          status: bot.getStatus(),
        });

      case "simulate": {
        // Симуляция команды для тестирования
        const mockUpdate = {
          update_id: Date.now(),
          message: {
            message_id: Math.floor(Math.random() * 1000),
            from: {
              id: 123456789,
              first_name: "Test User",
              username: "testuser",
            },
            chat: {
              id: 123456789,
              type: "private",
            },
            date: Math.floor(Date.now() / 1000),
            text: data?.command || "/stats",
          },
        };

        await bot.handleUpdate(mockUpdate);
        return NextResponse.json({
          success: true,
          message: `Симуляция команды ${data?.command || "/stats"} выполнена`,
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Неизвестная команда",
            details: `Команда '${command}' не поддерживается`,
            availableCommands: ["start", "stop", "restart", "simulate"],
            timestamp: new Date().toISOString()
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Ошибка управления polling:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("[Bot Polling API] GET статус запрос", {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      botToken: process.env.TELEGRAM_BOT_TOKEN ? "SET" : "NOT_SET"
    });

    let bot = getBotInstance();
    if (!bot) {
      console.log("[Bot Polling API] GET - Инициализация бота...");
      
      // Add timeout protection for bot initialization
      const initPromise = initializeBot();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Bot initialization timeout (10s)')), 10000)
      );
      
      try {
        bot = await Promise.race([initPromise, timeoutPromise]);
        console.log("[Bot Polling API] GET - Бот успешно инициализирован");
      } catch (initError) {
        console.error("[Bot Polling API] GET - Ошибка инициализации бота:", initError);
        throw new Error(`Bot initialization failed: ${initError instanceof Error ? initError.message : 'Unknown error'}`);
      }
    }

    const status = bot.getStatus();

    return NextResponse.json({
      success: true,
      polling: {
        ...status,
        uptime: "N/A", // В реальном приложении можно добавить отслеживание времени работы
        lastUpdate: new Date().toISOString(),
        mode: "development",
      },
    });
  } catch (error) {
    console.error("Ошибка получения статуса polling:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 },
    );
  }
}
