-- Проверка пользователей в auth.users
-- Выполните этот запрос в Supabase SQL Editor

SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Если вы знаете email пользователя, замените 'user@example.com' на нужный:
-- SELECT * FROM auth.users WHERE email = 'user@example.com';

