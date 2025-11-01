# 🔧 Quick Fix: Webhook Callback Handler Issue

## Проблема

После исправления in-memory сессий в `src/bot/index.ts`, ошибка **"Неизвестная команда"** всё ещё возникала при выборе турнира в продакшене.

### Логи показывали:
```
[Telegram Webhook] Получен callback_query: tournament_select:32d24305-a780-42c0-8150-36724437bd47
[Telegram Webhook] Обновление успешно обработано
```

Но пользователь получал: **"Неизвестная команда"** ❌

## Причина

В файле `src/app/api/telegram/webhook/route.ts` были **ДВЕ критические проблемы**:

### 1. In-memory хранилище сессий (строки 36-66)
```typescript
// ❌ ПРОБЛЕМА: In-memory Map, который теряется между запросами
const sessions = new Map();
webhookBot.use((ctx, next) => {
  if (!sessions.has(userId)) {
    sessions.set(userId, { /* ... */ });
  }
  ctx.session = sessions.get(userId);
  return next();
});
```

### 2. Неполная обработка callback_query (строки 134-154)
```typescript
// ❌ ПРОБЛЕМА: Обрабатывает только 3 типа callback
webhookBot.on("callback_query", async (ctx) => {
  switch (ctx.callbackQuery.data) {
    case "confirm_tournament":
      // ...
    case "cancel_tournament":
      // ...
    case "edit_tournament":
      // ...
    default:
      await ctx.answerCbQuery("Неизвестная команда"); // ❌
  }
});
```

**Отсутствовали обработчики для:**
- `tournament_select:*` - Выбор турнира для добавления результата
- `result_confirm:*` - Подтверждение результата
- `notification_toggle:*` - Переключение уведомлений

## Решение

### 1. Интегрирован BotSessionService для webhook endpoint

```typescript
// ✅ Загрузка/сохранение сессий из PostgreSQL
webhookBot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) return next();
  
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
    ctx.session = { /* fallback */ };
    await next();
  }
});
```

### 2. Добавлены все обработчики callback_query

```typescript
// ✅ Полная обработка всех callback types
webhookBot.on("callback_query", async (ctx) => {
  const callbackData = ctx.callbackQuery.data;
  const [action, ...params] = callbackData.split(":");

  try {
    switch (action) {
      case "tournament_select":
        await commands!.selectTournament(ctx, params[0]);
        break;
      case "result_confirm":
        await commands!.confirmResult(ctx, params[0]);
        break;
      case "notification_toggle":
        await commands!.toggleNotification(ctx, params[0]);
        break;
      case "confirm_tournament":
        await photoHandler!.confirmTournament(ctx);
        break;
      case "cancel_tournament":
        await photoHandler!.cancelTournament(ctx);
        break;
      case "edit_tournament":
        await photoHandler!.editTournament(ctx);
        break;
      default:
        await ctx.answerCbQuery("Неизвестная команда");
    }
  } catch (error) {
    console.error(`Ошибка обработки callback_query:`, error);
    await ctx.answerCbQuery("Произошла ошибка при обработке команды");
  }
});
```

### 3. Добавлена обработка текстовых сообщений для состояний

```typescript
// ✅ Обработка ввода результата, регистрации и редактирования
webhookBot.on("text", async (ctx) => {
  const text = ctx.message.text;
  const session = ctx.session;
  
  if (text.startsWith("/")) return; // Команда, пропускаем
  
  if (session?.currentAction === "register_tournament") {
    await commands!.handleTournamentRegistration(ctx, text);
    return;
  }
  
  if (session?.currentAction === "add_result") {
    await commands!.handleResultInput(ctx, text);
    return;
  }
  
  if (session?.currentAction === "edit_tournament") {
    await commands!.handleTournamentEdit(ctx, text);
    return;
  }
  
  // Обычное сообщение
  await ctx.reply("🤖 Используйте /help для справки");
});
```

## Изменённые файлы

- ✏️ `src/app/api/telegram/webhook/route.ts` - Основные исправления

## Тестирование

✅ **16 тестов прошли успешно**
- `botSessionService.test.ts` - 16 passed

### Сценарий теста:

1. Пользователь вводит `/result` ✅
2. Бот показывает список турниров ✅
3. Пользователь выбирает турнир → callback: `tournament_select:UUID` ✅
4. **Webhook endpoint парсит callback** ✅
5. **Вызывается `commands.selectTournament(ctx, UUID)`** ✅
6. **Сессия загружается из БД** ✅
7. `currentAction` устанавливается в `'add_result'` ✅
8. **Сессия сохраняется в БД** ✅
9. Пользователь вводит результат: `1 | 2500` ✅
10. **Текстовый обработчик видит `currentAction === 'add_result'`** ✅
11. **Вызывается `commands.handleResultInput(ctx, text)`** ✅
12. Результат успешно сохраняется ✅

## Важные детали

### Порядок обработки в Telegraf:

1. **Middleware** (сессии) выполняется ПЕРВЫМ
2. **Command handlers** (`webhookBot.command()`)
3. **Event handlers** (`webhookBot.on()`)

### Типы callback_data в проекте:

| Callback Data | Обработчик | Источник |
|---------------|------------|----------|
| `tournament_select:UUID` | `commands.selectTournament()` | `/result` команда |
| `result_confirm:UUID` | `commands.confirmResult()` | Подтверждение результата |
| `notification_toggle:TYPE` | `commands.toggleNotification()` | `/settings` команда |
| `confirm_tournament` | `photoHandler.confirmTournament()` | OCR обработка фото |
| `cancel_tournament` | `photoHandler.cancelTournament()` | OCR обработка фото |
| `edit_tournament` | `photoHandler.editTournament()` | OCR обработка фото |

## Дата исправления

**2025-11-01** - Исправление webhook callback handlers и сессий

---

**Статус**: ✅ Исправлено  
**Версия**: 1.4.5 (планируется)  
**Приоритет**: 🔴 Критический

