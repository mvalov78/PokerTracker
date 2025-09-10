-- Создание таблицы настроек Telegram бота
CREATE TABLE IF NOT EXISTS public.bot_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_bot_settings_key ON public.bot_settings(setting_key);

-- Включаем RLS
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;

-- Политика: только админы могут управлять настройками бота
CREATE POLICY "Only admins can manage bot settings" ON public.bot_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Вставляем начальные настройки
INSERT INTO public.bot_settings (setting_key, setting_value, description) VALUES
('bot_mode', 'polling', 'Режим работы бота: polling или webhook'),
('webhook_url', '', 'URL для webhook (заполняется автоматически)'),
('polling_enabled', 'true', 'Включен ли polling режим'),
('webhook_enabled', 'false', 'Включен ли webhook режим'),
('bot_status', 'inactive', 'Текущий статус бота: active, inactive, error'),
('last_update_time', '', 'Время последнего обновления от Telegram'),
('error_count', '0', 'Количество ошибок за последний час'),
('auto_restart', 'true', 'Автоматический перезапуск при ошибках')
ON CONFLICT (setting_key) DO NOTHING;

-- Функция для получения настройки
CREATE OR REPLACE FUNCTION public.get_bot_setting(key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT setting_value FROM public.bot_settings WHERE setting_key = key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для обновления настройки
CREATE OR REPLACE FUNCTION public.update_bot_setting(key TEXT, value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.bot_settings 
    SET setting_value = value, updated_at = NOW()
    WHERE setting_key = key;
    
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        INSERT INTO public.bot_settings (setting_key, setting_value)
        VALUES (key, value);
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Комментарии
COMMENT ON TABLE public.bot_settings IS 'Настройки Telegram бота для переключения режимов';
COMMENT ON COLUMN public.bot_settings.setting_key IS 'Ключ настройки (bot_mode, webhook_url, etc.)';
COMMENT ON COLUMN public.bot_settings.setting_value IS 'Значение настройки';
COMMENT ON COLUMN public.bot_settings.description IS 'Описание настройки для админов';
