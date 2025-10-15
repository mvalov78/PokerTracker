import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

// Получение настроек бота
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

    const { data, error } = await supabase
      .from("bot_settings")
      .select("*")
      .order("setting_key");

    if (error) {
      console.error("Error fetching bot settings:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch bot settings",
        },
        { status: 500 },
      );
    }

    // Преобразуем в объект для удобства
    const settings: Record<string, any> = {};
    data?.forEach((setting) => {
      settings[setting.setting_key] = {
        value: setting.setting_value,
        description: setting.description,
        updatedAt: setting.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Error in bot settings GET:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

// Обновление настроек бота
export async function POST(request: NextRequest) {
  try {
    const { settingKey, settingValue } = await request.json();

    if (!settingKey || settingValue === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Setting key and value are required",
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

    // Обновляем настройку
    const { data, error } = await supabase
      .from("bot_settings")
      .upsert(
        {
          setting_key: settingKey,
          setting_value: settingValue.toString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "setting_key" },
      )
      .select();

    if (error) {
      console.error("Error updating bot setting:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update bot setting",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Setting ${settingKey} updated successfully`,
      setting: data?.[0],
    });
  } catch (error) {
    console.error("Error in bot settings POST:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

