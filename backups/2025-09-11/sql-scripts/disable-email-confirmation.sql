-- Отключение email confirmation для локального тестирования
-- Выполните в Supabase SQL Editor для быстрого тестирования без подтверждения email

-- Обновляем настройки аутентификации
UPDATE auth.config 
SET 
  enable_signup = true,
  enable_confirmations = false,
  enable_recoveries = true
WHERE id = 1;

-- Альтернативно, можно обновить через Supabase Dashboard:
-- Authentication → Settings → Email confirmation → Отключить "Enable email confirmations"

-- Для уже зарегистрированных пользователей, которые не подтвердили email:
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

RAISE NOTICE 'Email confirmation отключено для локального тестирования';
RAISE NOTICE 'Перезапустите приложение и проверьте регистрацию по email/паролю';
