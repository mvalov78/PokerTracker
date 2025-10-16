# Автоматическая синхронизация Webhook из переменных окружения

**Дата:** 16 октября 2025  
**Версия:** v1.3.2

## Проблема

После деплоя на Vercel переменная окружения `BOT_WEBHOOK_URL` не устанавливала webhook автоматически в Telegram API. Приходилось вручную вводить URL через UI.

## Решение

Создан новый API endpoint `/api/bot/init` который:
- ✅ Автоматически читает `BOT_MODE` и `BOT_WEBHOOK_URL` из переменных окружения
- ✅ Устанавливает webhook в Telegram API
- ✅ Синхронизирует настройки с БД
- ✅ Проверяет корректность конфигурации

## Использование

### Способ 1: Через UI (рекомендуется)

1. Откройте страницу администрирования:
   ```
   https://your-app.vercel.app/admin/bot
   ```

2. Нажмите кнопку:
   ```
   ⚙️ Синхронизировать из .env
   ```

3. Готово! Webhook автоматически установится из переменной `BOT_WEBHOOK_URL`.

### Способ 2: Через API

```bash
curl -X POST https://your-app.vercel.app/api/bot/init
```

**Ответ при успехе:**
```json
{
  "success": true,
  "message": "Бот инициализирован в webhook режиме",
  "mode": "webhook",
  "webhookUrl": "https://your-app.vercel.app/api/telegram/webhook",
  "webhookInfo": {
    "url": "https://your-app.vercel.app/api/telegram/webhook",
    "pending_update_count": 0
  }
}
```

### Способ 3: Проверка конфигурации

Проверить текущую конфигурацию без изменений:

```bash
curl https://your-app.vercel.app/api/bot/init
```

**Ответ:**
```json
{
  "success": true,
  "environment": {
    "BOT_MODE": "webhook",
    "BOT_WEBHOOK_URL": "https://your-app.vercel.app/api/telegram/webhook",
    "TELEGRAM_BOT_TOKEN": "✅ установлен"
  },
  "telegram": {
    "webhookInfo": {
      "url": "https://your-app.vercel.app/api/telegram/webhook",
      "pending_update_count": 0
    }
  },
  "recommendation": "✅ Конфигурация корректна"
}
```

## Переменные окружения

В Vercel Project Settings → Environment Variables настройте:

```bash
# Режим работы бота
BOT_MODE=webhook

# Webhook URL (автоматически используется при инициализации)
BOT_WEBHOOK_URL=https://your-app.vercel.app/api/telegram/webhook

# Токен бота
TELEGRAM_BOT_TOKEN=your-bot-token

# Автоматический перезапуск
BOT_AUTO_RESTART=true
```

## Когда использовать

### После деплоя на Vercel
```bash
# Сразу после деплоя вызовите
curl -X POST https://your-app.vercel.app/api/bot/init
```

Или откройте `/admin/bot` и нажмите **"⚙️ Синхронизировать из .env"**

### После изменения переменных окружения

Если вы изменили `BOT_WEBHOOK_URL` в Vercel:
1. Переразверните приложение (redeploy)
2. Нажмите "⚙️ Синхронизировать из .env"

### При проблемах с webhook

Если webhook показывает ошибки:
1. Проверьте переменные окружения
2. Нажмите "⚙️ Синхронизировать из .env"
3. Проверьте статус

## Логика работы

### POST /api/bot/init

```
1. Читает BOT_MODE из .env
   ├─ Если BOT_MODE=webhook и BOT_WEBHOOK_URL задан
   │  ├─ Устанавливает webhook в Telegram API
   │  ├─ Обновляет настройки в БД
   │  └─ Возвращает успех
   │
   ├─ Если BOT_MODE=polling
   │  ├─ Удаляет webhook из Telegram
   │  ├─ Обновляет настройки в БД
   │  └─ Возвращает успех
   │
   └─ Если BOT_MODE=webhook но BOT_WEBHOOK_URL не задан
      └─ Возвращает ошибку с инструкциями
```

### GET /api/bot/init

```
1. Читает переменные окружения
2. Получает webhookInfo из Telegram API
3. Получает настройки из БД
4. Сравнивает и возвращает рекомендации
```

## Преимущества

✅ **Автоматизация** - Не нужно вручную вводить URL  
✅ **Безопасность** - URL берется из защищенных переменных окружения  
✅ **Консистентность** - Всегда используется актуальный URL из .env  
✅ **Простота** - Одна кнопка после деплоя  
✅ **Проверка** - Можно проверить конфигурацию через GET запрос  

## Автоматизация через Vercel Deploy Hooks

Можно настроить автоматический вызов после деплоя:

### Вариант 1: Deploy Hook с последующим вызовом

1. В Vercel Project Settings → Git создайте Deploy Hook
2. Настройте GitHub Action:

```yaml
# .github/workflows/deploy.yml
name: Deploy and Init Bot

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Vercel Deploy
        run: curl -X POST ${{ secrets.VERCEL_DEPLOY_HOOK }}
      
      - name: Wait for deploy
        run: sleep 60
      
      - name: Initialize Bot
        run: curl -X POST https://your-app.vercel.app/api/bot/init
```

### Вариант 2: Custom Build Command

В Vercel Project Settings → Build & Development Settings:

```bash
# Build Command
npm run build && curl -X POST https://your-app.vercel.app/api/bot/init
```

## Мониторинг

После синхронизации проверьте:

1. **Статус на /admin/bot:**
   - ✅ Режим: Webhook
   - ✅ Статус: Активен
   - ✅ Webhook URL совпадает с BOT_WEBHOOK_URL
   - ✅ Ожидающих обновлений: 0

2. **Тест бота:**
   ```
   /start
   ```
   Должен ответить мгновенно

3. **Логи Vercel:**
   ```
   🔗 Настройка webhook режима...
   ✅ Webhook установлен: https://...
   📊 Настройки обновлены в БД
   ```

## Troubleshooting

### Ошибка: "TELEGRAM_BOT_TOKEN not found"

**Решение:** Установите переменную окружения в Vercel:
```bash
TELEGRAM_BOT_TOKEN=your-bot-token
```

### Ошибка: "BOT_MODE=webhook но BOT_WEBHOOK_URL не задан"

**Решение:** Установите переменную окружения в Vercel:
```bash
BOT_WEBHOOK_URL=https://your-app.vercel.app/api/telegram/webhook
```

### Webhook установлен но бот не отвечает

**Проверьте:**
1. URL доступен (GET /api/telegram/webhook должен вернуть OK)
2. `pending_update_count` = 0
3. Нет ошибок в `last_error_message`
4. SSL сертификат валидный

### "Webhook URL не совпадает с BOT_WEBHOOK_URL"

**Решение:** Нажмите "⚙️ Синхронизировать из .env" чтобы обновить.

## API Reference

### POST /api/bot/init

Инициализирует бота с настройками из переменных окружения.

**Response:**
```typescript
{
  success: boolean
  message: string
  mode: 'webhook' | 'polling'
  webhookUrl?: string
  webhookInfo?: TelegramWebhookInfo
  error?: string
}
```

### GET /api/bot/init

Возвращает текущую конфигурацию и рекомендации.

**Response:**
```typescript
{
  success: boolean
  environment: {
    BOT_MODE: string
    BOT_WEBHOOK_URL: string
    TELEGRAM_BOT_TOKEN: string
  }
  telegram: {
    webhookInfo: TelegramWebhookInfo
  }
  database: BotSettings | null
  recommendation: string
}
```

## История изменений

### v1.3.2 - 16 октября 2025
- ✅ Создан `/api/bot/init` endpoint
- ✅ Добавлена кнопка "Синхронизировать из .env" в UI
- ✅ Добавлена проверка конфигурации (GET endpoint)
- ✅ Документация AUTO_WEBHOOK_SYNC.md

---

**Автор:** AI Assistant  
**Дата:** 16 октября 2025  
**Статус:** ✅ Готово к использованию

