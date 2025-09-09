import { supabase } from '@/lib/supabase'

export class UserService {
  /**
   * Получить UUID пользователя по Telegram ID
   */
  static async getUserUuidByTelegramId(telegramId: string): Promise<string | null> {
    if (!supabase) {
      console.warn('Supabase client not available')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', parseInt(telegramId))
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Пользователь не найден - создаем нового
          return await this.createUserFromTelegramId(telegramId)
        }
        console.error('Error fetching user by telegram_id:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('Error in getUserUuidByTelegramId:', error)
      return null
    }
  }

  /**
   * Создать нового пользователя по Telegram ID
   */
  static async createUserFromTelegramId(telegramId: string): Promise<string | null> {
    if (!supabase) {
      console.warn('Supabase client not available')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          telegram_id: parseInt(telegramId)
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creating user:', error)
        return null
      }

      console.log('✅ Создан новый пользователь:', data.id, 'для Telegram ID:', telegramId)
      return data.id
    } catch (error) {
      console.error('Error in createUserFromTelegramId:', error)
      return null
    }
  }
}

