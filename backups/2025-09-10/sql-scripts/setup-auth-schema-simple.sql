-- PokerTracker Authentication & Authorization Schema (Simple & Safe Version)
-- This script handles all type issues with explicit casting and safe operations

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, let's check what we're working with
DO $$
DECLARE
  tournaments_exists BOOLEAN;
  user_id_type TEXT;
  auth_id_type TEXT;
BEGIN
  -- Check if tournaments table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'tournaments' AND table_schema = 'public'
  ) INTO tournaments_exists;
  
  IF tournaments_exists THEN
    -- Get data types
    SELECT data_type INTO user_id_type
    FROM information_schema.columns 
    WHERE table_name = 'tournaments' AND table_schema = 'public' AND column_name = 'user_id';
    
    SELECT data_type INTO auth_id_type
    FROM information_schema.columns 
    WHERE table_name = 'users' AND table_schema = 'auth' AND column_name = 'id';
    
    RAISE NOTICE 'Found tournaments table with user_id type: %', user_id_type;
    RAISE NOTICE 'auth.users.id type: %', auth_id_type;
  ELSE
    RAISE NOTICE 'No tournaments table found - this is a fresh setup';
  END IF;
END;
$$;

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  avatar_url TEXT,
  telegram_id BIGINT UNIQUE,
  role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  notifications JSONB DEFAULT '{"telegram": true, "email": false}',
  privacy JSONB DEFAULT '{"profile_public": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safe cleanup and fix tournaments table
DO $$
DECLARE
  tournaments_exists BOOLEAN;
  user_id_type TEXT;
BEGIN
  -- Check if tournaments table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'tournaments' AND table_schema = 'public'
  ) INTO tournaments_exists;
  
  IF tournaments_exists THEN
    -- Get user_id type
    SELECT data_type INTO user_id_type
    FROM information_schema.columns 
    WHERE table_name = 'tournaments' AND table_schema = 'public' AND column_name = 'user_id';
    
    -- Drop foreign key constraint first
    EXECUTE 'ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_user_id_fkey';
    
    -- Clean up based on type
    IF user_id_type = 'text' THEN
      RAISE NOTICE 'Cleaning up text-type user_id field...';
      
      -- Remove invalid UUIDs and orphaned records
      DELETE FROM public.tournament_results 
      WHERE tournament_id IN (
        SELECT id FROM public.tournaments 
        WHERE user_id IS NULL 
           OR user_id = '' 
           OR user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           OR NOT EXISTS (
             SELECT 1 FROM auth.users 
             WHERE id::text = tournaments.user_id
           )
      );
      
      DELETE FROM public.tournaments 
      WHERE user_id IS NULL 
         OR user_id = '' 
         OR user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
         OR NOT EXISTS (
           SELECT 1 FROM auth.users 
           WHERE id::text = user_id
         );
      
      -- Convert to UUID type
      EXECUTE 'ALTER TABLE public.tournaments ALTER COLUMN user_id TYPE UUID USING user_id::uuid';
      
    ELSIF user_id_type = 'uuid' THEN
      RAISE NOTICE 'Cleaning up uuid-type user_id field...';
      
      -- Remove orphaned records
      DELETE FROM public.tournament_results 
      WHERE tournament_id IN (
        SELECT t.id FROM public.tournaments t 
        WHERE NOT EXISTS (
          SELECT 1 FROM auth.users u 
          WHERE u.id = t.user_id
        )
      );
      
      DELETE FROM public.tournaments 
      WHERE NOT EXISTS (
        SELECT 1 FROM auth.users u 
        WHERE u.id = user_id
      );
    END IF;
    
    -- Create foreign key constraint
    EXECUTE 'ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE';
    
    RAISE NOTICE 'Tournaments table cleaned and foreign key created';
  END IF;
END;
$$;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tournaments if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournaments' AND table_schema = 'public') THEN
    ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
  END IF;
END;
$$;

-- Enable RLS on tournament_results if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournament_results' AND table_schema = 'public') THEN
    ALTER TABLE public.tournament_results ENABLE ROW LEVEL SECURITY;
  END IF;
END;
$$;

-- Enable RLS on tournament_photos if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournament_photos' AND table_schema = 'public') THEN
    ALTER TABLE public.tournament_photos ENABLE ROW LEVEL SECURITY;
  END IF;
END;
$$;

-- Drop all existing policies first
DO $$
BEGIN
  -- Profiles policies
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
  
  -- User settings policies
  DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
  DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
  DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
  
  -- Tournament policies (if table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournaments' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Users can view own tournaments" ON public.tournaments;
    DROP POLICY IF EXISTS "Users can insert own tournaments" ON public.tournaments;
    DROP POLICY IF EXISTS "Users can update own tournaments" ON public.tournaments;
    DROP POLICY IF EXISTS "Users can delete own tournaments" ON public.tournaments;
    DROP POLICY IF EXISTS "Admins can view all tournaments" ON public.tournaments;
  END IF;
  
  -- Tournament results policies (if table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournament_results' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Users can view own results" ON public.tournament_results;
    DROP POLICY IF EXISTS "Users can insert own results" ON public.tournament_results;
    DROP POLICY IF EXISTS "Users can update own results" ON public.tournament_results;
    DROP POLICY IF EXISTS "Users can delete own results" ON public.tournament_results;
  END IF;
  
  -- Tournament photos policies (if table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournament_photos' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Users can view own photos" ON public.tournament_photos;
    DROP POLICY IF EXISTS "Users can insert own photos" ON public.tournament_photos;
    DROP POLICY IF EXISTS "Users can update own photos" ON public.tournament_photos;
    DROP POLICY IF EXISTS "Users can delete own photos" ON public.tournament_photos;
  END IF;
END;
$$;

-- Create RLS policies with explicit type casting

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- User settings policies
CREATE POLICY "Users can view own settings" ON public.user_settings 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tournament policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournaments' AND table_schema = 'public') THEN
    -- Create policies for tournaments
    EXECUTE 'CREATE POLICY "Users can view own tournaments" ON public.tournaments FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can insert own tournaments" ON public.tournaments FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can update own tournaments" ON public.tournaments FOR UPDATE USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can delete own tournaments" ON public.tournaments FOR DELETE USING (auth.uid() = user_id)';
    
    -- Admin can view all tournaments
    EXECUTE 'CREATE POLICY "Admins can view all tournaments" ON public.tournaments FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() AND p.role = ''admin''
      )
    )';
  END IF;
END;
$$;

-- Tournament results policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournament_results' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Users can view own results" ON public.tournament_results FOR SELECT USING (
      auth.uid() = (SELECT user_id FROM public.tournaments WHERE id = tournament_id)
    )';
    
    EXECUTE 'CREATE POLICY "Users can insert own results" ON public.tournament_results FOR INSERT WITH CHECK (
      auth.uid() = (SELECT user_id FROM public.tournaments WHERE id = tournament_id)
    )';
    
    EXECUTE 'CREATE POLICY "Users can update own results" ON public.tournament_results FOR UPDATE USING (
      auth.uid() = (SELECT user_id FROM public.tournaments WHERE id = tournament_id)
    )';
    
    EXECUTE 'CREATE POLICY "Users can delete own results" ON public.tournament_results FOR DELETE USING (
      auth.uid() = (SELECT user_id FROM public.tournaments WHERE id = tournament_id)
    )';
  END IF;
END;
$$;

-- Tournament photos policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournament_photos' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Users can view own photos" ON public.tournament_photos FOR SELECT USING (
      auth.uid() = (SELECT user_id FROM public.tournaments WHERE id = tournament_id)
    )';
    
    EXECUTE 'CREATE POLICY "Users can insert own photos" ON public.tournament_photos FOR INSERT WITH CHECK (
      auth.uid() = (SELECT user_id FROM public.tournaments WHERE id = tournament_id)
    )';
    
    EXECUTE 'CREATE POLICY "Users can update own photos" ON public.tournament_photos FOR UPDATE USING (
      auth.uid() = (SELECT user_id FROM public.tournaments WHERE id = tournament_id)
    )';
    
    EXECUTE 'CREATE POLICY "Users can delete own photos" ON public.tournament_photos FOR DELETE USING (
      auth.uid() = (SELECT user_id FROM public.tournaments WHERE id = tournament_id)
    )';
  END IF;
END;
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to create admin user
CREATE OR REPLACE FUNCTION public.create_admin_user(admin_email TEXT)
RETURNS VOID AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', admin_email;
  END IF;
  
  UPDATE public.profiles 
  SET role = 'admin', updated_at = NOW()
  WHERE id = admin_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile for user % not found', admin_email;
  END IF;
  
  RAISE NOTICE 'User % has been granted admin privileges', admin_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON public.profiles(telegram_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Create indexes on tournaments if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournaments' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_tournaments_user_id ON public.tournaments(user_id);
    CREATE INDEX IF NOT EXISTS idx_tournaments_date ON public.tournaments(date);
  END IF;
END;
$$;

-- Create indexes on tournament_results if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournament_results' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament_id ON public.tournament_results(tournament_id);
  END IF;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_settings TO authenticated;

-- Grant permissions conditionally
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournaments' AND table_schema = 'public') THEN
    GRANT ALL ON public.tournaments TO authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournament_results' AND table_schema = 'public') THEN
    GRANT ALL ON public.tournament_results TO authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournament_photos' AND table_schema = 'public') THEN
    GRANT ALL ON public.tournament_photos TO authenticated;
  END IF;
END;
$$;

-- Allow anon users to read profiles (for public features)
GRANT SELECT ON public.profiles TO anon;

-- Add comments
COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users with additional data and role-based access';
COMMENT ON TABLE public.user_settings IS 'User-specific application settings and preferences';
COMMENT ON COLUMN public.profiles.role IS 'User role: player (default) or admin';
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates profile and settings when user registers';
COMMENT ON FUNCTION public.create_admin_user(TEXT) IS 'Promotes a user to admin role by email';

-- Final status report
DO $$
DECLARE
  total_tournaments INTEGER := 0;
  tournaments_exists BOOLEAN;
  user_id_type TEXT;
  auth_id_type TEXT;
BEGIN
  -- Check if tournaments table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'tournaments' AND table_schema = 'public'
  ) INTO tournaments_exists;
  
  IF tournaments_exists THEN
    SELECT COUNT(*) INTO total_tournaments FROM public.tournaments;
    
    SELECT data_type INTO user_id_type
    FROM information_schema.columns 
    WHERE table_name = 'tournaments' AND table_schema = 'public' AND column_name = 'user_id';
  END IF;
  
  SELECT data_type INTO auth_id_type
  FROM information_schema.columns 
  WHERE table_name = 'users' AND table_schema = 'auth' AND column_name = 'id';
  
  RAISE NOTICE '';
  RAISE NOTICE '=== AUTHENTICATION SETUP COMPLETE ===';
  
  IF tournaments_exists THEN
    RAISE NOTICE 'Total tournaments: %', total_tournaments;
    RAISE NOTICE 'tournaments.user_id type: %', user_id_type;
    RAISE NOTICE 'auth.users.id type: %', auth_id_type;
    
    IF user_id_type = auth_id_type THEN
      RAISE NOTICE '✅ Data types match! Foreign key constraint is active.';
    ELSE
      RAISE NOTICE '⚠️  Data types still don''t match. This may cause issues.';
    END IF;
  ELSE
    RAISE NOTICE 'No tournaments table found - fresh setup completed.';
    RAISE NOTICE 'auth.users.id type: %', auth_id_type;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Created: profiles table with RLS';
  RAISE NOTICE '✅ Created: user_settings table with RLS';
  RAISE NOTICE '✅ Created: automatic profile creation trigger';
  RAISE NOTICE '✅ Created: admin promotion function';
  
  IF tournaments_exists THEN
    RAISE NOTICE '✅ Updated: tournaments table with proper foreign keys and RLS';
    RAISE NOTICE '✅ Updated: tournament_results table with RLS';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Set up your .env.local file with Supabase credentials';
  RAISE NOTICE '2. Configure Google OAuth in Supabase dashboard';
  RAISE NOTICE '3. Start your Next.js app and register your first user';
  RAISE NOTICE '4. Promote first user to admin: SELECT public.create_admin_user(''your-email@example.com'');';
  RAISE NOTICE '5. Test authentication and authorization features';
END;
$$;
