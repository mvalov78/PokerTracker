import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { telegramId, linkingCode } = await request.json();

    if (!telegramId || !linkingCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Telegram ID and linking code are required",
        },
        { status: 400 },
      );
    }

    const supabaseAdmin = createAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin client not available",
        },
        { status: 500 },
      );
    }

    // Проверяем код связывания
    const { data: linkingData, error: linkingError } = await supabaseAdmin
      .from("telegram_linking_codes")
      .select("user_id, expires_at, is_used")
      .eq("linking_code", linkingCode.toUpperCase())
      .single();

    if (linkingError || !linkingData) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid linking code",
        },
        { status: 400 },
      );
    }

    // Проверяем срок действия
    if (new Date() > new Date(linkingData.expires_at)) {
      return NextResponse.json(
        {
          success: false,
          error: "Linking code has expired",
        },
        { status: 400 },
      );
    }

    // Проверяем, не использован ли код
    if (linkingData.is_used) {
      return NextResponse.json(
        {
          success: false,
          error: "Linking code has already been used",
        },
        { status: 400 },
      );
    }

    // Проверяем, не привязан ли уже этот Telegram ID к другому аккаунту
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("telegram_id", telegramId)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        {
          success: false,
          error: "This Telegram account is already linked to another user",
        },
        { status: 400 },
      );
    }

    // Связываем аккаунты
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ telegram_id: telegramId })
      .eq("id", linkingData.user_id);

    if (updateError) {
      console.error("Error linking accounts:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to link accounts",
        },
        { status: 500 },
      );
    }

    // Помечаем код как использованный
    await supabaseAdmin
      .from("telegram_linking_codes")
      .update({ is_used: true })
      .eq("linking_code", linkingCode.toUpperCase());

    // Получаем информацию о пользователе для ответа
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("id", linkingData.user_id)
      .single();

    return NextResponse.json({
      success: true,
      user: {
        id: linkingData.user_id,
        username: profile?.username || "Unknown",
      },
    });
  } catch {
    console.error("Error in link API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

