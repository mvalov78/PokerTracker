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
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can view own data or service role" ON users;
DROP POLICY IF EXISTS "Users can update own data or service role" ON users;
DROP POLICY IF EXISTS "Users can insert data or service role" ON users;

DROP POLICY IF EXISTS "Users can view own tournaments" ON tournaments;
DROP POLICY IF EXISTS "Users can update own tournaments" ON tournaments;
DROP POLICY IF EXISTS "Users can insert own tournaments" ON tournaments;
DROP POLICY IF EXISTS "Users can delete own tournaments" ON tournaments;
DROP POLICY IF EXISTS "Users can view own tournaments or service role" ON tournaments;
DROP POLICY IF EXISTS "Users can update own tournaments or service role" ON tournaments;
DROP POLICY IF EXISTS "Users can insert tournaments or service role" ON tournaments;
DROP POLICY IF EXISTS "Users can delete own tournaments or service role" ON tournaments;

DROP POLICY IF EXISTS "Users can view own results" ON tournament_results;
DROP POLICY IF EXISTS "Users can update own results" ON tournament_results;
DROP POLICY IF EXISTS "Users can insert own results" ON tournament_results;
DROP POLICY IF EXISTS "Users can delete own results" ON tournament_results;
DROP POLICY IF EXISTS "Users can view own results or service role" ON tournament_results;
DROP POLICY IF EXISTS "Users can update own results or service role" ON tournament_results;
DROP POLICY IF EXISTS "Users can insert results or service role" ON tournament_results;
DROP POLICY IF EXISTS "Users can delete own results or service role" ON tournament_results;

-- Очищаем тестовые данные (опционально)
-- DELETE FROM tournament_results WHERE tournament_id IN (SELECT id FROM tournaments WHERE user_id IN (SELECT id FROM users WHERE telegram_id = 49767276));
-- DELETE FROM tournaments WHERE user_id IN (SELECT id FROM users WHERE telegram_id = 49767276);
-- DELETE FROM users WHERE telegram_id = 49767276;

-- Проверяем статус RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'tournaments', 'tournament_results', 'tournament_photos', 'bankroll_transactions', 'user_sessions');
