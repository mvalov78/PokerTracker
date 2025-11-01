import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

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

    // Отвязываем Telegram аккаунт
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ telegram_id: null })
      .eq("id", userId);

    if (error) {
      console.error("Error unlinking Telegram:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to unlink Telegram account",
        },
        { status: 500 },
      );
    }

    // Удаляем неиспользованные коды связывания
    await supabaseAdmin
      .from("telegram_linking_codes")
      .delete()
      .eq("user_id", userId);

    return NextResponse.json({
      success: true,
    });
  } catch {
    console.error("Error in unlink API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
