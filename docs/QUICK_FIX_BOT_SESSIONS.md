# 🔧 Quick Fix: Bot Sessions Issue in Production

## Проблема

При попытке ввести результат турнира в Telegram боте на продакшене (на этапе выбора турнира) выдавалась ошибка **"Неизвестная команда"**.

## Причина

Telegram бот использовал **in-memory хранилище сессий** (`Map<number, SessionData>`), которое теряется между запросами в **serverless окружении Vercel**.

### Поток событий:

1. Пользователь вводит `/result`
2. Бот отправляет список турниров с inline кнопками
3. Пользователь нажимает кнопку → callback_query отправляется
4. **Новый serverless инстанс запускается** (старая in-memory сессия потеряна)
5. Бот не находит сессию → не понимает контекст → "Неизвестная команда"

## Решение

Интегрировали **`BotSessionService`** для сохранения сессий в **PostgreSQL (Supabase)** вместо in-memory хранилища.

### Изменения в `src/bot/index.ts`:

#### 1. Добавлен импорт `BotSessionService`

```typescript
import { BotSessionService } from "@/services/botSessionService";
```

#### 2. Удалено in-memory хранилище

```typescript
// Было:
private sessions: Map<number, SessionData> = new Map();

// Стало:
// Сессии теперь хранятся в БД через BotSessionService
```

#### 3. Обновлен middleware для сессий

```typescript
// Было: простое in-memory хранилище
this.bot.use((ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) {return next();}

  if (!this.sessions.has(userId)) {
    this.sessions.set(userId, { /* ... */ });
  }

  ctx.session = this.sessions.get(userId)!;
  return next();
});

// Стало: загрузка и сохранение в БД
this.bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) {return next();}

  try {
    // Загружаем сессию из БД
    const sessionData = await BotSessionService.getSession(userId);
    ctx.session = sessionData;
    
    // Выполняем обработчик
    await next();
    
    // Сохраняем сессию обратно в БД
    await BotSessionService.updateSession(userId, ctx.session);
  } catch (error) {
    console.error('Session middleware error:', error);
    // Fallback на пустую сессию
    ctx.session = { /* ... */ };
    await next();
  }
});
```

#### 4. Обновлен `createMockContext` для мок-режима

```typescript
// Метод стал асинхронным и загружает сессию из БД
private async createMockContext(update: any): Promise<BotContext> {
  const userId = update.message?.from?.id || update.callback_query?.from?.id;
  let session: SessionData = { userId: userId?.toString() };
  
  // Пытаемся загрузить сессию из БД
  if (userId) {
    try {
      session = await BotSessionService.getSession(userId);
    } catch (error) {
      console.error('Error loading session for mock context:', error);
    }
  }
  
  return { /* ... */ session };
}
```

#### 5. Обновлен `processUpdate` для мок-режима

```typescript
// Добавлен await для createMockContext
const ctx = await this.createMockContext(update);

// ... обработка команд, фото, текста, callback

// Сохраняем сессию после обработки (для мок режима)
const userId = ctx.from?.id;
if (userId) {
  await BotSessionService.updateSession(userId, ctx.session);
}
```

## Преимущества решения

### ✅ Персистентность сессий
- Сессии сохраняются между запросами в serverless окружении
- Работает как в webhook, так и в polling режиме

### ✅ Автоматическая очистка
- Сессии истекают через 24 часа (`expires_at`)
- Функция `cleanup_expired_bot_sessions()` для периодической очистки

### ✅ Безопасность
- Row Level Security (RLS) для защиты данных
- Только service_role может управлять сессиями

### ✅ Производительность
- Индексы на `user_id` и `expires_at` для быстрого поиска
- JSONB хранилище для гибкости данных

## Структура таблицы `bot_sessions`

```sql
CREATE TABLE bot_sessions (
  id UUID PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,        -- Telegram user ID
  session_data JSONB NOT NULL DEFAULT '{}', -- Данные сессии
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);
```

## Тестирование

### Сценарий теста:

1. Пользователь вводит `/result`
2. Бот показывает список турниров с кнопками
3. Пользователь выбирает турнир → callback_query
4. **Сессия загружается из БД** ✅
5. Бот устанавливает `currentAction = 'add_result'`
6. **Сессия сохраняется в БД** ✅
7. Пользователь вводит результат (новый запрос)
8. **Сессия загружается из БД** ✅
9. Бот понимает контекст и обрабатывает результат ✅

### Команды для проверки:

```bash
# Запуск тестов
npm test

# Проверка линтера
npm run lint

# Локальный запуск
cd /Users/mvalov/PokerTracker && npm run dev
```

## Дальнейшие улучшения

- [ ] Добавить мониторинг использования сессий
- [ ] Настроить автоматическую очистку через cron job
- [ ] Добавить метрики времени жизни сессий
- [ ] Оптимизировать частоту обновлений сессий

## Связанные файлы

- `src/bot/index.ts` - Основной файл бота с middleware
- `src/services/botSessionService.ts` - Сервис управления сессиями
- `sql-scripts/add-bot-sessions-table.sql` - SQL схема таблицы

## Дата исправления

**2025-11-01** - Исправление ошибки "Неизвестная команда" в продакшене

---

**Статус**: ✅ Исправлено  
**Версия**: 1.4.4 (планируется)  
**Приоритет**: 🔴 Критический

