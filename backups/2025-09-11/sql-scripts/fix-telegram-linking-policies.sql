-- Исправляем политики для таблицы telegram_linking_codes
-- Позволяем пользователям создавать коды для себя

-- Удаляем старую политику
DROP POLICY IF EXISTS "Admins can manage linking codes" ON public.telegram_linking_codes;

-- Политика: пользователи могут создавать коды для себя
CREATE POLICY "Users can create linking codes for themselves" ON public.telegram_linking_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут обновлять свои коды
CREATE POLICY "Users can update their own linking codes" ON public.telegram_linking_codes
    FOR UPDATE USING (auth.uid() = user_id);

-- Политика: админы могут управлять всеми кодами
CREATE POLICY "Admins can manage all linking codes" ON public.telegram_linking_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Политика: система может обновлять коды через service role
-- (для API endpoints, которые используют admin client)
CREATE POLICY "Service role can manage linking codes" ON public.telegram_linking_codes
    FOR ALL USING (current_user = 'service_role');

-- Проверяем созданные политики
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'telegram_linking_codes';

