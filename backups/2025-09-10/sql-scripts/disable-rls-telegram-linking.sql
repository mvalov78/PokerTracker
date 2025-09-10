-- Временно отключаем RLS для таблицы telegram_linking_codes
-- (только для тестирования)

ALTER TABLE public.telegram_linking_codes DISABLE ROW LEVEL SECURITY;

-- Удаляем все политики
DROP POLICY IF EXISTS "Users can view their own linking codes" ON public.telegram_linking_codes;
DROP POLICY IF EXISTS "Users can create linking codes for themselves" ON public.telegram_linking_codes;
DROP POLICY IF EXISTS "Users can update their own linking codes" ON public.telegram_linking_codes;
DROP POLICY IF EXISTS "Admins can manage all linking codes" ON public.telegram_linking_codes;
DROP POLICY IF EXISTS "Service role can manage linking codes" ON public.telegram_linking_codes;

-- Проверяем что RLS отключен
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'telegram_linking_codes';
