-- Временно отключаем RLS для всех таблиц для тестирования
-- ⚠️ НЕ ИСПОЛЬЗУЙТЕ В ПРОДАКШЕНЕ!

-- Отключаем RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_photos DISABLE ROW LEVEL SECURITY;

-- Удаляем все политики чтобы избежать конфликтов
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

DROP POLICY IF EXISTS "user_settings_select_policy" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_insert_policy" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_update_policy" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_delete_policy" ON public.user_settings;

DROP POLICY IF EXISTS "tournaments_select_policy" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_insert_policy" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_update_policy" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_delete_policy" ON public.tournaments;

DROP POLICY IF EXISTS "tournament_results_select_policy" ON public.tournament_results;
DROP POLICY IF EXISTS "tournament_results_insert_policy" ON public.tournament_results;
DROP POLICY IF EXISTS "tournament_results_update_policy" ON public.tournament_results;
DROP POLICY IF EXISTS "tournament_results_delete_policy" ON public.tournament_results;

DROP POLICY IF EXISTS "tournament_photos_select_policy" ON public.tournament_photos;
DROP POLICY IF EXISTS "tournament_photos_insert_policy" ON public.tournament_photos;
DROP POLICY IF EXISTS "tournament_photos_update_policy" ON public.tournament_photos;
DROP POLICY IF EXISTS "tournament_photos_delete_policy" ON public.tournament_photos;

-- Информация
SELECT 'RLS отключен для всех таблиц. Теперь можно тестировать без ограничений доступа.' as message;
