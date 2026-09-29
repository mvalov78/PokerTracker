import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { getUserOrCreate } from "@/lib/supabase";

export function normalizeTelegramId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    if (Number.isSafeInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

export async function getSessionUserId(
  request: NextRequest,
): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies?.get?.(name)?.value;
        },
      },
    });

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }

    return data.user.id;
  } catch (error) {
    console.error("Failed to read tournament session:", error);
    return null;
  }
}

/**
 * Владелец турниров для этого запроса.
 * Сессия сайта важнее query/body: вошедший пользователь не может запросить чужой userId.
 * Без сессии принимается только числовой Telegram ID бота.
 */
export async function resolveTournamentActor(
  request: NextRequest,
  explicitUserId?: unknown,
): Promise<string | null> {
  const sessionUserId = await getSessionUserId(request);
  if (sessionUserId) {
    return sessionUserId;
  }

  const telegramId = normalizeTelegramId(explicitUserId);
  if (telegramId == null) {
    return null;
  }

  const profile = await getUserOrCreate(telegramId);
  return profile?.id ?? null;
}

export function filterOwnedTournaments<T extends { user_id?: string | null }>(
  tournaments: T[] | null | undefined,
  ownerId: string,
): T[] {
  return (tournaments || []).filter((tournament) => tournament.user_id === ownerId);
}
