-- Исправление RLS политик для работы с service role

-- Удаляем старые политики для users
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Создаем новые политики для users с поддержкой service role
CREATE POLICY "Users can view own data or service role" ON users FOR SELECT 
  USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own data or service role" ON users FOR UPDATE 
  USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert data or service role" ON users FOR INSERT 
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Обновляем политики для tournaments
DROP POLICY IF EXISTS "Users can view own tournaments" ON tournaments;
DROP POLICY IF EXISTS "Users can insert own tournaments" ON tournaments;
DROP POLICY IF EXISTS "Users can update own tournaments" ON tournaments;
DROP POLICY IF EXISTS "Users can delete own tournaments" ON tournaments;

CREATE POLICY "Users can view own tournaments or service role" ON tournaments FOR SELECT 
  USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "Users can insert tournaments or service role" ON tournaments FOR INSERT 
  WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "Users can update own tournaments or service role" ON tournaments FOR UPDATE 
  USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "Users can delete own tournaments or service role" ON tournaments FOR DELETE 
  USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- Обновляем политики для tournament_results
DROP POLICY IF EXISTS "Users can view own tournament results" ON tournament_results;
DROP POLICY IF EXISTS "Users can insert own tournament results" ON tournament_results;
DROP POLICY IF EXISTS "Users can update own tournament results" ON tournament_results;
DROP POLICY IF EXISTS "Users can delete own tournament results" ON tournament_results;

CREATE POLICY "Users can view tournament results or service role" ON tournament_results FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_results.tournament_id AND tournaments.user_id = auth.uid()) 
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can insert tournament results or service role" ON tournament_results FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_results.tournament_id AND tournaments.user_id = auth.uid()) 
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can update tournament results or service role" ON tournament_results FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_results.tournament_id AND tournaments.user_id = auth.uid()) 
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can delete tournament results or service role" ON tournament_results FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_results.tournament_id AND tournaments.user_id = auth.uid()) 
    OR auth.role() = 'service_role'
  );

-- Аналогично для tournament_photos
DROP POLICY IF EXISTS "Users can view own tournament photos" ON tournament_photos;
DROP POLICY IF EXISTS "Users can insert own tournament photos" ON tournament_photos;
DROP POLICY IF EXISTS "Users can update own tournament photos" ON tournament_photos;
DROP POLICY IF EXISTS "Users can delete own tournament photos" ON tournament_photos;

CREATE POLICY "Users can view tournament photos or service role" ON tournament_photos FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_photos.tournament_id AND tournaments.user_id = auth.uid()) 
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can insert tournament photos or service role" ON tournament_photos FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_photos.tournament_id AND tournaments.user_id = auth.uid()) 
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can update tournament photos or service role" ON tournament_photos FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_photos.tournament_id AND tournaments.user_id = auth.uid()) 
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can delete tournament photos or service role" ON tournament_photos FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_photos.tournament_id AND tournaments.user_id = auth.uid()) 
    OR auth.role() = 'service_role'
  );

-- Обновляем политики для bankroll_transactions
DROP POLICY IF EXISTS "Users can view own bankroll transactions" ON bankroll_transactions;
DROP POLICY IF EXISTS "Users can insert own bankroll transactions" ON bankroll_transactions;
DROP POLICY IF EXISTS "Users can update own bankroll transactions" ON bankroll_transactions;
DROP POLICY IF EXISTS "Users can delete own bankroll transactions" ON bankroll_transactions;

CREATE POLICY "Users can view bankroll transactions or service role" ON bankroll_transactions FOR SELECT 
  USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "Users can insert bankroll transactions or service role" ON bankroll_transactions FOR INSERT 
  WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "Users can update bankroll transactions or service role" ON bankroll_transactions FOR UPDATE 
  USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "Users can delete bankroll transactions or service role" ON bankroll_transactions FOR DELETE 
  USING (user_id = auth.uid() OR auth.role() = 'service_role');
