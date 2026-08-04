/**
 * API endpoint для инициализации бота
 * Автоматически устанавливает webhook из переменной окружения BOT_WEBHOOK_URL
 */

import { type NextRequest, NextResponse } from "next/server";
import { BotSettingsService } from "@/services/botSettingsService";

export async function POST(request: NextRequest) {
  try {
    console.warn("🚀 Инициализация бота...");

    // Читаем переменные окружения
    const botMode = process.env.BOT_MODE || "polling";
    const webhookUrl = process.env.BOT_WEBHOOK_URL || "";
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json(
        {
          success: false,
          error: "TELEGRAM_BOT_TOKEN not found in environment variables",
        },
        { status: 500 },
      );
    }

    console.warn(`🔧 Режим из .env: ${botMode}`);
    console.warn(`🔗 Webhook URL из .env: ${webhookUrl || "не задан"}`);

    // Если режим webhook и URL задан - устанавливаем webhook
    if (botMode === "webhook" && webhookUrl) {
      console.warn("🔗 Устанавливаем webhook из переменной окружения...");

      try {
        // Устанавливаем webhook в Telegram
        const webhookResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/setWebhook`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: webhookUrl,
              allowed_updates: ["message", "callback_query"],
            }),
          },
        );

        const webhookResult = await webhookResponse.json();

        if (!webhookResult.ok) {
          throw new Error(
            `Failed to set webhook: ${webhookResult.description}`,
          );
        }

        console.warn(`✅ Webhook установлен: ${webhookUrl}`);

        // Обновляем настройки в БД
        try {
          await BotSettingsService.updateSetting("bot_mode", "webhook");
          await BotSettingsService.updateSetting("webhook_url", webhookUrl);
          await BotSettingsService.updateSetting("polling_enabled", false);
          await BotSettingsService.updateSetting("webhook_enabled", true);
          await BotSettingsService.updateBotStatus("active");
          await BotSettingsService.updateLastUpdateTime();
          console.warn("📊 Настройки обновлены в БД");
        } catch {
          console.warn("⚠️ БД недоступна, webhook установлен в Telegram");
        }

        // Получаем информацию о webhook для проверки
        const webhookInfoResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/getWebhookInfo`,
        );
        const webhookInfo = await webhookInfoResponse.json();

        return NextResponse.json({
          success: true,
          message: "Бот инициализирован в webhook режиме",
          mode: "webhook",
          webhookUrl: webhookUrl,
          webhookInfo: webhookInfo.result,
        });
      } catch (error) {
        console.error("❌ Ошибка установки webhook:", error);

        // Обновляем статус ошибки
        try {
          await BotSettingsService.updateBotStatus("error");
          await BotSettingsService.incrementErrorCount();
        } catch {
          // Игнорируем ошибку БД
        }

        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            mode: "webhook",
            webhookUrl: webhookUrl,
          },
          { status: 500 },
        );
      }
    } else if (botMode === "polling") {
      console.warn("🔄 Режим polling - webhook не требуется");

      // Удаляем webhook если он был установлен
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
          method: "POST",
        });
        console.warn("✅ Webhook удален (polling режим)");
      } catch {
        console.warn("⚠️ Не удалось удалить webhook (возможно, его не было)");
      }

      // Обновляем настройки в БД
      try {
        await BotSettingsService.updateSetting("bot_mode", "polling");
        await BotSettingsService.updateSetting("webhook_url", "");
        await BotSettingsService.updateSetting("polling_enabled", true);
        await BotSettingsService.updateSetting("webhook_enabled", false);
        await BotSettingsService.updateBotStatus("active");
        console.warn("📊 Настройки обновлены в БД");
      } catch {
        console.warn("⚠️ БД недоступна");
      }

      return NextResponse.json({
        success: true,
        message: "Бот инициализирован в polling режиме",
        mode: "polling",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            "BOT_MODE=webhook но BOT_WEBHOOK_URL не задан. Установите BOT_WEBHOOK_URL в переменных окружения.",
          mode: botMode,
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("❌ Ошибка инициализации бота:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET handler для проверки текущей конфигурации
 */
export async function GET(request: NextRequest) {
  try {
    const botMode = process.env.BOT_MODE || "polling";
    const webhookUrl = process.env.BOT_WEBHOOK_URL || "";
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json(
        {
          success: false,
          error: "TELEGRAM_BOT_TOKEN not found",
        },
        { status: 500 },
      );
    }

    // Получаем текущую информацию о webhook из Telegram
    const webhookInfoResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getWebhookInfo`,
    );
    const webhookInfo = await webhookInfoResponse.json();

    // Получаем настройки из БД
    let dbSettings = null;
    try {
      dbSettings = await BotSettingsService.getBotSettings();
    } catch {
      console.warn("⚠️ БД недоступна");
    }

    return NextResponse.json({
      success: true,
      environment: {
        BOT_MODE: botMode,
        BOT_WEBHOOK_URL: webhookUrl,
        TELEGRAM_BOT_TOKEN: botToken ? "✅ установлен" : "❌ не установлен",
      },
      telegram: {
        webhookInfo: webhookInfo.result,
      },
      database: dbSettings,
      recommendation:
        botMode === "webhook" && !webhookUrl
          ? "⚠️ BOT_MODE=webhook но BOT_WEBHOOK_URL не задан"
          : botMode === "webhook" && webhookInfo.result?.url !== webhookUrl
            ? "⚠️ Webhook URL в Telegram не совпадает с BOT_WEBHOOK_URL. Вызовите POST /api/bot/init для синхронизации"
            : "✅ Конфигурация корректна",
    });
  } catch (error) {
    console.error("❌ Ошибка получения конфигурации:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
