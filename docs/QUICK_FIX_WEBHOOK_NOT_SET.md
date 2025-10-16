# Быстрое решение: Webhook URL не настроен

## Проблема
На странице `/admin/bot` написано:
```
Webhook URL: Не настроен
```

И бот не работает.

## Причина
**Переменная окружения `BOT_WEBHOOK_URL` в Vercel НЕ устанавливает webhook автоматически.**

Webhook нужно установить в Telegram API отдельно!

## ⚡ Решение 1: Через UI (самый простой)

### Шаг 1: Откройте страницу администрирования
```
https://your-app.vercel.app/admin/bot
```

### Шаг 2: Нажмите кнопку переключения режима

Даже если показывает "Webhook режим активен", нажмите:
```
🔄 Переключить на Polling
```

Это очистит некорректный webhook.

### Шаг 3: Подождите 5 секунд

Дайте системе переключиться.

### Шаг 4: Переключите обратно на Webhook

Нажмите:
```
🔄 Переключить на Webhook
```

### Шаг 5: Введите правильный URL

Когда появится prompt, введите ваш production URL:
```
https://your-actual-domain.vercel.app/api/telegram/webhook
```

⚠️ **Замените** `your-actual-domain` на ваш реальный домен!

### Шаг 6: Проверьте статус

Страница должна показать:
```
🔗 Webhook режим активен
Бот получает обновления через webhook

Webhook URL: https://your-app.vercel.app/api/telegram/webhook
```

### Шаг 7: Протестируйте бота

Откройте Telegram и отправьте:
```
/start
```

Бот должен ответить **мгновенно**! ⚡

---

## 🛠️ Решение 2: Через скрипты (для опытных)

### Шаг 1: Установите переменные окружения локально

```bash
export TELEGRAM_BOT_TOKEN="your-bot-token"
export BOT_WEBHOOK_URL="https://your-app.vercel.app/api/telegram/webhook"
```

### Шаг 2: Проверьте текущий статус webhook

```bash
cd /Users/mvalov/PokerTracker
./scripts/check-webhook.sh
```

### Шаг 3: Установите webhook

```bash
./scripts/set-webhook.sh
```

**Вы увидите:**
```
✅ Webhook успешно установлен!
📊 Информация о webhook:
{
  "ok": true,
  "result": {
    "url": "https://your-app.vercel.app/api/telegram/webhook",
    "pending_update_count": 0
  }
}
```

### Шаг 4: Проверьте на странице `/admin/bot`

Обновите страницу - должен показать правильный Webhook URL.

---

## 🔍 Решение 3: Через curl (быстрое)

Если у вас есть токен бота, выполните одну команду:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.vercel.app/api/telegram/webhook", "allowed_updates": ["message", "callback_query"]}'
```

**Замените:**
- `<YOUR_BOT_TOKEN>` - на ваш токен бота
- `your-app.vercel.app` - на ваш домен

**Ожидаемый ответ:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

---

## 📋 Проверка после установки

### 1. Проверка через UI
```
https://your-app.vercel.app/admin/bot
```

Должно показать:
- ✅ Режим: Webhook
- ✅ Статус: Активен
- ✅ Webhook URL: https://...
- ✅ Ожидающих обновлений: 0

### 2. Проверка через Telegram API

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

Ответ должен содержать ваш URL:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-app.vercel.app/api/telegram/webhook",
    "pending_update_count": 0
  }
}
```

### 3. Проверка через Telegram

Отправьте боту:
```
/start
```

Ответ должен прийти **мгновенно** (< 1 секунды).

---

## ❓ FAQ

### Q: Почему переменная BOT_WEBHOOK_URL не работает автоматически?

**A:** Переменная окружения используется только **кодом приложения**, но Telegram не знает о ней. Webhook нужно установить через Telegram API отдельно.

### Q: Как часто нужно устанавливать webhook?

**A:** Только один раз! После установки webhook сохраняется в Telegram до тех пор, пока вы его не удалите или не замените.

### Q: Что если я хочу вернуться к polling режиму?

**A:** 

**Через UI:**
```
Откройте /admin/bot → Нажмите "Переключить на Polling"
```

**Через скрипт:**
```bash
./scripts/delete-webhook.sh
```

**Через curl:**
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

### Q: Webhook URL показывает "Не настроен" после переключения

**A:** Подождите 5-10 секунд и нажмите "🔄 Обновить статус" на странице `/admin/bot`.

### Q: Бот все равно не отвечает после установки webhook

**A:** Проверьте:
1. URL правильный и доступен (должен быть HTTPS)
2. `pending_update_count` = 0 (нет накопленных обновлений)
3. Нет ошибок в `last_error_message`
4. Логи Vercel не показывают ошибок

---

## 🎯 Итоговый чеклист

- [ ] Открыл `/admin/bot`
- [ ] Переключил на Polling (для очистки)
- [ ] Переключил на Webhook с правильным URL
- [ ] Проверил статус - показывает Webhook URL
- [ ] Протестировал бота - отвечает мгновенно
- [ ] Проверил через API - pending_update_count = 0
- [ ] Нет ошибок в логах

---

## 🆘 Если ничего не помогает

1. **Проверьте токен бота:**
   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"
   ```
   Должен вернуть информацию о боте.

2. **Проверьте доступность webhook endpoint:**
   ```bash
   curl "https://your-app.vercel.app/api/telegram/webhook"
   ```
   Должен вернуть:
   ```json
   {
     "ok": true,
     "message": "Telegram webhook endpoint is active"
   }
   ```

3. **Проверьте логи Vercel:**
   - Vercel Dashboard → Your Project → Logs
   - Фильтр: `[Telegram Webhook]`

4. **Удалите webhook и переустановите:**
   ```bash
   ./scripts/delete-webhook.sh
   # Подождите 10 секунд
   ./scripts/set-webhook.sh
   ```

---

**Дата:** 16 октября 2025  
**Версия:** v1.3.1  
**Статус:** Актуально

