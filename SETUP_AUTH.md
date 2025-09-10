# Настройка авторизации PokerTracker

Этот документ содержит пошаговые инструкции по настройке авторизации для приложения PokerTracker.

## 1. Настройка Supabase проекта

### 1.1 Создание проекта
1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите "Start your project"
3. Создайте новый проект или организацию
4. Выберите регион (рекомендуется ближайший к вашим пользователям)
5. Дождитесь создания проекта

### 1.2 Получение ключей
1. В панели Supabase перейдите в `Settings` → `API`
2. Скопируйте:
   - `Project URL` - это ваш `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` ключ - это ваш `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` ключ - это ваш `SUPABASE_SERVICE_ROLE_KEY`

### 1.3 Настройка базы данных
1. Перейдите в `SQL Editor`
2. **РЕКОМЕНДУЕТСЯ**: Используйте простой и надежный скрипт:
   ```sql
   -- Этот скрипт гарантированно работает с любыми данными
   \i sql-scripts/setup-auth-schema-simple.sql
   ```
   
   **Альтернативы**:
   - Продвинутый: `\i sql-scripts/setup-auth-schema-fixed.sql`
   - Для новых баз: `\i sql-scripts/setup-auth-schema.sql`
   - Диагностика: `\i sql-scripts/check-table-structure.sql`

3. **При ошибках**: См. подробные инструкции в `sql-scripts/FIX_ORPHANED_DATA.md`
4. Это создаст необходимые таблицы и политики RLS

## 2. Настройка Google OAuth

### 2.1 Создание проекта в Google Cloud Console
1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API:
   - Перейдите в "APIs & Services" → "Library"
   - Найдите "Google+ API" и включите его

### 2.2 Настройка OAuth consent screen
1. Перейдите в "APIs & Services" → "OAuth consent screen"
2. Выберите "External" (для публичного приложения)
3. Заполните обязательные поля:
   - App name: "PokerTracker"
   - User support email: ваш email
   - Developer contact email: ваш email
4. Добавьте скоупы:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Сохраните и продолжите

### 2.3 Создание OAuth 2.0 Client ID
1. Перейдите в "APIs & Services" → "Credentials"
2. Нажмите "Create Credentials" → "OAuth 2.0 Client ID"
3. Выберите "Web application"
4. Настройте authorized redirect URIs:
   - Для разработки: `http://localhost:3000/auth/callback`
   - Для продакшена: `https://yourdomain.com/auth/callback`
   - Для Supabase: `https://your-project.supabase.co/auth/v1/callback`
5. Сохраните и скопируйте:
   - Client ID - это ваш `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - Client Secret - это ваш `GOOGLE_CLIENT_SECRET`

## 3. Настройка Google OAuth в Supabase

1. В панели Supabase перейдите в `Authentication` → `Providers`
2. Найдите "Google" и включите его
3. Введите:
   - Client ID (из Google Cloud Console)
   - Client Secret (из Google Cloud Console)
4. В поле "Redirect URL" скопируйте URL, который показывает Supabase
5. Добавьте этот URL в Google Cloud Console как authorized redirect URI

## 4. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта `mvalovpokertracker/`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Telegram Bot (опционально)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Database URLs (автоматически из Supabase)
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
```

## 5. Создание первого администратора

После настройки и запуска приложения:

1. Зарегистрируйтесь через обычную форму или Google OAuth
2. В Supabase SQL Editor выполните:
```sql
SELECT public.create_admin_user('your-email@example.com');
```

Это даст вашему аккаунту права администратора.

## 6. Система ролей

### Роли пользователей:
- **player** (по умолчанию) - обычный игрок в покер
  - Может управлять своими турнирами
  - Видит только свою статистику
  - Доступ к основным функциям приложения

- **admin** - администратор системы
  - Все права игрока
  - Доступ к админ-панели `/admin`
  - Может просматривать всех пользователей
  - Может модерировать контент

### Изоляция данных:
- Каждый игрок видит только свои турниры и результаты
- RLS политики автоматически фильтруют данные по `user_id`
- Администраторы могут видеть все данные для модерации

## 7. Тестирование

### 7.1 Локальное тестирование
1. Запустите приложение: `npm run dev`
2. Перейдите на `http://localhost:3000/auth`
3. Попробуйте:
   - Регистрацию через email/пароль
   - Вход через email/пароль  
   - Вход через Google OAuth

### 7.2 Проверка безопасности
1. Убедитесь что неавторизованные пользователи не могут получить доступ к `/tournaments`, `/analytics` и т.д.
2. Проверьте что обычные пользователи не могут попасть в `/admin`
3. Убедитесь что пользователи видят только свои данные

## 8. Продакшен

### 8.1 Настройка домена
1. Обновите redirect URIs в Google Cloud Console для вашего домена
2. Обновите `NEXT_PUBLIC_APP_URL` в переменных окружения
3. Убедитесь что в Supabase настроены правильные Site URLs

### 8.2 Безопасность
- Никогда не коммитьте `.env.local` в Git
- Используйте переменные окружения платформы деплоя (Vercel, Netlify и т.д.)
- Регулярно ротируйте секретные ключи

## Возможные проблемы и решения

### Ошибка "Invalid redirect URI"
- Проверьте что все redirect URIs правильно настроены в Google Cloud Console
- Убедитесь что URL точно совпадают (включая http/https)

### Ошибка "User not found"
- Убедитесь что триггер `handle_new_user` создается правильно
- Проверьте что профиль создается автоматически при регистрации

### Проблемы с RLS
- Убедитесь что все политики созданы правильно
- Проверьте что `auth.uid()` возвращает правильный ID пользователя

### Проблемы с middleware
- Проверьте что middleware.ts находится в корне проекта
- Убедитесь что паттерны роутов настроены правильно
