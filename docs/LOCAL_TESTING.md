# Локальное тестирование без Google OAuth

## Быстрая настройка для разработки

### 1. Настройте .env.local файл

Создайте файл `.env.local` в корне проекта:

```bash
# Supabase Configuration (замените на ваши значения из Supabase Dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL for local development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth - НЕ добавляйте эти строки для локального тестирования
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
```

### 2. Отключите email confirmation в Supabase (для локального тестирования)

1. Перейдите в Supabase Dashboard → Authentication → Settings
2. В разделе "Email confirmation" отключите "Enable email confirmations"
3. Сохраните изменения

### 3. Запустите приложение

```bash
cd /Users/mvalov/PokerTracker/mvalovpokertracker
npm run dev
```

### 4. Тестирование авторизации

Откройте `http://localhost:3000/auth`

#### Вход администратора:
- **Email**: `mvalov78@gmail.com`
- **Пароль**: (тот, что задавали в Supabase)

#### Создание тестовых пользователей:
1. Перейдите на вкладку "Регистрация"
2. Создайте аккаунты:
   - `player1@test.com` / `password123`
   - `player2@test.com` / `password123`
   - `admin2@test.com` / `password123`

### 5. Проверка изоляции данных

#### Тест 1: Админ
1. Войдите как `mvalov78@gmail.com`
2. Проверьте доступ к `/admin` ✅
3. Создайте турнир
4. Выйдите

#### Тест 2: Обычный игрок
1. Войдите как `player1@test.com`
2. Попробуйте зайти на `/admin` ❌ (должен перенаправить)
3. Создайте турнир
4. Убедитесь, что видите только свои турниры

#### Тест 3: Второй игрок
1. Войдите как `player2@test.com`
2. Убедитесь, что НЕ видите турниры player1
3. Создайте свой турнир

### 6. Назначение дополнительных админов

Если нужно сделать админом `admin2@test.com`:

```sql
UPDATE public.profiles p
SET role = 'admin', updated_at = NOW()
FROM auth.users u
WHERE u.email = 'admin2@test.com' AND p.id = u.id;
```

### 7. Что должно работать

✅ **Регистрация** по email/паролю без подтверждения
✅ **Вход** по email/паролю
✅ **Автоматическое создание** профиля и настроек
✅ **Изоляция данных** между пользователями
✅ **Админ-панель** только для администраторов
✅ **Создание турниров** с привязкой к пользователю
✅ **RLS политики** работают корректно

### 8. Полезные SQL команды для отладки

```sql
-- Посмотреть всех пользователей и их роли
SELECT u.email, p.role, p.created_at
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
ORDER BY p.created_at DESC;

-- Посмотреть турниры и их владельцев
SELECT t.name, u.email as owner, t.created_at
FROM public.tournaments t
JOIN auth.users u ON u.id = t.user_id
ORDER BY t.created_at DESC;

-- Проверить RLS политики
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 9. Troubleshooting

**Проблема**: Ошибки типов в RLS политиках
**Решение**: Все политики используют `::uuid` casting

**Проблема**: Пользователь не может войти
**Решение**: Проверьте отключена ли email verification в Supabase

**Проблема**: Данные видны всем пользователям
**Решение**: Убедитесь что RLS включен:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname='public' AND tablename IN ('tournaments','profiles','user_settings');
```

**Проблема**: Google OAuth кнопка показывается
**Решение**: Не добавляйте `NEXT_PUBLIC_GOOGLE_CLIENT_ID` в .env.local

### 10. Готово к продакшену

После локального тестирования для продакшена:
1. Включите email confirmation в Supabase
2. Настройте Google OAuth по инструкции `GOOGLE_OAUTH_SETUP.md`
3. Обновите переменные окружения на Vercel/Netlify
