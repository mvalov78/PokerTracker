import { createClientComponentClient } from "@/lib/supabase";

export class UserService {
  /**
   * Получить UUID пользователя по Telegram ID
   */
  static async getUserUuidByTelegramId(
    telegramId: string,
  ): Promise<string | null> {
    try {
      const supabase = createClientComponentClient();

      // Ищем в таблице profiles, а не users
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("telegram_id", parseInt(telegramId))
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Пользователь не найден - используем getUserOrCreate из lib/supabase
          console.warn(
            `Profile with Telegram ID ${telegramId} not found, will create via getUserOrCreate`,
          );
          return null; // Пусть бот передаст telegram_id в API, где сработает getUserOrCreate
        }
        console.error("Error fetching profile by telegram_id:", error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error("Error in getUserUuidByTelegramId:", error);
      return null;
    }
  }

  /**
   * Создать нового пользователя по Telegram ID
   */
  static async createUserFromTelegramId(
    telegramId: string,
  ): Promise<any | null> {
    try {
      const supabase = createClientComponentClient();
      
      if (!supabase) {
        console.warn("Supabase client not available");
        return null;
      }

      const { data, error } = await supabase
        .from("users")
        .insert({
          telegram_id: parseInt(telegramId),
        })
        .select("*")
        .single();

      if (error) {
        console.error("Error creating user:", error);
        return null;
      }

      console.warn(
        "✅ Создан новый пользователь:",
        data.id,
        "для Telegram ID:",
        telegramId,
      );
      return data;
    } catch (error) {
      console.error("Error in createUserFromTelegramId:", error);
      return null;
    }
  }
}
