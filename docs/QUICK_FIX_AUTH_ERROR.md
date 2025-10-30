# Быстрое решение ошибки входа на продакшене

## 🚨 Проблема
Ошибка "Произошла непредвиденная ошибка" при входе на продакшене.

## ⚡ Немедленные действия

### 1. Откройте консоль браузера (1 минута)
1. Перейдите на сайт: https://ваш-сайт.vercel.app/auth
2. Нажмите `F12` (Windows/Linux) или `Cmd+Option+I` (Mac)
3. Перейдите на вкладку **Console**
4. Попробуйте войти
5. **Скопируйте все сообщения из консоли**

### 2. Что искать в консоли

#### ✅ Если видите это - всё работает:
```
🟢 Supabase client created successfully
🔐 Attempting sign in...
🔐 Sign in successful
```

#### ❌ Если видите это - проблема в переменных окружения:
```
🔴 Supabase configuration error:
NEXT_PUBLIC_SUPABASE_URL: ❌ Missing
NEXT_PUBLIC_SUPABASE_ANON_KEY: ❌ Missing
```
→ **Переходите к шагу 3**

#### ❌ Если видите это - проблема с учетными данными:
```
🔐 Sign in error: Invalid login credentials
```
→ **Переходите к шагу 4**

### 3. Проверка переменных окружения на Vercel (5 минут)

1. Откройте Vercel Dashboard: https://vercel.com/dashboard
2. Выберите ваш проект
3. Перейдите: **Settings → Environment Variables**
4. Проверьте наличие этих переменных:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```

#### Если переменных нет:
1. Откройте Supabase Dashboard: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите: **Settings → API**
4. Скопируйте значения:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
5. Добавьте их в Vercel (все Environment: Production, Preview, Development)
6. **Важно!** Нажмите **Redeploy** в разделе Deployments

### 4. Проверка пользователя в Supabase (2 минуты)

1. Откройте Supabase Dashboard
2. Перейдите: **Authentication → Users**
3. Найдите вашего пользователя по email
4. Проверьте:
   - ✅ Пользователь есть в списке
   - ✅ Email подтвержден (столбец "Verified")

#### Если email не подтвержден:
1. Перейдите: **Authentication → Providers → Email**
2. Отключите: **"Confirm email"**
3. Сохраните изменения

#### Если пользователя нет:
1. Зарегистрируйтесь заново на продакшене
2. ИЛИ создайте пользователя вручную в Supabase

### 5. Проверка Site URL в Supabase (1 минута)

1. Откройте Supabase Dashboard
2. Перейдите: **Authentication → URL Configuration**
3. Проверьте:
   - **Site URL**: `https://ваш-сайт.vercel.app`
   - **Redirect URLs**: 
     ```
     https://ваш-сайт.vercel.app/**
     ```

## 🔄 После изменений

**Обязательно выполните:**
1. В Vercel: **Deployments → Redeploy** (с текущей версии)
2. Очистите кэш браузера: `Ctrl+Shift+R` (Windows) или `Cmd+Shift+R` (Mac)
3. Попробуйте войти снова

## 📊 Отправка деталей для помощи

Если проблема не решена, скопируйте эту информацию:

```
### Информация о проблеме
- URL сайта: [ваш_url.vercel.app]
- Дата/время проблемы: [укажите]
- Email пользователя: [укажите]

### Логи из консоли браузера:
[вставьте сюда все логи из Console]

### Статус переменных окружения:
- NEXT_PUBLIC_SUPABASE_URL: [✅ установлена / ❌ отсутствует]
- NEXT_PUBLIC_SUPABASE_ANON_KEY: [✅ установлена / ❌ отсутствует]
- SUPABASE_SERVICE_ROLE_KEY: [✅ установлена / ❌ отсутствует]

### Network tab (если есть ошибки):
[скриншот или описание ошибок из вкладки Network]
```

## 📝 Дополнительные ресурсы

Подробная документация: [docs/PRODUCTION_AUTH_DEBUG.md](./PRODUCTION_AUTH_DEBUG.md)

## ✅ Частые решения

| Проблема | Решение |
|----------|---------|
| Missing environment variables | Добавить переменные на Vercel + Redeploy |
| Invalid login credentials | Проверить существование пользователя в Supabase |
| CORS errors | Добавить URL в Supabase Settings |
| Email not confirmed | Отключить "Confirm email" в Supabase |
| Timeout errors | Проверить статус Supabase: status.supabase.com |

---

**Время на диагностику:** 5-10 минут  
**Обновлено:** 2025-10-15

