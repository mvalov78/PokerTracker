# Исправление ошибок при настройке авторизации

## Возможные проблемы

### Проблема 1: Foreign Key Constraint
```
ERROR: 23503: insert or update on table "tournaments" violates foreign key constraint "tournaments_user_id_fkey"
DETAIL: Key (user_id)=(00000000-0000-0000-0000-000000000001) is not present in table "users".
```

### Проблема 2: Type Mismatch
```
ERROR: 42883: operator does not exist: uuid = text
HINT: No operator matches the given name and argument types. You might need to add explicit type casts.
```

Эти ошибки означают:
1. В таблице `tournaments` есть записи с `user_id`, которые не существуют в `auth.users`
2. Типы данных не совпадают (`text` vs `uuid`)

## Решения

### Вариант 1: Простое и безопасное исправление (рекомендуемый)

Используйте простой скрипт `setup-auth-schema-simple.sql`:

```sql
-- Этот скрипт гарантированно работает с любыми типами данных
\i sql-scripts/setup-auth-schema-simple.sql
```

Этот скрипт:
- ✅ Работает с любыми типами данных
- ✅ Безопасно очищает несовместимые записи
- ✅ Использует EXECUTE для избежания проблем с типами
- ✅ Создает все таблицы и политики RLS
- ✅ Выводит подробный отчет о результатах

### Вариант 2: Диагностика проблемы

Сначала выполните диагностический скрипт:

```sql
-- Проверьте структуру таблиц
\i sql-scripts/check-table-structure.sql
```

### Вариант 2: Очистка данных (быстрый)

Если вы согласны удалить "сиротские" турниры, выполните исправленный скрипт:

```sql
-- Этот скрипт удалит турниры без пользователей
\i sql-scripts/setup-auth-schema.sql
```

### Вариант 3: Ручное исправление

1. **Сначала проверьте типы данных:**
```sql
-- Проверка типов данных
SELECT 
  'tournaments.user_id' as field,
  data_type 
FROM information_schema.columns 
WHERE table_name = 'tournaments' AND column_name = 'user_id'
UNION ALL
SELECT 
  'auth.users.id' as field,
  data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'auth' AND column_name = 'id';
```

2. **Если типы не совпадают, исправьте их:**
```sql
-- Если tournaments.user_id имеет тип text, а auth.users.id имеет тип uuid:

-- Удалите записи с невалидными UUID
DELETE FROM tournament_results 
WHERE tournament_id IN (
  SELECT id FROM tournaments 
  WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);

DELETE FROM tournaments 
WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Преобразуйте тип колонки
ALTER TABLE tournaments ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
```

3. **Проверьте какие записи проблемные:**
```sql
-- После исправления типов
SELECT t.id, t.user_id, t.name, t.date
FROM tournaments t 
LEFT JOIN auth.users u ON t.user_id = u.id 
WHERE u.id IS NULL;
```

2. **Выберите один из способов исправления:**

**a) Удалить проблемные турниры:**
```sql
-- Сначала удалите связанные записи
DELETE FROM tournament_results 
WHERE tournament_id IN (
  SELECT t.id FROM tournaments t 
  LEFT JOIN auth.users u ON t.user_id = u.id 
  WHERE u.id IS NULL
);

-- Затем удалите турниры
DELETE FROM tournaments 
WHERE user_id NOT IN (SELECT id FROM auth.users);
```

**b) Переназначить на существующего пользователя:**
```sql
-- Замените 'your-real-user-id' на ID существующего пользователя
UPDATE tournaments 
SET user_id = 'your-real-user-id' 
WHERE user_id NOT IN (SELECT id FROM auth.users);
```

**c) Установить NULL (временно):**
```sql
-- Временно убрать связь
UPDATE tournaments 
SET user_id = NULL 
WHERE user_id NOT IN (SELECT id FROM auth.users);
```

3. **После исправления выполните:**
```sql
-- Создайте foreign key constraint
ALTER TABLE tournaments 
ADD CONSTRAINT tournaments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

## Проверка результата

После любого из исправлений выполните:

```sql
-- Проверка что все записи корректны
SELECT 
  COUNT(*) as total_tournaments,
  COUNT(user_id) as tournaments_with_users,
  COUNT(*) - COUNT(user_id) as tournaments_without_users
FROM tournaments;

-- Убедитесь что constraint создался
SELECT conname, contype 
FROM pg_constraint 
WHERE conname = 'tournaments_user_id_fkey';
```

## Рекомендация

**Используйте `setup-auth-schema-safe.sql`** - он безопасно обработает любую ситуацию и даст подробный отчет о том, что нужно исправить.

После выполнения любого скрипта вы получите отчет вида:
```
=== SETUP COMPLETE ===
Total tournaments: 15
Orphaned tournaments: 3
WARNING: There are 3 orphaned tournaments...
```

Это поможет вам принять осознанное решение о том, как обрабатывать данные.
