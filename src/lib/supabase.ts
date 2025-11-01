import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Check for required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables, using fallback mode");
}

// Client-side Supabase client (for browser usage)
export const createClientComponentClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("🔴 Supabase configuration error:");
    console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅ Set" : "❌ Missing");
    console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✅ Set" : "❌ Missing");
    throw new Error("Supabase credentials missing. Please check environment variables.");
  }
  console.warn("🟢 Supabase client created successfully");
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Backward compatibility exports
export const supabase = (() => {
  try {
    return createClientComponentClient();
  } catch {
    return null;
  }
})();

// Server-side Supabase client (for server components and API routes)
// This should only be used in server components or API routes
export const createServerComponentClient = (cookieStore: any) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase credentials missing");
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};

// Admin client (for server-side operations with service role key)
export const createAdminClient = () => {
  // Detailed diagnostic logging
  console.warn("🔍 [Supabase Admin] Checking credentials:", {
    hasUrl: !!supabaseUrl,
    urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "missing",
    hasServiceKey: !!supabaseServiceKey,
    keyPreview: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : "missing",
    isPlaceholder: supabaseServiceKey === "YOUR_SERVICE_ROLE_KEY_HERE",
    env: process.env.NODE_ENV
  });

  if (
    !supabaseUrl ||
    !supabaseServiceKey ||
    supabaseServiceKey === "YOUR_SERVICE_ROLE_KEY_HERE"
  ) {
    console.error("❌ [Supabase Admin] Admin client not available:", {
      reason: !supabaseUrl ? "Missing SUPABASE_URL" :
              !supabaseServiceKey ? "Missing SUPABASE_SERVICE_ROLE_KEY" :
              "Service key is placeholder value"
    });
    return null;
  }

  console.warn("✅ [Supabase Admin] Creating admin client successfully");
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Backward compatibility export for admin client
export const supabaseAdmin = (() => {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
})();

// Database types (based on our schema)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; // references auth.users(id)
          username: string | null;
          avatar_url: string | null;
          telegram_id: number | null;
          role: "player" | "admin";
          preferences: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string; // references auth.users(id)
          username?: string | null;
          avatar_url?: string | null;
          telegram_id?: number | null;
          role?: "player" | "admin";
          preferences?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string | null;
          avatar_url?: string | null;
          telegram_id?: number | null;
          role?: "player" | "admin";
          preferences?: Record<string, any>;
          updated_at?: string;
        };
      };
      tournaments: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          date: string;
          venue: string | null;
          buyin: number;
          tournament_type:
            | "freezeout"
            | "rebuy"
            | "addon"
            | "bounty"
            | "satellite";
          structure: string | null;
          participants: number | null;
          prize_pool: number | null;
          blind_levels: string | null;
          starting_stack: number | null;
          ticket_image_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          date: string;
          venue?: string | null;
          buyin: number;
          tournament_type?:
            | "freezeout"
            | "rebuy"
            | "addon"
            | "bounty"
            | "satellite";
          structure?: string | null;
          participants?: number | null;
          prize_pool?: number | null;
          blind_levels?: string | null;
          starting_stack?: number | null;
          ticket_image_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          date?: string;
          venue?: string | null;
          buyin?: number;
          tournament_type?:
            | "freezeout"
            | "rebuy"
            | "addon"
            | "bounty"
            | "satellite";
          structure?: string | null;
          participants?: number | null;
          prize_pool?: number | null;
          blind_levels?: string | null;
          starting_stack?: number | null;
          ticket_image_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tournament_results: {
        Row: {
          id: string;
          tournament_id: string;
          position: number;
          payout: number;
          profit: number;
          roi: number;
          notes: string | null;
          knockouts: number | null;
          rebuy_count: number | null;
          addon_count: number | null;
          time_eliminated: string | null;
          final_table_reached: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          position: number;
          payout: number;
          profit: number;
          roi: number;
          notes?: string | null;
          knockouts?: number | null;
          rebuy_count?: number | null;
          addon_count?: number | null;
          time_eliminated?: string | null;
          final_table_reached?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          position?: number;
          payout?: number;
          profit?: number;
          roi?: number;
          notes?: string | null;
          knockouts?: number | null;
          rebuy_count?: number | null;
          addon_count?: number | null;
          time_eliminated?: string | null;
          final_table_reached?: boolean | null;
          created_at?: string;
        };
      };
      tournament_photos: {
        Row: {
          id: string;
          tournament_id: string;
          url: string;
          caption: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          url: string;
          caption?: string | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          url?: string;
          caption?: string | null;
          uploaded_at?: string;
        };
      };
      bankroll_transactions: {
        Row: {
          id: string;
          user_id: string;
          tournament_id: string | null;
          type:
            | "deposit"
            | "withdrawal"
            | "tournament_buyin"
            | "tournament_payout"
            | "transfer";
          amount: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tournament_id?: string | null;
          type:
            | "deposit"
            | "withdrawal"
            | "tournament_buyin"
            | "tournament_payout"
            | "transfer";
          amount: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tournament_id?: string | null;
          type?:
            | "deposit"
            | "withdrawal"
            | "tournament_buyin"
            | "tournament_payout"
            | "transfer";
          amount?: number;
          description?: string | null;
          created_at?: string;
        };
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          telegram_user_id: number;
          session_data: Record<string, any>;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          telegram_user_id: number;
          session_data?: Record<string, any>;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          telegram_user_id?: number;
          session_data?: Record<string, any>;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_user_by_telegram_id: {
        Args: { telegram_user_id: number };
        Returns: { user_uuid: string }[];
      };
      create_user_from_telegram: {
        Args: {
          telegram_user_id: number;
          telegram_username?: string;
        };
        Returns: string;
      };
    };
  };
}

// Helper functions for profile management
export async function getProfile(userId: string) {
  const supabase = createAdminClient();
  if (!supabase) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
}

export async function createProfile(
  userId: string,
  profileData: Database["public"]["Tables"]["profiles"]["Insert"],
) {
  const supabase = createAdminClient();
  if (!supabase) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      role: "player", // Default role
      ...profileData,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProfile(
  userId: string,
  updates: Database["public"]["Tables"]["profiles"]["Update"],
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getProfileByTelegramId(telegramId: number) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("telegram_id", telegramId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const profile = await getProfile(userId);
  return profile?.role === "admin";
}

export async function getUserOrCreate(telegramId: number, username?: string) {
  const adminClient = createAdminClient();
  if (!adminClient) {
    throw new Error("Supabase admin client not configured");
  }

  // Сначала попробуем найти существующего пользователя
  let profile = await getProfileByTelegramId(telegramId);

  if (profile) {
    return profile;
  }

  // Для тестирования - ищем любого существующего пользователя из auth.users
  try {
    const { data: users, error: usersError } =
      await adminClient.auth.admin.listUsers();

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    if (users && users.users.length > 0) {
      // Берем первого пользователя (или ищем по email)
      const existingUser =
        users.users.find((u) => u.email === "mvalov78@gmail.com") ||
        users.users[0];

      // Проверяем есть ли уже профиль для этого пользователя
      const existingProfile = await getProfile(existingUser.id);
      if (existingProfile) {
        return existingProfile;
      }

      // Создаем профиль для существующего пользователя
      const newProfile = {
        telegram_id: telegramId,
        username:
          username || existingUser.email?.split("@")[0] || `user_${telegramId}`,
        role: "player" as const,
      };

      profile = await createProfile(existingUser.id, newProfile);
      return profile;
    } else {
      throw new Error("No users found in auth.users");
    }
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
}
