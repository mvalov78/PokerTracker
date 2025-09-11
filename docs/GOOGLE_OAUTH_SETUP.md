# Настройка Google OAuth для PokerTracker

## Пошаговая инструкция по настройке Google OAuth

### 1. Создание проекта в Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект:
   - Нажмите на выпадающий список проектов вверху страницы
   - Нажмите "New Project"
   - Введите название: "PokerTracker Auth" 
   - Нажмите "Create"

### 2. Настройка OAuth consent screen

1. В боковом меню выберите "APIs & Services" → "OAuth consent screen"
2. Выберите "External" (для публичного использования)
3. Заполните обязательные поля:
   - **App name**: PokerTracker
   - **User support email**: Ваш email
   - **App logo**: (опционально - логотип приложения)
   - **App domain**: Ваш домен (например, pokertacker.com)
   - **Authorized domains**: добавьте ваш домен
   - **Developer contact information**: Ваш email

4. Нажмите "Save and Continue"

5. На странице "Scopes":
   - Нажмите "Add or Remove Scopes"
   - Добавьте следующие scopes:
     - `../auth/userinfo.email`
     - `../auth/userinfo.profile`
   - Нажмите "Update" и "Save and Continue"

6. На странице "Test users" (если ваше приложение в режиме тестирования):
   - Добавьте email-адреса тестовых пользователей
   - Нажмите "Save and Continue"

### 3. Создание OAuth 2.0 Client ID

1. В боковом меню выберите "APIs & Services" → "Credentials"
2. Нажмите "Create Credentials" → "OAuth 2.0 Client ID"
3. Выберите "Web application"
4. Настройте параметры:
   - **Name**: PokerTracker Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (для разработки)
     - `https://yourdomain.com` (для продакшена)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/callback` (для разработки)
     - `https://yourdomain.com/auth/callback` (для продакшена)

5. Нажмите "Create"
6. Скопируйте Client ID и Client Secret

### 4. Настройка в Supabase

1. Перейдите в ваш проект Supabase
2. Выберите "Authentication" → "Providers"
3. Найдите "Google" и включите его
4. Введите данные:
   - **Client ID**: Скопированный из Google Cloud Console
   - **Client Secret**: Скопированный из Google Cloud Console
5. Скопируйте "Redirect URL" из Supabase
6. Вернитесь в Google Cloud Console и добавьте этот URL в "Authorized redirect URIs"

### 5. Настройка переменных окружения

Создайте файл `.env.local` в папке `mvalovpokertracker/`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 6. Тестирование

1. Запустите приложение: `npm run dev`
2. Перейдите на `http://localhost:3000/auth`
3. Нажмите "Войти через Google"
4. Должно открыться окно OAuth Google
5. После успешной авторизации вас должно перенаправить обратно в приложение

### 7. Создание первого администратора

После успешной авторизации:

1. Откройте Supabase SQL Editor
2. Выполните команду:
```sql
SELECT public.create_admin_user('your-email@gmail.com');
```

Замените `your-email@gmail.com` на email, с которым вы авторизовались через Google.

### Возможные проблемы и решения

#### Ошибка "redirect_uri_mismatch"
- Убедитесь, что URL точно совпадают в Google Cloud Console и в вашем приложении
- Проверьте что нет лишних слэшей в конце URL

#### Ошибка "invalid_client"
- Проверьте правильность Client ID в переменных окружения
- Убедитесь что Client ID скопирован полностью

#### OAuth consent screen не отображается
- Убедитесь что ваш email добавлен в тестовые пользователи (если приложение в режиме тестирования)
- Проверьте настройки OAuth consent screen

#### Пользователь создается но не может войти
- Проверьте что триггер `handle_new_user` создается корректно при выполнении SQL схемы
- Убедитесь что RLS политики настроены правильно

### Финальная проверка

После настройки убедитесь что:

1. ✅ Пользователи могут регистрироваться через email/пароль
2. ✅ Пользователи могут входить через Google OAuth  
3. ✅ Создаются профили пользователей автоматически
4. ✅ Middleware защищает маршруты от неавторизованных пользователей
5. ✅ Администраторы имеют доступ к админ-панели
6. ✅ Обычные пользователи не могут попасть в админ-панель
7. ✅ Изоляция данных работает корректно (пользователи видят только свои данные)
