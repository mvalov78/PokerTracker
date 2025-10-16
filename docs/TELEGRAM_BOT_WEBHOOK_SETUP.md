# Настройка Telegram бота в Webhook режиме для продакшена

## Проблема

На продакшене бот должен работать в **webhook режиме**, но страница администрирования показывала статическую информацию о polling режиме.

## Решение

### 1. Создан API endpoint для webhook от Telegram

**Endpoint:** `/api/telegram/webhook`

Telegram отправляет обновления на этот URL когда бот работает в webhook режиме.

### 2. Обновлена страница администрирования бота

**Страница:** `/admin/bot`

Теперь страница:
- ✅ Динамически загружает реальный статус бота
- ✅ Показывает текущий режим работы (polling или webhook)
- ✅ Отображает детали webhook (URL, ошибки, ожидающие обновления)
- ✅ Позволяет переключаться между режимами
- ✅ Автоматически обновляет статус каждые 30 секунд

### 3. Добавлены переменные окружения

В `.env` файле добавьте:

```bash
# Режим работы бота: "polling" или "webhook"
BOT_MODE=webhook

# Публичный HTTPS URL для webhook
BOT_WEBHOOK_URL=https://your-app.vercel.app/api/telegram/webhook

# Автоматический перезапуск при ошибках
BOT_AUTO_RESTART=true
```

## Инструкция по настройке Webhook для продакшена

### Шаг 1: Настройте переменные окружения на Vercel

В настройках проекта Vercel добавьте:

```bash
BOT_MODE=webhook
BOT_WEBHOOK_URL=https://your-actual-domain.vercel.app/api/telegram/webhook
TELEGRAM_BOT_TOKEN=your-bot-token
```

### Шаг 2: Переключите режим через админ-панель

1. Откройте страницу `/admin/bot`
2. Нажмите кнопку **"🔄 Переключить на Webhook"**
3. Введите URL: `https://your-actual-domain.vercel.app/api/telegram/webhook`
4. Система автоматически:
   - Установит webhook в Telegram
   - Обновит настройки в БД
   - Покажет статус webhook

### Шаг 3: Проверьте статус

На странице `/admin/bot` вы увидите:

```
📡 Статус Бота
🔗 Webhook режим активен
   Бот получает обновления через webhook

Режим: Webhook
Статус: Активен
Webhook URL: https://your-app.vercel.app/api/telegram/webhook
```

### Шаг 4: Проверьте работу бота

Отправьте команду боту в Telegram:
```
/start
```

Бот должен ответить мгновенно (в отличие от polling режима с задержками).

## Проверка webhook через Telegram API

Вы можете проверить текущий webhook URL напрямую:

```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

Ответ покажет:
- `url` - текущий webhook URL
- `pending_update_count` - количество ожидающих обновлений
- `last_error_date` и `last_error_message` - информация об ошибках (если есть)

## Удаление webhook (возврат к polling)

Если нужно вернуться к polling режиму:

1. Откройте `/admin/bot`
2. Нажмите **"🔄 Переключить на Polling"**
3. Подтвердите действие
4. Система автоматически удалит webhook из Telegram

Или через API:

```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook
```

## Отличия режимов

### Polling режим (🔄)
- ✅ Простая настройка
- ✅ Работает локально
- ❌ Больше нагрузки на сервер
- ❌ Задержки в ответах (до 30 сек)
- 💡 Рекомендуется для разработки

### Webhook режим (🔗)
- ✅ Мгновенные ответы
- ✅ Меньше нагрузки на сервер
- ❌ Требует публичный HTTPS URL
- ❌ Не работает локально
- 💡 Рекомендуется для продакшена

## Диагностика проблем

### Проблема: Webhook показывает ошибки

Проверьте логи на странице `/admin/bot`. Возможные причины:
- Неправильный URL (должен быть HTTPS)
- Проблемы с сертификатом SSL
- Endpoint недоступен

### Проблема: Бот не отвечает

1. Проверьте статус на `/admin/bot`
2. Убедитесь, что `botStatus = active`
3. Проверьте `pending_update_count` - если > 0, есть задержка
4. Проверьте логи сервера

### Проблема: Переключение режима не работает

Убедитесь, что:
- БД настроена и доступна
- Таблица `bot_settings` существует
- `TELEGRAM_BOT_TOKEN` корректный

## API Endpoints

### GET `/api/admin/bot-mode`
Получить текущий режим и статус бота

**Ответ:**
```json
{
  "success": true,
  "currentMode": "webhook",
  "botStatus": "active",
  "webhookInfo": {
    "url": "https://...",
    "pending_update_count": 0
  }
}
```

### POST `/api/admin/bot-mode`
Переключить режим бота

**Запрос:**
```json
{
  "mode": "webhook",
  "webhookUrl": "https://your-app.vercel.app/api/telegram/webhook"
}
```

### POST `/api/telegram/webhook`
Endpoint для получения обновлений от Telegram (вызывается самим Telegram)

## Мониторинг

Страница `/admin/bot` автоматически обновляется каждые 30 секунд и показывает:
- Текущий режим работы
- Статус бота (активен/остановлен/ошибка)
- Webhook URL (если webhook режим)
- Количество ожидающих обновлений
- Последние ошибки (если есть)

## Рекомендации для продакшена

1. ✅ Используйте webhook режим
2. ✅ Настройте `BOT_AUTO_RESTART=true`
3. ✅ Регулярно проверяйте страницу `/admin/bot`
4. ✅ Мониторьте `pending_update_count` (должен быть 0)
5. ✅ Проверяйте логи на наличие ошибок

## Обновлено

- **Дата:** 16 октября 2025
- **Версия:** 1.0.0
- **Автор:** AI Assistant

---

**Примечание:** После настройки webhook режима, бот будет получать обновления мгновенно без задержек, что критично для хорошего UX на продакшене.

