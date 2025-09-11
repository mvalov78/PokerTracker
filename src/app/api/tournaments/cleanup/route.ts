/**
 * API роут для очистки сиротских данных турниров
 */

import { NextResponse } from "next/server";
import { TournamentService } from "@/services/tournamentService";

export async function POST() {
  try {
    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase not configured",
        },
        { status: 400 },
      );
    }

    const results = await TournamentService.cleanupOrphanedData();

    return NextResponse.json({
      success: true,
      message: "Cleanup completed",
      results: {
        orphanedResults: results.orphanedResults,
        orphanedPhotos: results.orphanedPhotos,
        orphanedTransactions: results.orphanedTransactions,
        totalCleaned:
          results.orphanedResults +
          results.orphanedPhotos +
          results.orphanedTransactions,
      },
    });
  } catch (error) {
    console.error("Ошибка при очистке данных:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cleanup orphaned data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
