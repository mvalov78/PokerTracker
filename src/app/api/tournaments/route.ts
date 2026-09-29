/**
 * API роут для управления турнирами с Supabase
 */

import { NextRequest, NextResponse } from "next/server";
import { TournamentService } from "@/services/tournamentService";
import { createAdminClient } from "@/lib/supabase";
import {
  filterOwnedTournaments,
  resolveTournamentActor,
} from "@/lib/tournamentAccess";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = createAdminClient();

    // Проверяем, настроен ли Supabase
    if (!supabase) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "Supabase не настроен. Проверьте переменные окружения",
        }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }

    const actualUserId = await resolveTournamentActor(
      request,
      searchParams.get("userId"),
    );
    if (!actualUserId) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "Требуется авторизация",
        }),
        { status: 401, headers: { "content-type": "application/json" } },
      );
    }

    // Получаем турниры напрямую через admin client
    const { data: tournaments, error } = await supabase
      .from("tournaments")
      .select(`
        *,
        tournament_results (*),
        tournament_photos (*)
      `)
      .eq("user_id", actualUserId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Ошибка получения турниров:", error);
      throw error;
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        tournaments: filterOwnedTournaments(tournaments, actualUserId),
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Ошибка получения турниров из Supabase:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: "Ошибка при получении турниров из базы данных",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error:
            "Supabase не настроен. Проверьте переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY",
        }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }

    const userId = await resolveTournamentActor(request, body.userId);
    if (!userId) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "Требуется авторизация",
        }),
        { status: 401, headers: { "content-type": "application/json" } },
      );
    }

    // Создаем турнир через сервис
    const tournamentData = {
      userId: userId,
      name: body.name || "",
      date: body.date || new Date().toISOString(),
      venue: body.venue || null,
      buyin: parseFloat(body.buyin) || 0,
      tournamentType: body.tournamentType || "freezeout",
      structure: body.structure || null,
      participants: body.participants ? parseInt(body.participants) : null,
      prizePool: body.prizePool ? parseFloat(body.prizePool) : null,
      blindLevels: body.blindLevels || null,
      startingStack: body.startingStack ? parseInt(body.startingStack) : null,
      ticketImageUrl: body.ticketImageUrl || null,
      notes: body.notes || null,
    };

    const newTournament =
      await TournamentService.createTournamentAsAdmin(tournamentData);

    return new NextResponse(
      JSON.stringify({
        success: true,
        tournament: newTournament,
      }),
      {
        status: 201,
        headers: { "content-type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Ошибка создания турнира в Supabase:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: "Ошибка при создании турнира в базе данных",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get("id");
    const supabase = createAdminClient();

    if (!tournamentId) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Tournament ID is required" }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }

    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error:
            "Supabase не настроен. Проверьте переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY",
        }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }

    if (!supabase) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "Supabase не настроен. Проверьте переменные окружения",
        }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }

    const actorId = await resolveTournamentActor(
      request,
      searchParams.get("userId"),
    );
    if (!actorId) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Требуется авторизация" }),
        { status: 401, headers: { "content-type": "application/json" } },
      );
    }

    const { data: existing, error: existingError } = await supabase
      .from("tournaments")
      .select("id, user_id")
      .eq("id", tournamentId)
      .single();

    if (existingError || !existing) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Tournament not found" }),
        { status: 404, headers: { "content-type": "application/json" } },
      );
    }

    if (existing.user_id !== actorId) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Недостаточно прав" }),
        { status: 403, headers: { "content-type": "application/json" } },
      );
    }

    const success = await TournamentService.deleteTournament(tournamentId);

    if (success) {
      return new NextResponse(
        JSON.stringify({
          success: true,
          message: "Tournament deleted successfully",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    } else {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Tournament not found" }),
        { status: 404, headers: { "content-type": "application/json" } },
      );
    }
  } catch (error) {
    console.error("Ошибка удаления турнира из Supabase:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: "Ошибка при удалении турнира из базы данных",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}
