# 🚀 Развертывание PokerTracker Pro на Vercel

> **Пошаговое руководство по развертыванию в продакшене на платформе Vercel**

## 🎯 Преимущества Vercel

- **🚀 Автоматический деплой** из GitHub
- **🌐 Global CDN** для быстрой загрузки
- **📊 Встроенная аналитика** и мониторинг
- **🔄 Automatic HTTPS** и SSL сертификаты
- **⚡ Serverless Functions** для API
- **🎛️ Environment Variables** управление

## 📋 Предварительные требования

### **1️⃣ Аккаунты и сервисы:**
- [x] GitHub аккаунт с репозиторием PokerTracker (✅ готово)
- [ ] Vercel аккаунт (бесплатный)
- [ ] Supabase проект для продакшена
- [ ] Google Cloud Console проект
- [ ] Telegram Bot токен для продакшена

### **2️⃣ Подготовка кода:**
- [x] Код в GitHub (✅ уже готово)
- [x] Тесты проходят (✅ 42 теста)
- [x] Документация готова (✅ 15 файлов)
- [x] Система версионирования (✅ v1.0.0)

## 🚀 Пошаговое развертывание

### **Шаг 1: Создание Vercel проекта**

1. **Перейдите на [vercel.com](https://vercel.com)**
2. **Войдите через GitHub** аккаунт
3. **Нажмите "New Project"**
4. **Выберите репозиторий** `PokerTracker`
5. **Настройте проект:**
   - **Project Name:** `pokertracker-pro`
   - **Framework:** Next.js (автоматически определится)
   - **Root Directory:** `mvalovpokertracker`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### **Шаг 2: Настройка переменных окружения**

В **Vercel Dashboard** → **Settings** → **Environment Variables** добавьте:

#### **🔐 Supabase (обязательно):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
```

#### **🌐 Google OAuth (обязательно):**
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### **🤖 Telegram Bot (обязательно):**
```bash
TELEGRAM_BOT_TOKEN=your-production-bot-token
```

#### **🌍 App URL (обязательно):**
```bash
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

### **Шаг 3: Создание продакшен Supabase проекта**

1. **Откройте [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Создайте новый проект:**
   - **Name:** `pokertracker-prod`
   - **Database Password:** Сильный пароль
   - **Region:** Ближайший к пользователям

3. **Примените схему базы данных:**
   ```sql
   -- Выполните в Supabase SQL Editor:
   \i sql-scripts/setup-auth-schema-simple.sql
   \i sql-scripts/add-telegram-linking-table.sql
   ```

4. **Настройте Google OAuth:**
   - **Authentication** → **Providers** → **Google**
   - Включите Google provider
   - Добавьте Client ID и Secret

5. **Настройте URL Redirect:**
   - **Site URL:** `https://your-vercel-domain.vercel.app`
   - **Redirect URLs:** `https://your-vercel-domain.vercel.app/auth/callback`

### **Шаг 4: Настройка Google OAuth для продакшена**

1. **Откройте [Google Cloud Console](https://console.cloud.google.com)**
2. **Перейдите в APIs & Services → Credentials**
3. **Обновите OAuth 2.0 Client:**
   - **Authorized JavaScript origins:**
     - `https://your-vercel-domain.vercel.app`
   - **Authorized redirect URIs:**
     - `https://your-supabase-project.supabase.co/auth/v1/callback`

### **Шаг 5: Создание продакшен Telegram бота**

1. **Откройте [@BotFather](https://t.me/BotFather) в Telegram**
2. **Создайте нового бота:**
   ```
   /newbot
   PokerTracker Pro Production
   PokerTrackerProdBot
   ```
3. **Скопируйте токен** и добавьте в Vercel Environment Variables

### **Шаг 6: Первый деплой**

1. **В Vercel Dashboard нажмите "Deploy"**
2. **Дождитесь завершения сборки** (2-3 минуты)
3. **Проверьте статус деплоя** - должен быть "Ready"
4. **Получите URL:** `https://your-project-name.vercel.app`

## 🔧 Настройка Telegram Webhook

После успешного деплоя настройте webhook для Telegram бота:

### **Установка webhook:**

```bash
# Замените YOUR_BOT_TOKEN и YOUR_VERCEL_URL
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://YOUR_VERCEL_URL.vercel.app/api/bot/webhook",
    "allowed_updates": ["message", "callback_query"]
  }'
```

### **Проверка webhook:**

```bash
# Проверка статуса
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"

# Проверка endpoint
curl "https://YOUR_VERCEL_URL.vercel.app/api/bot/webhook"
```

## ✅ Проверка после деплоя

### **1️⃣ Основные функции:**
- [ ] Откройте `https://your-vercel-url.vercel.app`
- [ ] Проверьте регистрацию через email
- [ ] Проверьте Google OAuth
- [ ] Создайте тестовый турнир
- [ ] Проверьте админ панель

### **2️⃣ Telegram бот:**
- [ ] Найдите вашего продакшен бота в Telegram
- [ ] Проверьте команду `/start`
- [ ] Проверьте команду `/help`
- [ ] Протестируйте связывание аккаунтов `/link`
- [ ] Отправьте фото билета для OCR

### **3️⃣ API endpoints:**
```bash
# Проверка здоровья API
curl "https://your-vercel-url.vercel.app/api/tournaments"

# Проверка Telegram webhook
curl "https://your-vercel-url.vercel.app/api/bot/webhook"
```

## 🔧 Настройка домена (опционально)

### **Пользовательский домен:**

1. **В Vercel Dashboard** → **Settings** → **Domains**
2. **Добавьте ваш домен:** `pokertracker.com`
3. **Настройте DNS записи** согласно инструкциям Vercel
4. **Обновите переменные окружения:**
   ```bash
   NEXT_PUBLIC_APP_URL=https://pokertracker.com
   ```

### **Обновление OAuth redirect URLs:**

После настройки домена обновите:
- **Google Cloud Console** → Authorized origins
- **Supabase** → Site URL и Redirect URLs

## 📊 Мониторинг и аналитика

### **Встроенная аналитика Vercel:**

1. **Vercel Dashboard** → **Analytics**
2. **Включите Web Analytics:**
   ```bash
   # Добавьте в Environment Variables
   VERCEL_ANALYTICS_ID=your-analytics-id
   ```

### **Мониторинг ошибок:**

1. **Настройте Sentry** (рекомендуется):
   ```bash
   npm install @sentry/nextjs
   ```

2. **Добавьте переменную:**
   ```bash
   SENTRY_DSN=your-sentry-dsn
   ```

## 🚨 Troubleshooting

### **Частые проблемы:**

#### **Ошибка сборки:**
```bash
# Проверьте локально
npm run build

# Проверьте переменные окружения в Vercel
# Убедитесь что все обязательные переменные установлены
```

#### **Ошибки Supabase:**
```bash
# Проверьте URL и ключи
# Убедитесь что продакшен проект Supabase создан
# Проверьте что схема БД применена
```

#### **Проблемы с Telegram:**
```bash
# Проверьте токен бота
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getMe"

# Проверьте webhook
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

## 🔄 Автоматические деплои

### **Настройка Git интеграции:**

1. **Vercel автоматически настроит** деплой из GitHub
2. **Каждый push в main** → автоматический деплой
3. **Pull Request** → preview deployment
4. **Git теги** → production releases

### **Настройка ветки для продакшена:**

1. **Vercel Dashboard** → **Settings** → **Git**
2. **Production Branch:** `main`
3. **Preview Branches:** `dev`, `staging`

## 📋 Чек-лист деплоя

### **Перед деплоем:**
- [ ] Создан продакшен Supabase проект
- [ ] Схема БД применена
- [ ] Google OAuth настроен для нового домена
- [ ] Продакшен Telegram бот создан
- [ ] Все переменные окружения установлены в Vercel
- [ ] Локальные тесты проходят

### **После деплоя:**
- [ ] Приложение открывается без ошибок
- [ ] Регистрация работает
- [ ] Google OAuth функционирует
- [ ] Telegram бот отвечает
- [ ] OCR распознавание работает
- [ ] Создание турниров функционирует
- [ ] Админ панель доступна

### **Финальная проверка:**
- [ ] Создайте тестового пользователя
- [ ] Свяжите Telegram аккаунт
- [ ] Создайте турнир через бота
- [ ] Проверьте что турнир появился в веб-интерфейсе
- [ ] Добавьте результат турнира

## 🎯 Оптимизация для продакшена

### **Performance:**
- ✅ **Automatic optimization** Vercel
- ✅ **Image optimization** встроенная
- ✅ **Static generation** где возможно
- ✅ **Edge Functions** для API

### **Security:**
- ✅ **HTTPS** автоматически
- ✅ **Environment variables** защищены
- ✅ **CORS** настроен
- ✅ **Rate limiting** через Vercel

## 🆘 Поддержка и мониторинг

### **Логи и отладка:**
- **Vercel Dashboard** → **Functions** → View Logs
- **Real-time logs** во время разработки
- **Error tracking** через Sentry

### **Производительность:**
- **Vercel Analytics** для метрик
- **Core Web Vitals** мониторинг
- **API response times** отслеживание

## 💰 Стоимость

### **Vercel Pricing:**
- **Hobby Plan:** Бесплатно
  - 100GB bandwidth
  - 1000 serverless function invocations
  - Подходит для начала

- **Pro Plan:** $20/месяц
  - Unlimited bandwidth
  - Unlimited functions
  - Advanced analytics
  - Рекомендуется для продакшена

### **Supabase Pricing:**
- **Free Plan:** Бесплатно
  - 50,000 monthly active users
  - 500MB database
  - Подходит для старта

- **Pro Plan:** $25/месяц
  - 100,000 monthly active users
  - 8GB database
  - Daily backups

## 🎉 Готово!

После выполнения всех шагов у вас будет:

- ✅ **Живое приложение** на Vercel
- ✅ **Автоматические деплои** из GitHub
- ✅ **Продакшен база данных** на Supabase
- ✅ **Рабочий Telegram бот**
- ✅ **Google OAuth** авторизация
- ✅ **Мониторинг и аналитика**

## 🔗 Полезные ссылки

- **Vercel Dashboard:** [vercel.com/dashboard](https://vercel.com/dashboard)
- **Supabase Dashboard:** [supabase.com/dashboard](https://supabase.com/dashboard)
- **Google Cloud Console:** [console.cloud.google.com](https://console.cloud.google.com)
- **Telegram BotFather:** [@BotFather](https://t.me/BotFather)

---

## 🆘 Помощь

**Если что-то не работает:**
1. Проверьте переменные окружения в Vercel
2. Проверьте логи в Vercel Dashboard → Functions
3. Убедитесь что Supabase схема применена
4. Проверьте настройки Google OAuth
5. Обратитесь за помощью: mvalov78@gmail.com

**🚀 Удачного деплоя! Ваш PokerTracker Pro готов покорять мир! 🎰**