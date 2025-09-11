-- Создание таблицы для кодов связывания Telegram аккаунтов
CREATE TABLE IF NOT EXISTS public.telegram_linking_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    linking_code TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_telegram_linking_codes_user_id ON public.telegram_linking_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_linking_codes_code ON public.telegram_linking_codes(linking_code);
CREATE INDEX IF NOT EXISTS idx_telegram_linking_codes_expires ON public.telegram_linking_codes(expires_at);

-- Включаем RLS (Row Level Security)
ALTER TABLE public.telegram_linking_codes ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут видеть только свои коды
CREATE POLICY "Users can view their own linking codes" ON public.telegram_linking_codes
    FOR SELECT USING (auth.uid() = user_id);

-- Политика: только админы могут создавать/обновлять коды
CREATE POLICY "Admins can manage linking codes" ON public.telegram_linking_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Функция для автоматического удаления истекших кодов
CREATE OR REPLACE FUNCTION public.cleanup_expired_linking_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM public.telegram_linking_codes 
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем задачу для автоматической очистки (если поддерживается)
-- SELECT cron.schedule('cleanup-expired-codes', '0 * * * *', 'SELECT public.cleanup_expired_linking_codes();');

-- Комментарии к таблице
COMMENT ON TABLE public.telegram_linking_codes IS 'Временные коды для связывания Telegram аккаунтов с веб-аккаунтами';
COMMENT ON COLUMN public.telegram_linking_codes.linking_code IS 'Уникальный код для связывания (8 символов)';
COMMENT ON COLUMN public.telegram_linking_codes.expires_at IS 'Время истечения кода (обычно 10 минут)';
COMMENT ON COLUMN public.telegram_linking_codes.is_used IS 'Флаг использования кода';

