import { createAdminClient } from "@/lib/supabase";

export interface BotSettings {
  bot_mode: "polling" | "webhook";
  bot_status: "active" | "inactive" | "error";
  webhook_url: string;
  polling_enabled: boolean;
  webhook_enabled: boolean;
  auto_restart: boolean;
  error_count: number;
  last_update_time: string;
}

export class BotSettingsService {
  /**
   * Получить все настройки бота
   */
  static async getBotSettings(): Promise<BotSettings | null> {
    try {
      const supabase = createAdminClient();
      if (!supabase) {
        console.warn("Admin client not available");
        return null;
      }

      const { data, error } = await supabase.from("bot_settings").select("*");

      if (error) {
        console.error("Error fetching bot settings:", error);
        return null;
      }

      // Преобразуем в типизированный объект
      const settings: Partial<BotSettings> = {};
      data?.forEach((setting) => {
        const key = setting.setting_key as keyof BotSettings;
        let value: any = setting.setting_value;

        // Преобразуем типы
        if (
          key === "polling_enabled" ||
          key === "webhook_enabled" ||
          key === "auto_restart"
        ) {
          value = value === "true";
        } else if (key === "error_count") {
          value = parseInt(value) || 0;
        }

        settings[key] = value;
      });

      return settings as BotSettings;
    } catch (error) {
      console.error("Error in getBotSettings:", error);
      return null;
    }
  }

  /**
   * Получить конкретную настройку
   */
  static async getSetting(key: keyof BotSettings): Promise<string | null> {
    try {
      const supabase = createAdminClient();
      if (!supabase) {
        console.warn("Admin client not available");
        return null;
      }

      const { data, error } = await supabase
        .from("bot_settings")
        .select("setting_value")
        .eq("setting_key", key)
        .single();

      if (error) {
        console.error(`Error fetching setting ${key}:`, error);
        return null;
      }

      return data?.setting_value || null;
    } catch (error) {
      console.error(`Error in getSetting(${key}):`, error);
      return null;
    }
  }

  /**
   * Обновить настройку
   */
  static async updateSetting(
    key: keyof BotSettings,
    value: string | boolean | number,
  ): Promise<boolean> {
    try {
      const supabase = createAdminClient();
      if (!supabase) {
        console.warn("Admin client not available");
        return false;
      }

      const { error } = await supabase.from("bot_settings").upsert(
        {
          setting_key: key,
          setting_value: value.toString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "setting_key" },
      );

      if (error) {
        console.error(`Error updating setting ${key}:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error in updateSetting(${key}):`, error);
      return false;
    }
  }

  /**
   * Получить режим работы бота
   */
  static async getBotMode(): Promise<"polling" | "webhook" | null> {
    const mode = await BotSettingsService.getSetting("bot_mode");
    return mode as "polling" | "webhook" | null;
  }

  /**
   * Проверить активен ли бот
   */
  static async isBotActive(): Promise<boolean> {
    const status = await BotSettingsService.getSetting("bot_status");
    return status === "active";
  }

  /**
   * Обновить статус бота
   */
  static async updateBotStatus(
    status: "active" | "inactive" | "error",
  ): Promise<boolean> {
    return await BotSettingsService.updateSetting("bot_status", status);
  }

  /**
   * Увеличить счетчик ошибок
   */
  static async incrementErrorCount(): Promise<void> {
    try {
      const currentCount = await BotSettingsService.getSetting("error_count");
      const newCount = (parseInt(currentCount || "0") + 1).toString();
      await BotSettingsService.updateSetting("error_count", newCount);
      await BotSettingsService.updateSetting("last_update_time", new Date().toISOString());
    } catch (error) {
      console.error("Error incrementing error count:", error);
    }
  }

  /**
   * Сбросить счетчик ошибок
   */
  static async resetErrorCount(): Promise<void> {
    await BotSettingsService.updateSetting("error_count", "0");
  }

  /**
   * Обновить время последнего обновления
   */
  static async updateLastUpdateTime(): Promise<void> {
    await BotSettingsService.updateSetting("last_update_time", new Date().toISOString());
  }

  /**
   * Получить URL webhook
   */
  static async getWebhookUrl(): Promise<string | null> {
    return await BotSettingsService.getSetting("webhook_url");
  }

  /**
   * Установить URL webhook
   */
  static async setWebhookUrl(url: string): Promise<boolean> {
    return await BotSettingsService.updateSetting("webhook_url", url);
  }
}
