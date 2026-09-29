"use client";

import { useState, useEffect } from "react";
import type { Tournament } from "@/types";

// Простой механизм для обновления данных между компонентами
let tournamentsUpdateCallbacks: (() => void)[] = [];

function withTournamentResult(raw: Tournament): Tournament {
  if (raw.result) {
    return raw;
  }

  const nested = raw.tournament_results as
    | (Tournament["result"] & Record<string, unknown>)
    | Array<Tournament["result"] & Record<string, unknown>>
    | undefined;
  const row = Array.isArray(nested) ? nested[0] : nested;
  if (!row) {
    return raw;
  }

  return {
    ...raw,
    result: {
      id: String(row.id ?? raw.id),
      tournamentId: String(row.tournament_id ?? row.tournamentId ?? raw.id),
      position: Number(row.position) || 0,
      payout: Number(row.payout) || 0,
      profit: Number(row.profit) || 0,
      roi: Number(row.roi) || 0,
      notes: (row.notes as string | null) ?? null,
      knockouts: Number(row.knockouts ?? 0),
      rebuyCount: Number(row.rebuy_count ?? row.rebuyCount ?? 0),
      addonCount: Number(row.addon_count ?? row.addonCount ?? 0),
      timeEliminated: (row.time_eliminated ?? row.timeEliminated) as
        | string
        | undefined,
      finalTableReached: Boolean(
        row.final_table_reached ?? row.finalTableReached ?? false,
      ),
      createdAt: String(row.created_at ?? row.createdAt ?? ""),
    },
  };
}

export function notifyTournamentsUpdate() {
  tournamentsUpdateCallbacks.forEach((callback) => callback());
}

export function useTournaments(userId?: string) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTournaments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Формируем URL для API запроса
      const url = userId
        ? `/api/tournaments?userId=${userId}`
        : "/api/tournaments";

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setTournaments((data.tournaments || []).map(withTournamentResult));
      } else {
        throw new Error(data.error || "Не удалось загрузить турниры");
      }
    } catch (err) {
      console.error("Ошибка при загрузке турниров:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Произошла ошибка при загрузке данных",
      );
      setTournaments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshTournaments();

    // Подписываемся на обновления
    tournamentsUpdateCallbacks.push(refreshTournaments);

    // Слушаем события добавления турниров
    const handleTournamentAdded = () => {
      refreshTournaments();
    };

    window.addEventListener("tournamentAdded", handleTournamentAdded);

    return () => {
      // Отписываемся при размонтировании
      tournamentsUpdateCallbacks = tournamentsUpdateCallbacks.filter(
        (callback) => callback !== refreshTournaments,
      );
      window.removeEventListener("tournamentAdded", handleTournamentAdded);
    };
  }, [userId]);

  return {
    tournaments,
    isLoading,
    error,
    refresh: refreshTournaments,
  };
}
