# 🔧 Конфигурация бота через переменные окружения

> **Простое управление режимом бота через .env файлы**

## 🎯 Обзор новой схемы

### **Почему переменные окружения?**
- ✅ **Простота:** Одно место для всех настроек
- ✅ **Безопасность:** Не хранятся в коде
- ✅ **Гибкость:** Разные настройки для разных сред
- ✅ **Стандарт:** Принятый подход в современной разработке

### **Что изменилось:**
- ❌ **Раньше:** Настройки хранились в базе данных
- ✅ **Теперь:** Настройки читаются из переменных окружения
- 📊 **База данных:** Используется только для мониторинга статуса

## 📝 Переменные окружения

### **Основные настройки бота:**

```bash
# Режим работы бота
BOT_MODE=polling                    # polling | webhook

# URL для webhook (только для webhook режима)
BOT_WEBHOOK_URL=                    # https://your-app.vercel.app/api/bot/webhook

# Автоматический перезапуск при ошибках
BOT_AUTO_RESTART=true               # true | false

# Токен Telegram бота
TELEGRAM_BOT_TOKEN=your-bot-token   # Получить от @BotFather
```

### **Дополнительные настройки:**

```bash
# URL приложения (для автоматического определения webhook)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (для мониторинга и статистики)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🏠 Локальная разработка

### **Файл: `.env.local`**

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your-real-bot-token

# Bot Mode Configuration - POLLING для разработки
BOT_MODE=polling

# Webhook URL (не нужен для polling)
BOT_WEBHOOK_URL=

# Bot Settings
BOT_AUTO_RESTART=true

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **Запуск:**
```bash
npm run dev
# Бот автоматически запустится в polling режиме
```

## 🚀 Продакшен Vercel

### **Настройка переменных в Vercel Dashboard:**

1. **Откройте проект в Vercel Dashboard**
2. **Settings → Environment Variables**
3. **Добавьте переменные:**

```bash
BOT_MODE=webhook
BOT_WEBHOOK_URL=https://your-app.vercel.app/api/bot/webhook
BOT_AUTO_RESTART=true
TELEGRAM_BOT_TOKEN=your-real-bot-token
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. **Redeploy приложение**

### **Автоматический деплой:**
```bash
./scripts/deploy-vercel.sh production 1.0.0
# Скрипт автоматически проверит настройки
```

## 🎮 Использование админ панели

### **URL:** `/admin/bot-management`

### **Что показывает интерфейс:**

#### **📊 Статус панель:**
- **🔄/🔗 Режим:** Текущий режим из `BOT_MODE`
- **✅/❌ Статус:** Активность бота (из БД)
- **⚠️ Ошибки:** Счетчик ошибок (из БД)
- **🔄 Автоперезапуск:** Из `BOT_AUTO_RESTART`

#### **🎯 Кнопки управления:**
- **"📝 Инструкция по настройке"** - показывает как изменить .env
- **"🧪 Тест Webhook"** - проверяет доступность endpoint
- **"🔄 Обновить"** - перезагружает текущий статус

### **Как переключить режим:**

#### **Polling → Webhook:**
1. Нажмите **"📝 Инструкция по настройке"** в секции Webhook
2. Следуйте инструкциям для вашей среды
3. Перезапустите приложение

#### **Webhook → Polling:**
1. Нажмите **"📝 Инструкция по настройке"** в секции Polling
2. Следуйте инструкциям для вашей среды
3. Перезапустите приложение

## ⚡ Быстрые команды

### **Переключение режимов:**

```bash
# Локальная разработка (polling)
echo "BOT_MODE=polling" >> .env.local
npm run dev

# Продакшен (webhook)  
# В Vercel Dashboard: BOT_MODE=webhook + BOT_WEBHOOK_URL=https://...
# Затем redeploy
```

### **Включение автоперезапуска:**

```bash
# Локально
echo "BOT_AUTO_RESTART=true" >> .env.local

# Vercel
# Dashboard: BOT_AUTO_RESTART=true
```

## 🔍 Мониторинг и отладка

### **Логи запуска бота:**

```
🤖 Запуск Telegram бота...
🔧 Режим работы бота из .env: polling
🔄 Автоперезапуск: включен
📊 Настройки синхронизированы с БД
🔄 Запуск в polling режиме...
✅ Telegram бот успешно запущен!
```

### **Проверка настроек:**

```bash
# В админ панели
GET /api/admin/env-settings

# Ответ:
{
  "success": true,
  "envSettings": {
    "bot_mode": "polling",
    "webhook_url": "",
    "auto_restart": true,
    "bot_token": "***настроен***",
    "app_url": "http://localhost:3000"
  },
  "source": "environment_variables"
}
```

## 🔄 Миграция со старой схемы

### **Если у вас была настройка через БД:**

1. **Проверьте текущие настройки в БД:**
   ```sql
   SELECT * FROM bot_settings;
   ```

2. **Перенесите в .env.local:**
   ```bash
   # Из БД bot_mode → BOT_MODE
   # Из БД webhook_url → BOT_WEBHOOK_URL  
   # Из БД auto_restart → BOT_AUTO_RESTART
   ```

3. **Перезапустите приложение:**
   ```bash
   npm run dev
   ```

4. **Проверьте в админ панели** что настройки применились

### **База данных теперь используется только для:**
- ✅ **Мониторинг статуса** бота (active/inactive/error)
- ✅ **Счетчик ошибок** за текущий час
- ✅ **Время последней активности**
- ❌ ~~Хранение настроек~~ (теперь в .env)

## 🎯 Практические примеры

### **Пример 1: Настройка для локальной разработки**

```bash
# .env.local
BOT_MODE=polling
BOT_WEBHOOK_URL=
BOT_AUTO_RESTART=true
TELEGRAM_BOT_TOKEN=7557882997:AAF...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Запуск
npm run dev

# Проверка
curl http://localhost:3000/api/admin/env-settings
```

### **Пример 2: Настройка для Vercel продакшена**

```bash
# Vercel Environment Variables
BOT_MODE=webhook
BOT_WEBHOOK_URL=https://poker-tracker.vercel.app/api/bot/webhook
BOT_AUTO_RESTART=true
TELEGRAM_BOT_TOKEN=7557882997:AAF...
NEXT_PUBLIC_APP_URL=https://poker-tracker.vercel.app

# Деплой
vercel --prod

# Проверка
curl https://poker-tracker.vercel.app/api/admin/env-settings
```

### **Пример 3: Переключение режимов**

```bash
# Разработка: polling → webhook
sed -i 's/BOT_MODE=polling/BOT_MODE=webhook/' .env.local
echo "BOT_WEBHOOK_URL=http://localhost:3000/api/bot/webhook" >> .env.local
npm run dev

# Продакшен: webhook → polling (для отладки)
# В Vercel Dashboard изменить BOT_MODE=polling
# Redeploy
```

## ⚠️ Важные моменты

### **Безопасность:**
- ✅ **Никогда не коммитьте** `.env.local` в git
- ✅ **Используйте** `.env.example` как шаблон
- ✅ **Храните токены** в безопасном месте

### **Производительность:**
- ✅ **Polling:** Простота разработки, больше ресурсов
- ✅ **Webhook:** Мгновенные ответы, меньше ресурсов
- ✅ **Автоперезапуск:** Включайте для продакшена

### **Отладка:**
- ✅ **Логи:** Проверяйте консоль при запуске
- ✅ **Админ панель:** Мониторьте статус в реальном времени
- ✅ **Тестирование:** Используйте кнопку "🧪 Тест Webhook"

## 📋 Чек-лист настройки

### **Локальная разработка:**
- [ ] Создан `.env.local` с настройками
- [ ] `BOT_MODE=polling`
- [ ] `TELEGRAM_BOT_TOKEN` настроен
- [ ] `npm run dev` запускается без ошибок
- [ ] Бот отвечает на `/help` в Telegram
- [ ] Админ панель показывает статус "Активен"

### **Продакшен Vercel:**
- [ ] Переменные добавлены в Vercel Dashboard
- [ ] `BOT_MODE=webhook`
- [ ] `BOT_WEBHOOK_URL` указывает на ваш домен
- [ ] Приложение успешно задеплоено
- [ ] Webhook endpoint отвечает на тесты
- [ ] Бот работает в продакшене

## 🎉 Готово!

Теперь у вас есть **гибкая система конфигурации бота** через переменные окружения:

- ✅ **Простое переключение** между режимами
- ✅ **Безопасное хранение** токенов и настроек  
- ✅ **Разные конфигурации** для разных сред
- ✅ **Визуальный мониторинг** через админ панель
- ✅ **Автоматическая синхронизация** с базой данных

**🚀 Просто настройте .env файл и наслаждайтесь работой бота!** 🤖
