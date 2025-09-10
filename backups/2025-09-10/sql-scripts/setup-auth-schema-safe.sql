-- PokerTracker Authentication & Authorization Schema (Safe Version)
-- This script preserves existing data by creating temporary users for orphaned records

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

-- Function to create placeholder users for orphaned tournaments
CREATE OR REPLACE FUNCTION public.create_placeholder_users()
RETURNS VOID AS $$
DECLARE
  orphaned_user_id UUID;
  placeholder_email TEXT;
  user_counter INTEGER := 1;
BEGIN
  -- Create placeholder users for each orphaned user_id in tournaments
  FOR orphaned_user_id IN 
    SELECT DISTINCT t.user_id 
    FROM public.tournaments t 
    LEFT JOIN auth.users u ON t.user_id = u.id 
    WHERE u.id IS NULL
  LOOP
    -- Generate a unique placeholder email
    placeholder_email := 'placeholder-user-' || user_counter || '@pokertracker.placeholder';
    
    -- Insert into auth.users (this might require manual intervention depending on your auth setup)
    -- Note: This is a simplified approach. In reality, you might need to use Supabase admin API
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      orphaned_user_id,
      'authenticated',
      'authenticated',
      placeholder_email,
      crypt('placeholder-password-123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "placeholder", "providers": ["placeholder"]}',
      '{"username": "placeholder-user-' || user_counter || '"}',
      false,
      '',
      '',
      '',
      ''
    );
    
    user_counter := user_counter + 1;
  END LOOP;
  
  RAISE NOTICE 'Created % placeholder users for orphaned tournaments', user_counter - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative: Safer approach - just update user_id to NULL for orphaned records
CREATE OR REPLACE FUNCTION public.handle_orphaned_tournaments()
RETURNS VOID AS $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  -- Count orphaned tournaments
  SELECT COUNT(*) INTO orphaned_count
  FROM public.tournaments t 
  LEFT JOIN auth.users u ON t.user_id = u.id 
  WHERE u.id IS NULL;
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Found % orphaned tournaments. Options:', orphaned_count;
    RAISE NOTICE '1. Delete orphaned data (run setup-auth-schema.sql)';
    RAISE NOTICE '2. Create placeholder users (risky, requires manual auth setup)';
    RAISE NOTICE '3. Update user_id to NULL and fix manually later';
    
    -- Option 3: Set user_id to NULL for orphaned tournaments
    -- This is the safest approach - preserves data but breaks foreign key temporarily
    RAISE NOTICE 'To preserve data, consider setting user_id to NULL temporarily:';
    RAISE NOTICE 'UPDATE tournaments SET user_id = NULL WHERE user_id NOT IN (SELECT id FROM auth.users);';
  ELSE
    RAISE NOTICE 'No orphaned tournaments found. Safe to proceed with foreign key creation.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Check for orphaned data before proceeding
SELECT public.handle_orphaned_tournaments();

-- Only proceed with foreign key creation if no orphaned data
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM public.tournaments t 
  LEFT JOIN auth.users u ON t.user_id = u.id 
  WHERE u.id IS NULL;
  
  IF orphaned_count = 0 THEN
    -- Safe to create foreign key constraint
    ALTER TABLE public.tournaments 
    DROP CONSTRAINT IF EXISTS tournaments_user_id_fkey;
    
    ALTER TABLE public.tournaments 
    ADD CONSTRAINT tournaments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key constraint created successfully';
  ELSE
    RAISE NOTICE 'Skipping foreign key creation due to orphaned data. Please resolve first.';
  END IF;
END;
$$;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;

-- Check if tournament_photos table exists before enabling RLS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournament_photos') THEN
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
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Create RLS policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for tournaments
CREATE POLICY "Users can view own tournaments" ON tournaments 
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own tournaments" ON tournaments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tournaments" ON tournaments 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tournaments" ON tournaments 
  FOR DELETE USING (auth.uid() = user_id);

-- Admin can view all tournaments (for administration)
CREATE POLICY "Admins can view all tournaments" ON tournaments 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Create RLS policies for tournament_results (if foreign key exists)
DROP POLICY IF EXISTS "Users can view own results" ON tournament_results;
DROP POLICY IF EXISTS "Users can insert own results" ON tournament_results;
DROP POLICY IF EXISTS "Users can update own results" ON tournament_results;
DROP POLICY IF EXISTS "Users can delete own results" ON tournament_results;

CREATE POLICY "Users can view own results" ON tournament_results 
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM tournaments WHERE id = tournament_id)
    OR (SELECT user_id FROM tournaments WHERE id = tournament_id) IS NULL
  );

CREATE POLICY "Users can insert own results" ON tournament_results 
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM tournaments WHERE id = tournament_id)
  );

CREATE POLICY "Users can update own results" ON tournament_results 
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM tournaments WHERE id = tournament_id)
  );

CREATE POLICY "Users can delete own results" ON tournament_results 
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM tournaments WHERE id = tournament_id)
  );

-- Create RLS policies for tournament_photos (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournament_photos') THEN
    DROP POLICY IF EXISTS "Users can view own photos" ON tournament_photos;
    DROP POLICY IF EXISTS "Users can insert own photos" ON tournament_photos;
    DROP POLICY IF EXISTS "Users can update own photos" ON tournament_photos;
    DROP POLICY IF EXISTS "Users can delete own photos" ON tournament_photos;

    CREATE POLICY "Users can view own photos" ON tournament_photos 
      FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM tournaments WHERE id = tournament_id)
        OR (SELECT user_id FROM tournaments WHERE id = tournament_id) IS NULL
      );

    CREATE POLICY "Users can insert own photos" ON tournament_photos 
      FOR INSERT WITH CHECK (
        auth.uid() = (SELECT user_id FROM tournaments WHERE id = tournament_id)
      );

    CREATE POLICY "Users can update own photos" ON tournament_photos 
      FOR UPDATE USING (
        auth.uid() = (SELECT user_id FROM tournaments WHERE id = tournament_id)
      );

    CREATE POLICY "Users can delete own photos" ON tournament_photos 
      FOR DELETE USING (
        auth.uid() = (SELECT user_id FROM tournaments WHERE id = tournament_id)
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
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournament_photos') THEN
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

-- Final status report
DO $$
DECLARE
  orphaned_count INTEGER;
  total_tournaments INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_tournaments FROM public.tournaments;
  
  SELECT COUNT(*) INTO orphaned_count
  FROM public.tournaments t 
  LEFT JOIN auth.users u ON t.user_id = u.id 
  WHERE u.id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== SETUP COMPLETE ===';
  RAISE NOTICE 'Total tournaments: %', total_tournaments;
  RAISE NOTICE 'Orphaned tournaments: %', orphaned_count;
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'WARNING: There are % orphaned tournaments (tournaments with non-existent user_id)', orphaned_count;
    RAISE NOTICE 'These tournaments are temporarily accessible but not linked to users.';
    RAISE NOTICE 'To fix this, you can:';
    RAISE NOTICE '1. Delete orphaned data: DELETE FROM tournaments WHERE user_id NOT IN (SELECT id FROM auth.users);';
    RAISE NOTICE '2. Assign to a real user: UPDATE tournaments SET user_id = ''your-real-user-id'' WHERE user_id NOT IN (SELECT id FROM auth.users);';
    RAISE NOTICE '3. Leave as is and fix manually later';
  ELSE
    RAISE NOTICE 'All tournaments are properly linked to users. Foreign key constraints are active.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Register your first user through the app';
  RAISE NOTICE '2. Promote to admin: SELECT public.create_admin_user(''your-email@example.com'');';
  RAISE NOTICE '3. Test authentication and authorization';
END;
$$;
