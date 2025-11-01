/**
 * API роут для отправки уведомлений через бота
 */

import { NextRequest, NextResponse } from "next/server";
import { getBotInstance, initializeBot } from "../../../../bot";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, message, type } = body;

    if (!userId || !message) {
      return NextResponse.json(
        { error: "userId and message are required" },
        { status: 400 },
      );
    }

    // Получаем экземпляр бота
    let bot = getBotInstance();
    if (!bot) {
      bot = await initializeBot();
    }

    // Отправляем уведомление через бота
    await bot.sendNotification(userId, message);

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch {
    console.error("Ошибка отправки уведомления:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  // Получение статуса уведомлений
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    // Здесь можно добавить логику получения настроек уведомлений пользователя
    const notificationSettings = {
      userId,
      reminders: true,
      weeklyStats: true,
      achievements: true,
      enabled: true,
    };

    return NextResponse.json({
      settings: notificationSettings,
      timestamp: new Date().toISOString(),
    });
  } catch {
    console.error("Ошибка получения настроек уведомлений:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
