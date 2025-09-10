-- PokerTracker Authentication & Authorization Schema (Fixed for Type Issues)
-- This script handles type mismatches between user_id fields

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Check and fix user_id type in tournaments table
DO $$
DECLARE
  user_id_type TEXT;
  auth_id_type TEXT;
BEGIN
  -- Get the data type of user_id in tournaments
  SELECT data_type INTO user_id_type
  FROM information_schema.columns 
  WHERE table_name = 'tournaments' 
    AND table_schema = 'public' 
    AND column_name = 'user_id';
  
  -- Get the data type of id in auth.users
  SELECT data_type INTO auth_id_type
  FROM information_schema.columns 
  WHERE table_name = 'users' 
    AND table_schema = 'auth' 
    AND column_name = 'id';
    
  RAISE NOTICE 'tournaments.user_id type: %', user_id_type;
  RAISE NOTICE 'auth.users.id type: %', auth_id_type;
  
  -- If types don't match, we need to fix them
  IF user_id_type != auth_id_type THEN
    RAISE NOTICE 'Type mismatch detected. Fixing...';
    
    -- Drop existing foreign key constraint if it exists
    ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_user_id_fkey;
    
    -- Clean up invalid data first (with type casting)
    IF user_id_type = 'text' AND auth_id_type = 'uuid' THEN
      -- Remove records where user_id is not a valid UUID or doesn't exist
      DELETE FROM public.tournament_results 
      WHERE tournament_id IN (
        SELECT t.id FROM public.tournaments t 
        WHERE t.user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           OR t.user_id::uuid NOT IN (SELECT id FROM auth.users)
      );
      
      DELETE FROM public.tournament_photos 
      WHERE tournament_id IN (
        SELECT t.id FROM public.tournaments t 
        WHERE t.user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           OR t.user_id::uuid NOT IN (SELECT id FROM auth.users)
      );
      
      DELETE FROM public.tournaments 
      WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
         OR user_id::uuid NOT IN (SELECT id FROM auth.users);
      
      -- Convert user_id column to UUID type
      ALTER TABLE public.tournaments ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
      
    ELSIF user_id_type = 'uuid' AND auth_id_type = 'text' THEN
      -- This shouldn't happen in normal Supabase setup, but handle it
      RAISE NOTICE 'Unusual case: auth.users.id is text while tournaments.user_id is uuid';
      
      DELETE FROM public.tournament_results 
      WHERE tournament_id IN (
        SELECT t.id FROM public.tournaments t 
        LEFT JOIN auth.users u ON t.user_id::text = u.id 
        WHERE u.id IS NULL
      );
      
      DELETE FROM public.tournament_photos 
      WHERE tournament_id IN (
        SELECT t.id FROM public.tournaments t 
        LEFT JOIN auth.users u ON t.user_id::text = u.id 
        WHERE u.id IS NULL
      );
      
      DELETE FROM public.tournaments 
      WHERE user_id::text NOT IN (SELECT id FROM auth.users);
      
    ELSE
      -- Handle other type mismatches
      RAISE NOTICE 'Unhandled type combination: % -> %', user_id_type, auth_id_type;
      
      -- Generic cleanup - remove records that don't have matching users
      DELETE FROM public.tournament_results 
      WHERE tournament_id IN (
        SELECT t.id FROM public.tournaments t 
        WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = t.user_id::text)
      );
      
      DELETE FROM public.tournament_photos 
      WHERE tournament_id IN (
        SELECT t.id FROM public.tournaments t 
        WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = t.user_id::text)
      );
      
      DELETE FROM public.tournaments 
      WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id::text = user_id::text);
    END IF;
    
  ELSE
    RAISE NOTICE 'Types match. Cleaning up orphaned records...';
    
    -- Types match, just clean up orphaned records
    DELETE FROM public.tournament_results 
    WHERE tournament_id IN (
      SELECT t.id FROM public.tournaments t 
      LEFT JOIN auth.users u ON t.user_id = u.id 
      WHERE u.id IS NULL
    );
    
    DELETE FROM public.tournament_photos 
    WHERE tournament_id IN (
      SELECT t.id FROM public.tournaments t 
      LEFT JOIN auth.users u ON t.user_id = u.id 
      WHERE u.id IS NULL
    );
    
    DELETE FROM public.tournaments 
    WHERE user_id NOT IN (SELECT id FROM auth.users);
  END IF;
END;
$$;

-- Now create the foreign key constraint
ALTER TABLE public.tournaments 
DROP CONSTRAINT IF EXISTS tournaments_user_id_fkey;

ALTER TABLE public.tournaments 
ADD CONSTRAINT tournaments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;

-- Check if tournament_photos table exists before enabling RLS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournament_photos' AND table_schema = 'public') THEN
    ALTER TABLE tournament_photos ENABLE ROW LEVEL SECURITY;
  END IF;
END;
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;

DROP POLICY IF EXISTS "Users can view own tournaments" ON tournaments;
DROP POLICY IF EXISTS "Users can insert own tournaments" ON tournaments;
DROP POLICY IF EXISTS "Users can update own tournaments" ON tournaments;
DROP POLICY IF EXISTS "Users can delete own tournaments" ON tournaments;
DROP POLICY IF EXISTS "Admins can view all tournaments" ON tournaments;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid()::uuid = id::uuid);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid()::uuid = id::uuid);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid()::uuid = id::uuid);

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id::uuid = auth.uid()::uuid AND p.role = 'admin'
    )
  );

-- Create RLS policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings 
  FOR SELECT USING (auth.uid()::uuid = user_id::uuid);

CREATE POLICY "Users can update own settings" ON user_settings 
  FOR UPDATE USING (auth.uid()::uuid = user_id::uuid);

CREATE POLICY "Users can insert own settings" ON user_settings 
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id::uuid);

-- Create RLS policies for tournaments
CREATE POLICY "Users can view own tournaments" ON tournaments 
  FOR SELECT USING (auth.uid()::uuid = user_id::uuid);

CREATE POLICY "Users can insert own tournaments" ON tournaments 
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id::uuid);

CREATE POLICY "Users can update own tournaments" ON tournaments 
  FOR UPDATE USING (auth.uid()::uuid = user_id::uuid);

CREATE POLICY "Users can delete own tournaments" ON tournaments 
  FOR DELETE USING (auth.uid()::uuid = user_id::uuid);

-- Admin can view all tournaments (for administration)
CREATE POLICY "Admins can view all tournaments" ON tournaments 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id::uuid = auth.uid()::uuid AND p.role = 'admin'
    )
  );

-- Create RLS policies for tournament_results
DROP POLICY IF EXISTS "Users can view own results" ON tournament_results;
DROP POLICY IF EXISTS "Users can insert own results" ON tournament_results;
DROP POLICY IF EXISTS "Users can update own results" ON tournament_results;
DROP POLICY IF EXISTS "Users can delete own results" ON tournament_results;

CREATE POLICY "Users can view own results" ON tournament_results 
  FOR SELECT USING (
    auth.uid()::uuid = (SELECT user_id::uuid FROM tournaments WHERE id = tournament_id)
  );

CREATE POLICY "Users can insert own results" ON tournament_results 
  FOR INSERT WITH CHECK (
    auth.uid()::uuid = (SELECT user_id::uuid FROM tournaments WHERE id = tournament_id)
  );

CREATE POLICY "Users can update own results" ON tournament_results 
  FOR UPDATE USING (
    auth.uid()::uuid = (SELECT user_id::uuid FROM tournaments WHERE id = tournament_id)
  );

CREATE POLICY "Users can delete own results" ON tournament_results 
  FOR DELETE USING (
    auth.uid()::uuid = (SELECT user_id::uuid FROM tournaments WHERE id = tournament_id)
  );

-- Create RLS policies for tournament_photos (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournament_photos' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Users can view own photos" ON tournament_photos;
    DROP POLICY IF EXISTS "Users can insert own photos" ON tournament_photos;
    DROP POLICY IF EXISTS "Users can update own photos" ON tournament_photos;
    DROP POLICY IF EXISTS "Users can delete own photos" ON tournament_photos;

    CREATE POLICY "Users can view own photos" ON tournament_photos 
      FOR SELECT USING (
        auth.uid()::uuid = (SELECT user_id::uuid FROM tournaments WHERE id = tournament_id)
      );

    CREATE POLICY "Users can insert own photos" ON tournament_photos 
      FOR INSERT WITH CHECK (
        auth.uid()::uuid = (SELECT user_id::uuid FROM tournaments WHERE id = tournament_id)
      );

    CREATE POLICY "Users can update own photos" ON tournament_photos 
      FOR UPDATE USING (
        auth.uid()::uuid = (SELECT user_id::uuid FROM tournaments WHERE id = tournament_id)
      );

    CREATE POLICY "Users can delete own photos" ON tournament_photos 
      FOR DELETE USING (
        auth.uid()::uuid = (SELECT user_id::uuid FROM tournaments WHERE id = tournament_id)
      );
  END IF;
END;
$$;

-- Function to handle new user registration (creates profile automatically)
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

-- Function to create the first admin user
CREATE OR REPLACE FUNCTION public.create_admin_user(admin_email TEXT)
RETURNS VOID AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get user ID by email
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', admin_email;
  END IF;
  
  -- Update role to admin
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
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON profiles(telegram_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_tournaments_user_id ON tournaments(user_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_date ON tournaments(date);
CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament_id ON tournament_results(tournament_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_settings TO authenticated;
GRANT ALL ON public.tournaments TO authenticated;
GRANT ALL ON public.tournament_results TO authenticated;

-- Grant permissions for tournament_photos if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournament_photos' AND table_schema = 'public') THEN
    GRANT ALL ON public.tournament_photos TO authenticated;
  END IF;
END;
$$;

-- Allow anon users to read profiles (for public features)
GRANT SELECT ON public.profiles TO anon;

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users with additional data and role-based access';
COMMENT ON TABLE public.user_settings IS 'User-specific application settings and preferences';
COMMENT ON COLUMN public.profiles.role IS 'User role: player (default) or admin';
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates profile and settings when user registers';
COMMENT ON FUNCTION public.create_admin_user(TEXT) IS 'Promotes a user to admin role by email';

-- Final verification
DO $$
DECLARE
  total_tournaments INTEGER;
  user_id_type TEXT;
  auth_id_type TEXT;
BEGIN
  SELECT COUNT(*) INTO total_tournaments FROM public.tournaments;
  
  SELECT data_type INTO user_id_type
  FROM information_schema.columns 
  WHERE table_name = 'tournaments' AND table_schema = 'public' AND column_name = 'user_id';
  
  SELECT data_type INTO auth_id_type
  FROM information_schema.columns 
  WHERE table_name = 'users' AND table_schema = 'auth' AND column_name = 'id';
  
  RAISE NOTICE '';
  RAISE NOTICE '=== SETUP COMPLETE ===';
  RAISE NOTICE 'Total tournaments: %', total_tournaments;
  RAISE NOTICE 'tournaments.user_id type: %', user_id_type;
  RAISE NOTICE 'auth.users.id type: %', auth_id_type;
  
  IF user_id_type = auth_id_type THEN
    RAISE NOTICE '✅ Data types match! Foreign key constraint is active.';
  ELSE
    RAISE NOTICE '⚠️  Data types still don''t match. Manual intervention may be needed.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Register your first user through the app';
  RAISE NOTICE '2. Promote to admin: SELECT public.create_admin_user(''your-email@example.com'');';
  RAISE NOTICE '3. Test authentication and authorization';
END;
$$;
