-- Добавляем таблицу для хранения настроек пользователя
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  current_venue TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Добавляем индекс для быстрого поиска по user_id
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Отключаем RLS для таблицы user_settings (для разработки)
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- Добавляем комментарии
COMMENT ON TABLE user_settings IS 'Настройки пользователей';
COMMENT ON COLUMN user_settings.user_id IS 'ID пользователя Telegram';
COMMENT ON COLUMN user_settings.current_venue IS 'Текущая площадка для новых турниров';
