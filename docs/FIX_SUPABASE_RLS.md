# 🔧 Исправление RLS политик в Supabase

## Проблема
Система пытается использовать Supabase, но RLS (Row Level Security) политики блокируют операции с service role.

## Решение 1: Временно отключить RLS (для разработки)

Выполните в SQL Editor вашего Supabase проекта:

```sql
-- ВРЕМЕННОЕ отключение RLS для разработки
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE bankroll_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

-- Очистка тестовых данных
DELETE FROM users WHERE telegram_id = 49767276;
```

## Решение 2: Обновить RLS политики (для production)

Выполните команды из файла `sql-scripts/fix-rls-policies.sql` в SQL Editor.

## Решение 3: Создать тестового пользователя вручную

```sql
-- Создаем тестового пользователя с фиксированным UUID
INSERT INTO users (id, telegram_id, username, email) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  49767276,
  'test_user',
  '49767276@telegram.local'
) ON CONFLICT (telegram_id) DO NOTHING;
```

## После исправления

Перезапустите сервер:
```bash
npm run dev
```

Система должна работать с Supabase без fallback к mockData.
