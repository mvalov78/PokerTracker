import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getBotInstance } from "../../../../bot";

// Переключение режима бота
export async function POST(request: NextRequest) {
  try {
    const { mode, webhookUrl } = await request.json();

    if (!mode || !["polling", "webhook"].includes(mode)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mode must be either "polling" or "webhook"',
        },
        { status: 400 },
      );
    }

    if (mode === "webhook" && !webhookUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Webhook URL is required for webhook mode",
        },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin client not available",
        },
        { status: 500 },
      );
    }

    // Получаем текущие настройки
    const { data: currentSettings } = await supabase
      .from("bot_settings")
      .select("*");

    const settings: Record<string, string> = {};
    currentSettings?.forEach((setting) => {
      settings[setting.setting_key] = setting.setting_value;
    });

    const bot = getBotInstance();

    try {
      // Останавливаем текущий режим
      if (bot && settings.bot_status === "active") {
        console.log("🛑 Остановка текущего режима бота...");
        await bot.stop();

        // Обновляем статус
        await supabase.from("bot_settings").upsert(
          {
            setting_key: "bot_status",
            setting_value: "inactive",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "setting_key" },
        );
      }

      if (mode === "webhook") {
        // Настраиваем webhook режим
        console.log("🔗 Настройка webhook режима...");

        // Устанавливаем webhook в Telegram
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
          throw new Error("TELEGRAM_BOT_TOKEN not found");
        }

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

        // Обновляем настройки в БД
        const updates = [
          { setting_key: "bot_mode", setting_value: "webhook" },
          { setting_key: "webhook_url", setting_value: webhookUrl },
          { setting_key: "polling_enabled", setting_value: "false" },
          { setting_key: "webhook_enabled", setting_value: "true" },
          { setting_key: "bot_status", setting_value: "active" },
        ];

        for (const update of updates) {
          await supabase.from("bot_settings").upsert(
            {
              ...update,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "setting_key" },
          );
        }

        return NextResponse.json({
          success: true,
          message: "Webhook режим активирован",
          mode: "webhook",
          webhookUrl: webhookUrl,
          webhookInfo: webhookResult.result,
        });
      } else {
        // Настраиваем polling режим
        console.log("🔄 Настройка polling режима...");

        // Удаляем webhook из Telegram
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
            method: "POST",
          });
        }

        // Обновляем настройки в БД
        const updates = [
          { setting_key: "bot_mode", setting_value: "polling" },
          { setting_key: "webhook_url", setting_value: "" },
          { setting_key: "polling_enabled", setting_value: "true" },
          { setting_key: "webhook_enabled", setting_value: "false" },
          { setting_key: "bot_status", setting_value: "active" },
        ];

        for (const update of updates) {
          await supabase.from("bot_settings").upsert(
            {
              ...update,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "setting_key" },
          );
        }

        // Запускаем polling если бот доступен
        if (bot) {
          console.log("🚀 Запуск polling режима...");
          await bot.start();
        }

        return NextResponse.json({
          success: true,
          message: "Polling режим активирован",
          mode: "polling",
        });
      }
    } catch (botError) {
      console.error("Error switching bot mode:", botError);

      // Обновляем статус ошибки
      await supabase.from("bot_settings").upsert(
        {
          setting_key: "bot_status",
          setting_value: "error",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "setting_key" },
      );

      return NextResponse.json(
        {
          success: false,
          error: `Failed to switch to ${mode} mode: ${botError instanceof Error ? botError.message : "Unknown error"}`,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in bot mode switch:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

// Получение информации о текущем режиме
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin client not available",
        },
        { status: 500 },
      );
    }

    // Получаем настройки бота
    const { data: settings } = await supabase.from("bot_settings").select("*");

    const botSettings: Record<string, string> = {};
    settings?.forEach((setting) => {
      botSettings[setting.setting_key] = setting.setting_value;
    });

    // Получаем информацию о webhook из Telegram
    let webhookInfo = null;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (botToken) {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${botToken}/getWebhookInfo`,
        );
        const result = await response.json();

        if (result.ok) {
          webhookInfo = result.result;
        }
      } catch (webhookError) {
        console.error("Error getting webhook info:", webhookError);
      }
    }

    // Получаем статус бота
    const bot = getBotInstance();
    const botInstanceStatus = bot?.getStatus() || {
      status: "inactive",
      mode: "unknown",
      isRunning: false,
    };

    return NextResponse.json({
      success: true,
      currentMode: botSettings.bot_mode || "polling",
      botStatus: botSettings.bot_status || "inactive",
      settings: botSettings,
      webhookInfo,
      botInstanceStatus,
      lastUpdate: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in bot mode GET:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

