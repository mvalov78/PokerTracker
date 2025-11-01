/**
 * API роут для работы с конкретным турниром через Supabase
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: tournamentId } = await params;
    const supabase = createAdminClient();

    if (!supabase) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Database unavailable" }),
        { status: 503, headers: { "content-type": "application/json" } },
      );
    }

    const { data, error } = await supabase
      .from("tournaments")
      .select(`
        *,
        tournament_results (*),
        tournament_photos (*)
      `)
      .eq("id", tournamentId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return new NextResponse(
          JSON.stringify({ success: false, error: "Tournament not found" }),
          { status: 404, headers: { "content-type": "application/json" } },
        );
      }
      throw error;
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        tournament: data,
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  } catch (error) {
    console.error("Ошибка получения турнира:", error);
    return new NextResponse(
      JSON.stringify({ success: false, error: "Failed to fetch tournament" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: tournamentId } = await params;
    const body = await request.json();

    console.log(
      "[API PUT] Получен запрос на обновление турнира:",
      tournamentId,
    );
    console.log("[API PUT] Тело запроса:", JSON.stringify(body, null, 2));

    const supabase = createAdminClient();

    if (!supabase) {
      console.error("[API PUT] Admin client недоступен!");
      return new NextResponse(
        JSON.stringify({ success: false, error: "Database unavailable" }),
        { status: 503, headers: { "content-type": "application/json" } },
      );
    }

    console.log("[API PUT] Admin client создан успешно");

    // Если есть результат в теле запроса, обрабатываем его отдельно
    if (body.result) {
      console.log("[API] Обработка результата для турнира:", tournamentId);
      console.log("[API] Данные результата:", body.result);

      const resultData = body.result;

      // Получаем турнир для вычисления profit и ROI
      const { data: tournament, error: fetchError } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", tournamentId)
        .single();

      if (fetchError) {
        console.error("[API] Ошибка получения турнира:", fetchError);
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: "Tournament not found",
            details: fetchError.message,
          }),
          { status: 404, headers: { "content-type": "application/json" } },
        );
      }

      if (!tournament) {
        console.error("[API] Турнир не найден:", tournamentId);
        return new NextResponse(
          JSON.stringify({ success: false, error: "Tournament not found" }),
          { status: 404, headers: { "content-type": "application/json" } },
        );
      }

      console.log("[API] Турнир найден:", {
        id: tournament.id,
        buyin: tournament.buyin,
      });

      const profit = resultData.payout - tournament.buyin;
      const roi = tournament.buyin > 0 ? (profit / tournament.buyin) * 100 : 0;

      const finalResultData = {
        tournament_id: tournamentId,
        position: parseInt(resultData.position),
        payout: parseFloat(resultData.payout),
        profit: profit,
        roi: parseFloat(roi.toFixed(2)),
        notes: resultData.notes || null,
        knockouts: resultData.knockouts ? parseInt(resultData.knockouts) : 0,
        rebuy_count: resultData.rebuyCount
          ? parseInt(resultData.rebuyCount)
          : 0,
        addon_count: resultData.addonCount
          ? parseInt(resultData.addonCount)
          : 0,
        time_eliminated: resultData.timeEliminated || null,
        final_table_reached: resultData.finalTableReached || false,
      };

      console.log("[API] Подготовлены данные для сохранения:", finalResultData);

      // Добавляем или обновляем результат (UPSERT)
      const { data: upsertedResult, error: resultError } = await supabase
        .from("tournament_results")
        .upsert(finalResultData, {
          onConflict: "tournament_id",
        })
        .select();

      if (resultError) {
        console.error("[API] Ошибка добавления результата:", resultError);
        console.error(
          "[API] Детали ошибки:",
          JSON.stringify(resultError, null, 2),
        );
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: "Failed to save result",
            details: resultError.message,
          }),
          { status: 500, headers: { "content-type": "application/json" } },
        );
      }

      console.log("[API] Результат успешно сохранен:", upsertedResult);
    }

    // Обновляем основные данные турнира (исключаем result из body)
    const { result, ...tournamentUpdates } = body;

    if (Object.keys(tournamentUpdates).length > 0) {
      // Преобразуем данные для обновления
      const updateData: any = {};

      if (tournamentUpdates.name !== undefined) {
        updateData.name = tournamentUpdates.name;
      }
      if (tournamentUpdates.date !== undefined) {
        updateData.date = tournamentUpdates.date;
      }
      if (tournamentUpdates.venue !== undefined) {
        updateData.venue = tournamentUpdates.venue;
      }
      if (tournamentUpdates.buyin !== undefined) {
        updateData.buyin = parseFloat(tournamentUpdates.buyin);
      }
      if (tournamentUpdates.tournamentType !== undefined) {
        updateData.tournament_type = tournamentUpdates.tournamentType;
      }
      if (tournamentUpdates.structure !== undefined) {
        updateData.structure = tournamentUpdates.structure;
      }
      if (tournamentUpdates.participants !== undefined) {
        updateData.participants = tournamentUpdates.participants
          ? parseInt(tournamentUpdates.participants)
          : null;
      }
      if (tournamentUpdates.prizePool !== undefined) {
        updateData.prize_pool = tournamentUpdates.prizePool
          ? parseFloat(tournamentUpdates.prizePool)
          : null;
      }
      if (tournamentUpdates.blindLevels !== undefined) {
        updateData.blind_levels = tournamentUpdates.blindLevels;
      }
      if (tournamentUpdates.startingStack !== undefined) {
        updateData.starting_stack = tournamentUpdates.startingStack
          ? parseInt(tournamentUpdates.startingStack)
          : null;
      }
      if (tournamentUpdates.ticketImageUrl !== undefined) {
        updateData.ticket_image_url = tournamentUpdates.ticketImageUrl;
      }
      if (tournamentUpdates.notes !== undefined) {
        updateData.notes = tournamentUpdates.notes;
      }

      const { error: updateError } = await supabase
        .from("tournaments")
        .update(updateData)
        .eq("id", tournamentId);

      if (updateError) {
        console.error("Ошибка обновления турнира:", updateError);
        throw updateError;
      }
    }

    // Возвращаем обновленный турнир
    console.log("[API] Получение обновленного турнира с результатами...");

    const { data: updatedTournament, error: finalError } = await supabase
      .from("tournaments")
      .select(`
        *,
        tournament_results (*),
        tournament_photos (*)
      `)
      .eq("id", tournamentId)
      .single();

    if (finalError) {
      console.error("[API] Ошибка получения обновленного турнира:", finalError);
      throw finalError;
    }

    console.log("[API] Обновленный турнир получен:", {
      id: updatedTournament?.id,
      name: updatedTournament?.name,
      has_result: !!updatedTournament?.tournament_results,
      result_count: Array.isArray(updatedTournament?.tournament_results)
        ? updatedTournament.tournament_results.length
        : updatedTournament?.tournament_results
          ? 1
          : 0,
    });

    console.log("[API PUT] Возвращаем успешный ответ");

    return new NextResponse(
      JSON.stringify({
        success: true,
        tournament: updatedTournament,
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  } catch (error) {
    console.error("Ошибка обновления турнира:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update tournament",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: tournamentId } = await params;

    const success = await TournamentService.deleteTournament(tournamentId);

    if (!success) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Tournament not found" }),
        { status: 404, headers: { "content-type": "application/json" } },
      );
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: "Tournament deleted successfully",
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  } catch (error) {
    console.error("Ошибка удаления турнира:", error);
    return new NextResponse(
      JSON.stringify({ success: false, error: "Failed to delete tournament" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}
