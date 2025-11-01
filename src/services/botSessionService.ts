import { supabaseAdmin } from "@/lib/supabase";

export interface BotSessionData {
  userId: string;
  currentAction?: "register_tournament" | "add_result" | "edit_tournament";
  tournamentData?: any;
  ocrData?: any;
  [key: string]: any;
}

export class BotSessionService {
  static async getSession(telegramUserId: number): Promise<BotSessionData> {
    if (!supabaseAdmin) {
      console.warn("Supabase admin client not available");
      return { userId: telegramUserId.toString() };
    }

    try {
      console.warn(
        `🔍 [BotSession] Loading session for user ${telegramUserId}`,
      );

      const { data, error } = await supabaseAdmin
        .from("bot_sessions")
        .select("session_data")
        .eq("user_id", telegramUserId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.warn(
            `📝 [BotSession] Creating new session for user ${telegramUserId}`,
          );
          return await this.createSession(telegramUserId);
        }
        console.error("Error fetching bot session:", error);
        return { userId: telegramUserId.toString() };
      }

      console.warn(
        `✅ [BotSession] Session loaded for user ${telegramUserId}:`,
        data.session_data,
      );
      return {
        userId: telegramUserId.toString(),
        ...data.session_data,
      };
    } catch (error) {
      console.error("Error in getSession:", error);
      return { userId: telegramUserId.toString() };
    }
  }

  static async createSession(telegramUserId: number): Promise<BotSessionData> {
    const sessionData: BotSessionData = {
      userId: telegramUserId.toString(),
      currentAction: undefined,
      tournamentData: undefined,
      ocrData: undefined,
    };

    if (!supabaseAdmin) {
      return sessionData;
    }

    try {
      const { error } = await supabaseAdmin.from("bot_sessions").insert({
        user_id: telegramUserId,
        session_data: sessionData,
      });

      if (error) {
        console.error("Error creating bot session:", error);
      } else {
        console.warn(
          `✅ [BotSession] Created session for user ${telegramUserId}`,
        );
      }

      return sessionData;
    } catch (error) {
      console.error("Error in createSession:", error);
      return sessionData;
    }
  }

  static async updateSession(
    telegramUserId: number,
    sessionData: BotSessionData,
  ): Promise<boolean> {
    if (!supabaseAdmin) {
      console.warn("Supabase admin client not available");
      return false;
    }

    try {
      console.warn(
        `💾 [BotSession] Updating session for user ${telegramUserId}:`,
        sessionData,
      );

      const { error } = await supabaseAdmin.from("bot_sessions").upsert(
        {
          user_id: telegramUserId,
          session_data: sessionData,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          onConflict: "user_id", // Указываем, что при конфликте по user_id делаем UPDATE
          ignoreDuplicates: false, // Не игнорируем дубликаты, а обновляем
        },
      );

      if (error) {
        console.error("Error updating bot session:", error);
        return false;
      }

      console.warn(
        `✅ [BotSession] Session updated for user ${telegramUserId}`,
      );
      return true;
    } catch (error) {
      console.error("Error in updateSession:", error);
      return false;
    }
  }

  static async deleteSession(telegramUserId: number): Promise<boolean> {
    if (!supabaseAdmin) {
      return false;
    }

    try {
      const { error } = await supabaseAdmin
        .from("bot_sessions")
        .delete()
        .eq("user_id", telegramUserId);

      if (error) {
        console.error("Error deleting bot session:", error);
        return false;
      }

      console.warn(`🗑️ [BotSession] Session deleted for user ${telegramUserId}`);
      return true;
    } catch (error) {
      console.error("Error in deleteSession:", error);
      return false;
    }
  }

  static async cleanupExpiredSessions(): Promise<number> {
    if (!supabaseAdmin) {
      return 0;
    }

    try {
      const { data, error } = await supabaseAdmin.rpc(
        "cleanup_expired_bot_sessions",
      );

      if (error) {
        console.error("Error cleaning up expired sessions:", error);
        return 0;
      }

      const cleanedCount = data || 0;
      console.warn(
        `🧹 [BotSession] Cleaned up ${cleanedCount} expired sessions`,
      );
      return cleanedCount;
    } catch (error) {
      console.error("Error in cleanupExpiredSessions:", error);
      return 0;
    }
  }
}
