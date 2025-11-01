import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * GET /api/admin/env-settings
 * Получение настроек бота из переменных окружения
 */
export async function GET(request: NextRequest) {
  try {
    // Проверяем права администратора
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
        },
      },
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Требуется авторизация" },
        { status: 401 },
      );
    }

    // Проверяем роль администратора
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Требуются права администратора" },
        { status: 403 },
      );
    }

    // Читаем настройки из переменных окружения
    const envSettings = {
      bot_mode: process.env.BOT_MODE || "polling",
      webhook_url: process.env.BOT_WEBHOOK_URL || "",
      auto_restart: process.env.BOT_AUTO_RESTART === "true",
      bot_token: process.env.TELEGRAM_BOT_TOKEN
        ? "***настроен***"
        : "не настроен",
      app_url: process.env.NEXT_PUBLIC_APP_URL || "не настроен",
    };

    // Также пытаемся получить статус из БД (если доступна)
    let dbStatus = null;
    try {
      const { data: botSettings } = await supabase
        .from("bot_settings")
        .select("*")
        .single();

      if (botSettings) {
        dbStatus = {
          bot_status: botSettings.bot_status,
          error_count: parseInt(botSettings.error_count || "0"),
          last_update_time: botSettings.last_update_time,
        };
      }
    } catch {
      console.warn("БД недоступна для получения статуса");
    }

    return NextResponse.json({
      success: true,
      envSettings,
      dbStatus,
      source: "environment_variables",
      message: "Настройки загружены из переменных окружения",
    });
  } catch {
    console.error("Ошибка получения настроек из .env:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Ошибка получения настроек",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/env-settings
 * Информационный endpoint - настройки читаются только из .env
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Настройки бота теперь управляются через переменные окружения (.env.local)",
      instructions: {
        local_development: {
          file: ".env.local",
          settings: {
            BOT_MODE: "polling",
            BOT_WEBHOOK_URL: "",
            BOT_AUTO_RESTART: "true",
          },
        },
        production_vercel: {
          location: "Vercel Dashboard → Settings → Environment Variables",
          settings: {
            BOT_MODE: "webhook",
            BOT_WEBHOOK_URL: "https://your-app.vercel.app/api/bot/webhook",
            BOT_AUTO_RESTART: "true",
          },
        },
      },
    },
    { status: 400 },
  );
}
