# Быстрое решение: Бот не работает на продакшене (Webhook режим)

## Проблема
На продакшене настроен webhook режим, но бот не работает. Страница `/admin/bot` показывает неправильный статус.

## Быстрое решение (5 минут)

### 1. Откройте страницу администрирования
```
https://your-app.vercel.app/admin/bot
```

### 2. Проверьте текущий статус
Страница теперь показывает **реальный** статус бота из БД и Telegram API:
- Текущий режим (polling или webhook)
- Статус бота (активен/остановлен/ошибка)
- Webhook URL (если webhook режим)
- Ошибки (если есть)

### 3. Переключите на webhook режим (если нужно)

Нажмите кнопку **"🔄 Переключить на Webhook"**

Введите URL:
```
https://your-actual-domain.vercel.app/api/telegram/webhook
```

### 4. Проверьте работу
Отправьте боту команду:
```
/start
```

Бот должен ответить мгновенно.

## Что было исправлено

✅ Создан правильный API endpoint `/api/telegram/webhook` для приема обновлений от Telegram

✅ Страница `/admin/bot` теперь динамически загружает реальный статус бота

✅ Добавлена возможность переключения между polling и webhook режимами

✅ Добавлены переменные окружения `BOT_MODE` и `BOT_WEBHOOK_URL`

✅ Создана документация по настройке webhook

## Настройка переменных окружения на Vercel

В настройках проекта Vercel добавьте/обновите:

```bash
BOT_MODE=webhook
BOT_WEBHOOK_URL=https://your-actual-domain.vercel.app/api/telegram/webhook
TELEGRAM_BOT_TOKEN=your-bot-token
BOT_AUTO_RESTART=true
```

После изменения переменных окружения:
1. Сохраните изменения
2. Переразверните приложение (redeploy)
3. Откройте `/admin/bot` и проверьте статус

## Проверка webhook через Telegram API

```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

Ответ должен содержать:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-app.vercel.app/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

Если `pending_update_count > 0` - есть ожидающие обновления, возможна задержка.

## Если проблема не решена

1. **Проверьте логи Vercel:**
   - Откройте Vercel Dashboard
   - Перейдите в раздел Logs
   - Ищите ошибки с `[Telegram Webhook]`

2. **Проверьте статус на странице `/admin/bot`:**
   - Если `botStatus = error` - смотрите последнюю ошибку
   - Если `pending_update_count > 0` - обновления не обрабатываются

3. **Пересоздайте webhook:**
   - Переключите на polling режим
   - Подождите 10 секунд
   - Переключите обратно на webhook

4. **Проверьте токен бота:**
   ```bash
   curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe
   ```
   
   Должен вернуть информацию о боте.

## Контакты для поддержки

Если проблема не решена, проверьте:
- ✅ HTTPS URL корректный и доступен
- ✅ Сертификат SSL валидный
- ✅ БД настроена и доступна
- ✅ Токен бота корректный

---

**Дата создания:** 16 октября 2025  
**Обновлено:** 16 октября 2025

