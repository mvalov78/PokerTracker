/**
 * API роут для управления polling режимом бота
 */

import { NextRequest, NextResponse } from "next/server";
import { getBotInstance, initializeBot } from "../../../../bot";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, data } = body;

    console.warn(`[Bot Polling API] Команда: ${command}`);

    let bot = getBotInstance();
    if (!bot) {
      bot = await initializeBot();
    }

    switch (command) {
      case "start":
        if (!bot.getStatus().isRunning) {
          await bot.start();
          return new NextResponse(
            JSON.stringify({
              success: true,
              message: "Polling запущен",
              status: bot.getStatus(),
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        } else {
          return new NextResponse(
            JSON.stringify({
              success: true,
              message: "Polling уже запущен",
              status: bot.getStatus(),
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

      case "stop":
        if (bot.getStatus().isRunning) {
          await bot.stop();
          return new NextResponse(
            JSON.stringify({
              success: true,
              message: "Polling остановлен",
              status: bot.getStatus(),
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        } else {
          return new NextResponse(
            JSON.stringify({
              success: true,
              message: "Polling уже остановлен",
              status: bot.getStatus(),
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

      case "restart":
        await bot.stop();
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Пауза 1 сек
        await bot.start();
        return new NextResponse(
          JSON.stringify({
            success: true,
            message: "Polling перезапущен",
            status: bot.getStatus(),
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );

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
        return new NextResponse(
          JSON.stringify({
            success: true,
            message: `Симуляция команды ${data?.command || "/stats"} выполнена`,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }

      default:
        return new NextResponse(
          JSON.stringify({ error: "Неизвестная команда" }),
          { status: 400, headers: { "content-type": "application/json" } },
        );
    }
  } catch (error) {
    console.error("Ошибка управления polling:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "content-type": "application/json" } },
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

    return new NextResponse(
      JSON.stringify({
        success: true,
        polling: {
          ...status,
          uptime: "N/A", // В реальном приложении можно добавить отслеживание времени работы
          lastUpdate: new Date().toISOString(),
          mode: "development",
        },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  } catch (error) {
    console.error("Ошибка получения статуса polling:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}
