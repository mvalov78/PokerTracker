import { supabase } from '@/lib/supabase'

export interface UserSettings {
  id: string
  userId: string
  currentVenue?: string
  createdAt: string
  updatedAt: string
}

export class UserSettingsService {
  /**
   * Получить настройки пользователя
   */
  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    if (!supabase) {
      console.warn('Supabase client not available, returning null settings')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Запись не найдена - создаем новую
          return await this.createUserSettings(userId)
        }
        console.error('Error fetching user settings:', error)
        return null
      }

      return this.mapDbSettingsToType(data)
    } catch (error) {
      console.error('Error in getUserSettings:', error)
      return null
    }
  }

  /**
   * Создать настройки пользователя
   */
  static async createUserSettings(userId: string): Promise<UserSettings | null> {
    if (!supabase) {
      console.warn('Supabase client not available, cannot create settings')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          current_venue: null
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user settings:', error)
        return null
      }

      return this.mapDbSettingsToType(data)
    } catch (error) {
      console.error('Error in createUserSettings:', error)
      return null
    }
  }

  /**
   * Обновить текущую площадку пользователя
   */
  static async updateCurrentVenue(userId: string, venue: string): Promise<UserSettings | null> {
    if (!supabase) {
      console.warn('Supabase client not available, cannot update venue')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          current_venue: venue,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (error) {
        console.error('Error updating venue:', error)
        return null
      }

      return this.mapDbSettingsToType(data)
    } catch (error) {
      console.error('Error in updateCurrentVenue:', error)
      return null
    }
  }

  /**
   * Получить текущую площадку пользователя
   */
  static async getCurrentVenue(userId: string): Promise<string | null> {
    const settings = await this.getUserSettings(userId)
    return settings?.currentVenue || null
  }

  /**
   * Маппинг данных из БД в тип приложения
   */
  private static mapDbSettingsToType(dbSettings: any): UserSettings {
    return {
      id: dbSettings.id,
      userId: dbSettings.user_id,
      currentVenue: dbSettings.current_venue,
      createdAt: dbSettings.created_at,
      updatedAt: dbSettings.updated_at
    }
  }
}
