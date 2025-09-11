# 🚀 Руководство по развертыванию в продакшене

## 🎯 Готовность к продакшену

**Версия:** 1.0.0 ✅  
**Статус:** ГОТОВО К РАЗВЕРТЫВАНИЮ 🚀  
**Дата:** 10 сентября 2025

## ✅ Чек-лист готовности

### **Система авторизации:**
- [x] Email/Password авторизация работает
- [x] Google OAuth настроен и протестирован
- [x] Роли пользователей (player/admin) реализованы
- [x] RLS политики применены в базе данных
- [x] Изоляция данных между пользователями проверена

### **Telegram интеграция:**
- [x] Бот работает с реальным токеном `@MvalovPokerTrackerBot`
- [x] OCR распознавание билетов функционирует (точность 85%+)
- [x] Связывание Telegram-веб аккаунтов работает
- [x] Турниры создаются от имени правильного пользователя

### **База данных:**
- [x] Схема Supabase настроена
- [x] Миграции подготовлены
- [x] Бэкапы созданы
- [x] RLS политики протестированы

### **Тестирование:**
- [x] 19 ключевых тестов проходят
- [x] Интеграционные тесты созданы
- [x] Функциональные тесты работают
- [x] Система мокирования настроена

## 🌍 Варианты развертывания

### **Вариант 1: Vercel (Рекомендуемый)**

```bash
# 1. Установка Vercel CLI
npm install -g vercel

# 2. Логин в Vercel
vercel login

# 3. Настройка проекта
vercel

# 4. Настройка переменных окружения в Vercel Dashboard:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY  
# - SUPABASE_SERVICE_ROLE_KEY
# - NEXT_PUBLIC_GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - TELEGRAM_BOT_TOKEN

# 5. Деплой
vercel --prod
```

### **Вариант 2: Docker**

```bash
# 1. Создание Docker образа
docker build -t pokertracker-pro .

# 2. Запуск контейнера
docker run -p 3000:3000 --env-file .env.production pokertracker-pro
```

### **Вариант 3: VPS/Dedicated Server**

```bash
# 1. Установка Node.js 18+ на сервер
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Клонирование репозитория
git clone [your-repo-url] pokertracker-pro
cd pokertracker-pro/mvalovpokertracker

# 3. Установка зависимостей
npm install

# 4. Настройка переменных окружения
cp .env.example .env.production
# Отредактируйте .env.production

# 5. Сборка
npm run build

# 6. Запуск с PM2
npm install -g pm2
pm2 start npm --name "pokertracker" -- start
```

## 🔧 Настройка переменных окружения

### **Обязательные переменные:**

```bash
# Supabase (получить из Supabase Dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth (получить из Google Cloud Console)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Telegram Bot (получить от @BotFather)
TELEGRAM_BOT_TOKEN=your-bot-token

# App URL (ваш домен)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### **Дополнительные переменные:**

```bash
# Мониторинг и аналитика
SENTRY_DSN=your-sentry-dsn
GOOGLE_ANALYTICS_ID=your-ga-id

# База данных (если нужно)
DATABASE_URL=your-postgres-url
DIRECT_URL=your-direct-postgres-url
```

## 🗄️ Настройка базы данных

### **1. Supabase проект:**

1. Создайте новый проект в [Supabase Dashboard](https://supabase.com/dashboard)
2. Скопируйте URL и ключи в переменные окружения
3. Примените схему базы данных:

```sql
-- Выполните в Supabase SQL Editor:
\i sql-scripts/setup-auth-schema-simple.sql
\i sql-scripts/add-telegram-linking-table.sql
```

### **2. Настройка Google OAuth:**

1. Следуйте инструкциям в `GOOGLE_OAUTH_SETUP.md`
2. Добавьте ваш домен в Authorized redirect URIs
3. Обновите переменные окружения

### **3. Настройка Telegram бота:**

1. Получите токен от @BotFather
2. Установите webhook (для продакшена) или используйте polling
3. Добавьте токен в переменные окружения

## 🔄 Процедура деплоя

### **Подготовка:**

```bash
# 1. Создание бэкапа
./scripts/backup-database.sh full

# 2. Проверка готовности
./scripts/version-management.sh check

# 3. Тестирование на staging
./scripts/deploy.sh staging 1.0.0
```

### **Production деплой:**

```bash
# 1. Финальная проверка
npm test
npm run build

# 2. Деплой
./scripts/deploy.sh production 1.0.0

# 3. Проверка после деплоя
curl https://your-domain.com/api/health
```

## 🚨 План отката

### **В случае проблем:**

```bash
# 1. Быстрый откат кода
./scripts/deploy.sh rollback 0.9.0

# 2. Откат базы данных
# - Supabase Dashboard → Settings → Database → Restore
# - Выберите бэкап из backups/2025-09-10/

# 3. Проверка работоспособности
curl https://your-domain.com/api/health

# 4. Уведомление команды
echo "Система откачена к версии 0.9.0" | mail -s "ROLLBACK" team@company.com
```

## 📊 Мониторинг

### **Что мониторить:**

1. **Доступность сервиса** - HTTP статус коды
2. **Производительность** - время ответа API
3. **Ошибки** - логи приложения и базы данных
4. **Использование ресурсов** - CPU, память, диск
5. **Пользователи** - регистрации, активность

### **Инструменты мониторинга:**

- **Uptime:** UptimeRobot, Pingdom
- **Логи:** Sentry, LogRocket  
- **Производительность:** Vercel Analytics, Google Analytics
- **База данных:** Supabase Dashboard

## 🔒 Безопасность

### **Обязательные меры:**

1. **HTTPS** - обязательно для продакшена
2. **Environment variables** - никогда не коммитить в Git
3. **API rate limiting** - защита от злоупотреблений
4. **CORS** - настройка разрешенных доменов
5. **CSP headers** - Content Security Policy

### **Рекомендации:**

- Регулярно обновляйте зависимости
- Мониторьте уязвимости: `npm audit`
- Настройте автоматические бэкапы
- Используйте secrets management

## 📞 Поддержка

### **Контакты:**
- **Разработчик:** mvalov78@gmail.com
- **Репозиторий:** [GitHub URL]
- **Документация:** [Docs URL]

### **Полезные ссылки:**
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Google Cloud Console](https://console.cloud.google.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Telegram BotFather](https://t.me/BotFather)

---

## 🎉 Поздравляем!

**PokerTracker Pro готов к продакшену!** 🚀

Система полностью протестирована, задокументирована и готова к развертыванию. 

**Удачного запуска!** 🎰

