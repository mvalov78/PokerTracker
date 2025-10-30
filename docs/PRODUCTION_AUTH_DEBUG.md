# Диагностика проблем с аутентификацией на продакшене

## Проблема
При попытке войти с зарегистрированным пользователем на продакшене выдается ошибка: "Произошла непредвиденная ошибка"

## Возможные причины

### 1. Отсутствие или неверные переменные окружения Supabase
**Симптомы:**
- В консоли браузера появляется сообщение: "🔴 Supabase configuration error"
- Показывается статус переменных: "❌ Missing"

**Решение:**
1. Проверьте настройки переменных окружения на Vercel:
   ```bash
   # Перейдите в настройки проекта на Vercel
   Settings → Environment Variables
   ```

2. Убедитесь, что установлены следующие переменные:
   - `NEXT_PUBLIC_SUPABASE_URL` - URL вашего Supabase проекта
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon/Public ключ Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` - Service Role ключ (для серверных операций)

3. Получить значения можно в Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
   ```

4. После добавления/изменения переменных окружения, необходимо **пересобрать и задеплоить** приложение:
   ```bash
   # В Vercel перейдите в Deployments и нажмите "Redeploy"
   ```

### 2. Проблемы с сетевым подключением к Supabase
**Симптомы:**
- Timeout ошибки в консоли
- Долгое ожидание перед появлением ошибки

**Решение:**
1. Проверьте статус Supabase: https://status.supabase.com/
2. Убедитесь, что проект Supabase активен и не заблокирован
3. Проверьте, что IP адреса Vercel не заблокированы в настройках Supabase

### 3. Неверные учетные данные пользователя
**Симптомы:**
- Ошибка появляется только для определенного пользователя
- В консоли: "🔐 Sign in error: Invalid login credentials"

**Решение:**
1. Проверьте, что пользователь зарегистрирован в Supabase:
   ```sql
   -- Выполните в Supabase SQL Editor
   SELECT id, email, email_confirmed_at, created_at 
   FROM auth.users 
   WHERE email = 'user@example.com';
   ```

2. Если пользователь не найден, зарегистрируйте его заново
3. Если email не подтвержден (`email_confirmed_at` = null), отключите требование подтверждения:
   ```
   Supabase Dashboard → Authentication → Settings → Email Auth
   Отключите "Enable email confirmations"
   ```

### 4. Проблемы с RLS (Row Level Security) политиками
**Симптомы:**
- Вход успешен, но появляется ошибка при загрузке профиля
- В консоли: "Error fetching profile"

**Решение:**
1. Проверьте RLS политики для таблицы `profiles`:
   ```sql
   -- Выполните в Supabase SQL Editor
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

2. Убедитесь, что есть политика для SELECT:
   ```sql
   -- Создайте политику если её нет
   CREATE POLICY "Users can view own profile" ON profiles
     FOR SELECT USING (auth.uid() = id);
   ```

3. Временно отключите RLS для тестирования (НЕ для продакшена!):
   ```sql
   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
   ```

### 5. Проблемы с CORS
**Симптомы:**
- CORS ошибки в консоли браузера
- Запросы к Supabase блокируются

**Решение:**
1. Добавьте ваш домен в настройки Supabase:
   ```
   Supabase Dashboard → Settings → API → Site URL
   ```

2. Добавьте домен в список разрешенных Redirect URLs:
   ```
   https://your-app.vercel.app
   https://your-app.vercel.app/auth/callback
   ```

## Как диагностировать проблему

### Шаг 1: Откройте консоль браузера
1. Откройте страницу входа на продакшене
2. Нажмите F12 или Cmd+Option+I (Mac) для открытия DevTools
3. Перейдите на вкладку "Console"

### Шаг 2: Проверьте логи при загрузке страницы
Должны появиться следующие сообщения:
```
🟢 Supabase client created successfully
🔐 Initializing auth...
🔐 User status: None (или Authenticated)
🔐 Auth initialization completed
🔐 Auth loading state cleared
```

Если вместо этого видите:
```
🔴 Supabase configuration error:
❌ Missing
```
→ Проблема в переменных окружения (см. раздел 1)

### Шаг 3: Попробуйте войти и проверьте логи
После нажатия кнопки "Войти" должны появиться:
```
🔐 Attempting sign in...
🔐 Sign in successful (если успешно)
```

Если видите:
```
🔐 Sign in error: ...
🔐 Sign in exception: ...
```
→ Ошибка содержит детальную информацию о проблеме

### Шаг 4: Проверьте вкладку "Network"
1. Перейдите на вкладку "Network" в DevTools
2. Попробуйте войти снова
3. Найдите запрос к `supabase.co` (например, `/auth/v1/token`)
4. Проверьте:
   - **Status Code**: должен быть 200 для успешного входа
   - **Response**: содержит информацию об ошибке
   - **Headers**: проверьте, что отправляется правильный API ключ

## Быстрый чек-лист

- [ ] Переменные окружения установлены на Vercel
- [ ] Проект пересобран после изменения переменных
- [ ] Email пользователя подтвержден (или отключено требование подтверждения)
- [ ] Пользователь существует в таблице `auth.users`
- [ ] RLS политики настроены правильно
- [ ] Домен приложения добавлен в Supabase Settings

## Временное решение для тестирования

Если нужно быстро проверить, что проблема не в переменных окружения, добавьте временный вывод в компонент авторизации:

```typescript
// В src/app/auth/page.tsx, добавьте в начало компонента:
useEffect(() => {
  console.log("Environment check:");
  console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing");
  console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set (first 20 chars): " + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) : "❌ Missing");
}, []);
```

## Контакты для помощи

Если проблема не решается:
1. Проверьте логи Vercel: https://vercel.com/dashboard → Logs
2. Проверьте логи Supabase: https://supabase.com/dashboard → Logs
3. Создайте issue в репозитории проекта с логами из консоли

## Обновления

**Дата последнего обновления:** 2025-10-15
**Версия:** 1.0.0

### Что было изменено в коде:
1. ✅ Добавлено детальное логирование в `useAuth` hook
2. ✅ Добавлена проверка переменных окружения в `createClientComponentClient`
3. ✅ Улучшена обработка ошибок с выводом конкретных сообщений
4. ✅ Добавлены timeout защиты для запросов к Supabase

Эти изменения помогут быстрее найти причину проблемы через логи в консоли браузера.

