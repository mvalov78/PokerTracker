-- Создание таблицы для хранения сессий Telegram бота
-- Это позволяет сохранять состояние пользователей между webhook запросами на Vercel

CREATE TABLE IF NOT EXISTS bot_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE, -- Telegram user ID
  session_data JSONB NOT NULL DEFAULT '{}', -- Данные сессии в JSON формате
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours') -- Сессии истекают через 24 часа
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_bot_sessions_user_id ON bot_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_expires_at ON bot_sessions(expires_at);

-- RLS политики
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;

-- Политика для сервис-роли (бот может читать и писать все сессии)
CREATE POLICY "Service role can manage bot sessions" ON bot_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_bot_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_bot_sessions_updated_at_trigger ON bot_sessions;
CREATE TRIGGER update_bot_sessions_updated_at_trigger
  BEFORE UPDATE ON bot_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_bot_sessions_updated_at();

-- Функция для очистки просроченных сессий (можно вызывать периодически)
CREATE OR REPLACE FUNCTION cleanup_expired_bot_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM bot_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Комментарии для документации
COMMENT ON TABLE bot_sessions IS 'Хранение сессий Telegram бота для webhook режима';
COMMENT ON COLUMN bot_sessions.user_id IS 'Telegram user ID (уникальный)';
COMMENT ON COLUMN bot_sessions.session_data IS 'JSON данные сессии (currentAction, tournamentData, ocrData)';
COMMENT ON COLUMN bot_sessions.expires_at IS 'Время истечения сессии (по умолчанию 24 часа)';
COMMENT ON FUNCTION cleanup_expired_bot_sessions() IS 'Очистка просроченных сессий бота';
