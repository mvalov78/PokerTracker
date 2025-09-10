-- Полное отключение RLS для разработки
-- Выполните этот скрипт в SQL Editor вашего Supabase проекта

-- Отключаем RLS для всех таблиц
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE bankroll_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

-- Удаляем все политики
DROP POLICY IF EXISTS "Users can view own data or service role" ON users;
DROP POLICY IF EXISTS "Users can update own data or service role" ON users;
DROP POLICY IF EXISTS "Users can insert data or service role" ON users;

-- Очищаем тестовые данные
DELETE FROM tournament_results WHERE tournament_id IN (SELECT id FROM tournaments WHERE user_id IN (SELECT id FROM users WHERE telegram_id = 49767276));
DELETE FROM tournaments WHERE user_id IN (SELECT id FROM users WHERE telegram_id = 49767276);
DELETE FROM users WHERE telegram_id = 49767276;

-- Создаем тестового пользователя
INSERT INTO users (id, telegram_id, username, email) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  49767276,
  'test_user',
  'test_user@telegram.local'
) ON CONFLICT (id) DO NOTHING;

-- Создаем тестовый турнир
INSERT INTO tournaments (
  id,
  user_id, 
  name, 
  date, 
  venue, 
  buyin, 
  tournament_type, 
  structure, 
  starting_stack
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Supabase Test Tournament',
  '2024-12-31T18:00:00Z',
  'Test Casino',
  100,
  'freezeout',
  'NL Hold''em',
  20000
) ON CONFLICT (id) DO NOTHING;
