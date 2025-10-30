import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

// Генерируем уникальный код для связывания
function generateLinkingCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
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

    // Сначала удаляем старые коды пользователя
    await supabaseAdmin
      .from("telegram_linking_codes")
      .delete()
      .eq("user_id", userId);

    // Генерируем новый код
    const linkingCode = generateLinkingCode();

    // Сохраняем код в базе данных с временным сроком действия (10 минут)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabaseAdmin
      .from("telegram_linking_codes")
      .insert({
        user_id: userId,
        linking_code: linkingCode,
        expires_at: expiresAt,
        is_used: false,
      });

    if (error) {
      console.error("Error saving linking code:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate linking code",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      code: linkingCode,
      expiresAt,
    });
  } catch {
    console.error("Error in generate-code API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
