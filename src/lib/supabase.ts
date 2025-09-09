import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Временная заглушка для демонстрации (замените на реальные значения)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase переменные окружения не настроены. Используется fallback к mockData.')
}

// Client-side Supabase client (for authenticated users)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null

// Server-side Supabase client (with service role for bot operations)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Database types (based on our schema)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string | null
          email: string | null
          avatar_url: string | null
          telegram_id: number | null
          preferences: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username?: string | null
          email?: string | null
          avatar_url?: string | null
          telegram_id?: number | null
          preferences?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          email?: string | null
          avatar_url?: string | null
          telegram_id?: number | null
          preferences?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      tournaments: {
        Row: {
          id: string
          user_id: string
          name: string
          date: string
          venue: string | null
          buyin: number
          tournament_type: 'freezeout' | 'rebuy' | 'addon' | 'bounty' | 'satellite'
          structure: string | null
          participants: number | null
          prize_pool: number | null
          blind_levels: string | null
          starting_stack: number | null
          ticket_image_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          date: string
          venue?: string | null
          buyin: number
          tournament_type?: 'freezeout' | 'rebuy' | 'addon' | 'bounty' | 'satellite'
          structure?: string | null
          participants?: number | null
          prize_pool?: number | null
          blind_levels?: string | null
          starting_stack?: number | null
          ticket_image_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          date?: string
          venue?: string | null
          buyin?: number
          tournament_type?: 'freezeout' | 'rebuy' | 'addon' | 'bounty' | 'satellite'
          structure?: string | null
          participants?: number | null
          prize_pool?: number | null
          blind_levels?: string | null
          starting_stack?: number | null
          ticket_image_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tournament_results: {
        Row: {
          id: string
          tournament_id: string
          position: number
          payout: number
          profit: number
          roi: number
          notes: string | null
          knockouts: number | null
          rebuy_count: number | null
          addon_count: number | null
          time_eliminated: string | null
          final_table_reached: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          position: number
          payout: number
          profit: number
          roi: number
          notes?: string | null
          knockouts?: number | null
          rebuy_count?: number | null
          addon_count?: number | null
          time_eliminated?: string | null
          final_table_reached?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          position?: number
          payout?: number
          profit?: number
          roi?: number
          notes?: string | null
          knockouts?: number | null
          rebuy_count?: number | null
          addon_count?: number | null
          time_eliminated?: string | null
          final_table_reached?: boolean | null
          created_at?: string
        }
      }
      tournament_photos: {
        Row: {
          id: string
          tournament_id: string
          url: string
          caption: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          url: string
          caption?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          url?: string
          caption?: string | null
          uploaded_at?: string
        }
      }
      bankroll_transactions: {
        Row: {
          id: string
          user_id: string
          tournament_id: string | null
          type: 'deposit' | 'withdrawal' | 'tournament_buyin' | 'tournament_payout' | 'transfer'
          amount: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tournament_id?: string | null
          type: 'deposit' | 'withdrawal' | 'tournament_buyin' | 'tournament_payout' | 'transfer'
          amount: number
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tournament_id?: string | null
          type?: 'deposit' | 'withdrawal' | 'tournament_buyin' | 'tournament_payout' | 'transfer'
          amount?: number
          description?: string | null
          created_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          telegram_user_id: number
          session_data: Record<string, any>
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          telegram_user_id: number
          session_data?: Record<string, any>
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          telegram_user_id?: number
          session_data?: Record<string, any>
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      get_user_by_telegram_id: {
        Args: { telegram_user_id: number }
        Returns: { user_uuid: string }[]
      }
      create_user_from_telegram: {
        Args: { 
          telegram_user_id: number
          telegram_username?: string 
        }
        Returns: string
      }
    }
  }
}

// Helper functions
export async function getUserByTelegramId(telegramId: number) {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured')
  }
  
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return data
}

export async function createUserFromTelegram(telegramId: number, username?: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured')
  }
  
  const { data, error } = await supabaseAdmin.rpc('create_user_from_telegram', {
    telegram_user_id: telegramId,
    telegram_username: username
  })

  if (error) {
    throw error
  }

  return data
}

export async function getUserOrCreate(telegramId: number, username?: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured')
  }
  
  try {
    let user = await getUserByTelegramId(telegramId)
    
    if (!user) {
      // Пытаемся создать пользователя
      try {
        const userId = await createUserFromTelegram(telegramId, username)
        user = await getUserByTelegramId(telegramId)
      } catch (createError) {
        console.log('⚠️  Не удалось создать пользователя через функцию, пробуем прямую вставку:', createError.message)
        
        // Пробуем создать пользователя напрямую
        const { data: newUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            telegram_id: telegramId,
            username: username || `user_${telegramId}`,
            email: `${telegramId}@telegram.local`
          })
          .select()
          .single()
        
        if (insertError) {
          console.log('⚠️  Прямая вставка тоже не удалась:', insertError.message)
          throw new Error('Cannot create user in Supabase')
        }
        
        user = newUser
      }
    }

    return user
  } catch (error) {
    console.log('⚠️  Ошибка работы с пользователем Supabase:', error.message)
    throw error
  }
}
