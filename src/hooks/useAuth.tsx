"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClientComponentClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthUser extends User {
  profile?: Profile;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    username?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (
    updates: Partial<Profile>,
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Get user profile with timeout protection
  const fetchProfile = async (userId: string) => {
    try {
      // Add timeout protection for production (increased to 10 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      );
      
      const fetchPromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error("🔴 Error fetching profile:", error);
        // Return a basic profile structure if fetch fails
        return {
          id: userId,
          email: null,
          username: null,
          role: 'player' as const,
          avatar_url: null,
          telegram_id: null,
          preferences: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      return data;
    } catch (error) {
      console.error("🔴 Profile fetch failed:", error);
      // Return a basic profile structure if fetch fails
      return {
        id: userId,
        email: null,
        username: null,
        role: 'player' as const,
        avatar_url: null,
        telegram_id: null,
        preferences: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("🔐 Initializing auth...");
        
        // Add timeout protection for the entire auth initialization (increased to 15 seconds)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth initialization timeout')), 15000)
        );
        
        const authPromise = (async () => {
          // Get current user (secure method)
          const {
            data: { user },
            error
          } = await supabase.auth.getUser();

          console.log("🔐 User status:", user ? 'Authenticated' : 'None');
          if (error) {
            console.log("🔐 Auth error:", error.message);
          }

          if (user) {
            console.log("🔐 Fetching user profile...");
            const userProfile = await fetchProfile(user.id);
            setUser({ ...user, profile: userProfile });
            setProfile(userProfile);
            console.log("🔐 Profile loaded:", userProfile?.role || 'fallback');
          }
        })();

        await Promise.race([authPromise, timeoutPromise]);
        console.log("✅ Auth initialization completed");
      } catch (error) {
        console.error("🔴 Error initializing auth:", error);
        // Continue without auth if initialization fails
      } finally {
        setIsLoading(false);
        console.log("🔐 Auth loading state cleared");
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth state change:", event);
      
      if (event === "SIGNED_IN") {
        // Always use getUser() for security, don't trust session data
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (user && !error) {
          console.log("🔐 User signed in, fetching profile...");
          const userProfile = await fetchProfile(user.id);
          setUser({ ...user, profile: userProfile });
          setProfile(userProfile);
        } else {
          console.error("🔐 Error getting user after sign in:", error);
          setUser(null);
          setProfile(null);
        }
      } else if (event === "SIGNED_OUT") {
        console.log("🔐 User signed out");
        setUser(null);
        setProfile(null);
      } else if (event === "TOKEN_REFRESHED") {
        console.log("🔐 Token refreshed, re-fetching user...");
        // Re-fetch user data after token refresh
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (user && !error) {
          const userProfile = await fetchProfile(user.id);
          setUser({ ...user, profile: userProfile });
          setProfile(userProfile);
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting sign in...');
      setIsLoading(true);
      console.log("🔐 Attempting sign in...");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
<<<<<<< HEAD
        console.error("🔐 Sign in error:", error);
        return { success: false, error: error.message };
      }

      console.log("🔐 Sign in successful");
      return { success: true };
    } catch (error) {
      console.error("🔐 Sign in exception:", error);
      const errorMessage = error instanceof Error ? error.message : "Произошла непредвиденная ошибка";
      return { success: false, error: `Ошибка входа: ${errorMessage}` };
    } finally {
=======
        console.error('🔐 Sign in error:', error.message);
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      console.log('🔐 Sign in successful, waiting for auth state update...');
      // Не сбрасываем isLoading здесь - это сделает обработчик onAuthStateChange
      // после успешной загрузки профиля
      return { success: true };
    } catch (error) {
      console.error('🔐 Unexpected sign in error:', error);
>>>>>>> e30c5e0 (fix: Исправлена авторизация на продакшене)
      setIsLoading(false);
      return { success: false, error: "Произошла непредвиденная ошибка" };
    }
  };

  // Sign up with email/password
  const signUp = async (email: string, password: string, username?: string) => {
    try {
      setIsLoading(true);
      console.log("🔐 Attempting sign up...");
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split("@")[0],
          },
        },
      });

      if (error) {
        console.error("🔐 Sign up error:", error);
        return { success: false, error: error.message };
      }

      console.log("🔐 Sign up successful");
      return { success: true };
    } catch (error) {
      console.error("🔐 Sign up exception:", error);
      const errorMessage = error instanceof Error ? error.message : "Произошла непредвиденная ошибка";
      return { success: false, error: `Ошибка регистрации: ${errorMessage}` };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Произошла непредвиденная ошибка" };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { success: false, error: "Пользователь не авторизован" };
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      setProfile(data);
      setUser({ ...user, profile: data });
      return { success: true };
    } catch (error) {
      return { success: false, error: "Произошла непредвиденная ошибка" };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: profile?.role === "admin",
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook для использования аутентификации
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Компонент для защищенных маршрутов
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  fallback,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poker-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Требуется авторизация
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Пожалуйста, войдите в систему для доступа к этой странице
            </p>
            <a
              href="/auth"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-poker-green-600 hover:bg-poker-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-poker-green-500"
            >
              Войти в систему
            </a>
          </div>
        </div>
      )
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Доступ запрещен
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            У вас нет прав для доступа к этой странице
          </p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-poker-green-600 hover:bg-poker-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-poker-green-500"
          >
            На главную
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook для проверки админ прав
export function useAdmin() {
  const { isAdmin, isAuthenticated } = useAuth();
  return isAuthenticated && isAdmin;
}
