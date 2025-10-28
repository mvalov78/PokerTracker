# Исправление ошибки "❌ Ошибка получения списка турниров" на продакшене

## Проблема

Команда `/tournaments` (и другие команды бота) выдают ошибку на продакшене, хотя локально работают нормально.

**Причина:** Бот использовал хардкодные URL `http://localhost:3000`, которые не работают на продакшене.

## Решение

### 1. Что было исправлено в коде

✅ Все хардкодные URLs в `src/bot/commands.ts` заменены на динамическое получение URL из переменных окружения:

```typescript
function getApiUrl(): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  
  // Если URL начинается с http/https - используем как есть
  if (appUrl.startsWith("http")) {
    return appUrl;
  }
  
  // Иначе добавляем https протокол (для Vercel URL)
  return `https://${appUrl}`;
}
```

Это теперь используется во всех местах:
- `/link` - связывание с веб-аккаунтом
- `/result` - добавление результатов
- `/stats` - получение статистики
- `/tournaments` - список турниров
- Создание турниров через API

### 2. Настройка переменных окружения на Vercel

Нужно добавить переменную окружения на Vercel:

#### Вариант 1: Через веб-интерфейс Vercel

1. Откройте проект на [Vercel Dashboard](https://vercel.com/dashboard)
2. Перейдите в **Settings** → **Environment Variables**
3. Добавьте новую переменную:
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://your-app.vercel.app
   ```
   (Замените `your-app.vercel.app` на реальный URL вашего приложения)

4. Выберите **Production**, **Preview**, **Development** (все окружения)
5. Нажмите **Save**
6. **Redeploy** приложение для применения изменений

#### Вариант 2: Через Vercel CLI

```bash
# Добавляем переменную окружения
vercel env add NEXT_PUBLIC_API_URL production

# При запросе введите: https://your-app.vercel.app
```

### 3. Альтернатива: Использование NEXT_PUBLIC_APP_URL

Если у вас уже есть переменная `NEXT_PUBLIC_APP_URL`, можно просто установить её:

```bash
vercel env add NEXT_PUBLIC_APP_URL production
# Введите: https://your-app.vercel.app
```

Бот будет использовать эту переменную автоматически.

### 4. Проверка настроек

После деплоя можно проверить, что переменные окружения доступны боту:

```bash
# В логах Vercel должно быть:
🌐 API URL: https://your-app.vercel.app
```

### 5. Перезапуск бота

После обновления переменных окружения и деплоя:

1. Бот автоматически перезапустится при следующем деплое
2. Или можно перезапустить его через админ панель: `/admin/bot`
3. Или через API:
   ```bash
   curl -X POST https://your-app.vercel.app/api/bot/restart
   ```

## Проверка работы

После применения исправлений протестируйте команды бота:

```
/tournaments - должен показать список турниров
/stats - должен показать статистику
/result - должен работать для добавления результатов
```

## Технические детали

### Приоритет переменных окружения:

1. `NEXT_PUBLIC_API_URL` - специально для API запросов
2. `NEXT_PUBLIC_APP_URL` - общий URL приложения  
3. `VERCEL_URL` - автоматически устанавливается Vercel
4. `http://localhost:3000` - fallback для локальной разработки

### Исправленные файлы:

- ✅ `/src/bot/commands.ts` - все команды бота
- ✅ `/src/bot/handlers/photoHandler.ts` - уже был правильно настроен
- ✅ `/env.example` - добавлена документация переменной

## Дополнительная информация

### Логирование для отладки

Если проблема не решается, добавьте логирование в `commands.ts`:

```typescript
async listTournaments(ctx: BotContext) {
  try {
    const userId = ctx.from?.id.toString();
    const apiUrl = getApiUrl();
    
    console.log(`🌐 [Bot] Запрос к API: ${apiUrl}/api/tournaments?userId=${userId}`);
    
    const apiResponse = await fetch(
      `${apiUrl}/api/tournaments?userId=${userId}`,
    );
    
    console.log(`📊 [Bot] API Response status: ${apiResponse.status}`);
    // ... rest of code
  }
}
```

### Проверка из логов Vercel

В логах функций Vercel вы увидите:
```
🌐 [Bot] Запрос к API: https://your-app.vercel.app/api/tournaments?userId=123
📊 [Bot] API Response status: 200
```

Если статус не 200, проверьте:
- API роут работает ли (`/api/tournaments`)
- Есть ли ошибки аутентификации
- Правильно ли передается userId

## Резюме

✅ **Код исправлен** - теперь использует переменные окружения  
✅ **Локально работает** - используется `http://localhost:3000` как fallback  
✅ **На продакшене** - нужно установить `NEXT_PUBLIC_API_URL` или `NEXT_PUBLIC_APP_URL`

После установки переменной окружения и деплоя все команды бота будут работать!

