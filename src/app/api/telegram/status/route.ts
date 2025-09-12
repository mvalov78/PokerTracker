import { type NextRequest, NextResponse } from "next/server";
import { createClientComponentClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        },
        { status: 400 },
      );
    }

    const supabase = createClientComponentClient();

    // Проверяем статус связывания Telegram
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("telegram_id")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error checking Telegram status:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to check Telegram status",
        },
        { status: 500 },
      );
    }

    const isLinked = profile && profile.telegram_id !== null;

    return NextResponse.json({
      success: true,
      telegram: isLinked
        ? {
            telegramId: profile.telegram_id?.toString(),
            isLinked: true,
          }
        : null,
    });
  } catch (error) {
    console.error("Error in status API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

