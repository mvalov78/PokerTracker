-- PokerTracker Pro Database Schema for Supabase
-- Выполните эти команды в SQL Editor вашего Supabase проекта

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- 1. Users table (пользователи)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  telegram_id BIGINT UNIQUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tournaments table (турниры)
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  venue TEXT,
  buyin DECIMAL(10,2) NOT NULL DEFAULT 0,
  tournament_type TEXT CHECK (tournament_type IN ('freezeout', 'rebuy', 'addon', 'bounty', 'satellite')) DEFAULT 'freezeout',
  structure TEXT,
  participants INTEGER,
  prize_pool DECIMAL(12,2),
  blind_levels TEXT,
  starting_stack INTEGER,
  ticket_image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tournament Results table (результаты турниров)
CREATE TABLE IF NOT EXISTS tournament_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE UNIQUE,
  position INTEGER NOT NULL CHECK (position > 0),
  payout DECIMAL(10,2) NOT NULL DEFAULT 0,
  profit DECIMAL(10,2) NOT NULL DEFAULT 0,
  roi DECIMAL(8,2) NOT NULL DEFAULT 0,
  notes TEXT,
  knockouts INTEGER DEFAULT 0,
  rebuy_count INTEGER DEFAULT 0,
  addon_count INTEGER DEFAULT 0,
  time_eliminated TIMESTAMP WITH TIME ZONE,
  final_table_reached BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tournament Photos table (фотографии турниров)
CREATE TABLE IF NOT EXISTS tournament_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bankroll Transactions table (транзакции банкролла)
CREATE TABLE IF NOT EXISTS bankroll_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('deposit', 'withdrawal', 'tournament_buyin', 'tournament_payout', 'transfer')) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. User Sessions table (сессии пользователей для бота)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  telegram_user_id BIGINT NOT NULL,
  session_data JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournaments_user_id ON tournaments(user_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_date ON tournaments(date);
CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament_id ON tournament_results(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_photos_tournament_id ON tournament_photos(tournament_id);
CREATE INDEX IF NOT EXISTS idx_bankroll_transactions_user_id ON bankroll_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_telegram_user_id ON user_sessions(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bankroll_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: пользователи могут видеть и изменять только свои данные
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Tournaments: пользователи могут видеть и изменять только свои турниры
CREATE POLICY "Users can view own tournaments" ON tournaments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own tournaments" ON tournaments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own tournaments" ON tournaments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own tournaments" ON tournaments FOR DELETE USING (user_id = auth.uid());

-- Tournament Results: доступ через связанный турнир
CREATE POLICY "Users can view own tournament results" ON tournament_results FOR SELECT 
  USING (EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_results.tournament_id AND tournaments.user_id = auth.uid()));
CREATE POLICY "Users can insert own tournament results" ON tournament_results FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_results.tournament_id AND tournaments.user_id = auth.uid()));
CREATE POLICY "Users can update own tournament results" ON tournament_results FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_results.tournament_id AND tournaments.user_id = auth.uid()));
CREATE POLICY "Users can delete own tournament results" ON tournament_results FOR DELETE 
  USING (EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_results.tournament_id AND tournaments.user_id = auth.uid()));

-- Tournament Photos: доступ через связанный турнир
CREATE POLICY "Users can view own tournament photos" ON tournament_photos FOR SELECT 
  USING (EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_photos.tournament_id AND tournaments.user_id = auth.uid()));
CREATE POLICY "Users can insert own tournament photos" ON tournament_photos FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_photos.tournament_id AND tournaments.user_id = auth.uid()));
CREATE POLICY "Users can update own tournament photos" ON tournament_photos FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_photos.tournament_id AND tournaments.user_id = auth.uid()));
CREATE POLICY "Users can delete own tournament photos" ON tournament_photos FOR DELETE 
  USING (EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_photos.tournament_id AND tournaments.user_id = auth.uid()));

-- Bankroll Transactions: пользователи видят только свои транзакции
CREATE POLICY "Users can view own bankroll transactions" ON bankroll_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own bankroll transactions" ON bankroll_transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own bankroll transactions" ON bankroll_transactions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own bankroll transactions" ON bankroll_transactions FOR DELETE USING (user_id = auth.uid());

-- User Sessions: специальная политика для бота (используется service role)
CREATE POLICY "Service role can manage all sessions" ON user_sessions FOR ALL USING (auth.role() = 'service_role');

-- Создаем функцию для получения пользователя по telegram_id (для бота)
CREATE OR REPLACE FUNCTION get_user_by_telegram_id(telegram_user_id BIGINT)
RETURNS TABLE(user_uuid UUID) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT id FROM users WHERE telegram_id = telegram_user_id;
END;
$$ LANGUAGE plpgsql;

-- Функция для создания пользователя через Telegram бота
CREATE OR REPLACE FUNCTION create_user_from_telegram(
  telegram_user_id BIGINT,
  telegram_username TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  INSERT INTO users (telegram_id, username, email)
  VALUES (telegram_user_id, telegram_username, telegram_user_id::TEXT || '@telegram.local')
  RETURNING id INTO new_user_id;
  
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- Вставляем тестовые данные
INSERT INTO users (id, username, email, telegram_id, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test_user',
  'test@example.com',
  49767276,
  NOW(),
  NOW()
) ON CONFLICT (telegram_id) DO NOTHING;

-- Вставляем тестовый турнир
INSERT INTO tournaments (
  id,
  user_id,
  name,
  date,
  venue,
  buyin,
  tournament_type,
  structure,
  starting_stack,
  notes,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'RUSSIA SOCHI 2025',
  '2025-08-21T18:00:00Z',
  'SOCHI 2025 EVE',
  275.00,
  'freezeout',
  'NL Hold''em',
  25000,
  'Создано через распознавание билета в Telegram боте',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Вставляем тестовый результат
INSERT INTO tournament_results (
  id,
  tournament_id,
  position,
  payout,
  profit,
  roi,
  notes,
  knockouts,
  rebuy_count,
  addon_count,
  final_table_reached,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  3,
  850.00,
  575.00,
  109.09,
  'Отличная игра в финальном столе! Добавлено через /result',
  2,
  0,
  1,
  true,
  NOW()
) ON CONFLICT (tournament_id) DO NOTHING;
