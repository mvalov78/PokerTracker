# Release v1.5.8 — Фикс «тишины» бота при ошибках webhook

## Дата
Август 2026

## Краткое описание
На проде бот мог перестать отвечать на сообщения: Telegram доставлял update на webhook, endpoint возвращал 200, но пользователь не получал ответа. Корневая причина — session middleware вызывал `next()` повторно в `catch`, из‑за чего Telegraf бросал `next() called multiple times` и глотал исходную ошибку хендлера.

## Корневая причина
В `src/app/api/telegram/webhook/route.ts` и `src/bot/index.ts` middleware сессий был таким:

```ts
try {
  await next();                          // 1-й вызов
  await BotSessionService.updateSession(...);
} catch {
  ctx.session = empty;
  await next();                          // 2-й вызов → "next() called multiple times"
}
```

Если хендлер (например `/start` без собственного try/catch) падал на `ctx.reply`, catch middleware вызывал `next()` снова. Telegraf отвечал `next() called multiple times`, webhook возвращал `{ ok: false }` со статусом 200 — Telegram считал доставку успешной и не ретраил, пользователь видел тишину.

## Что исправлено
1. Вынесен общий `createSessionMiddleware`: `next()` вызывается ровно один раз; save сессии — в `finally` без повторного `next()`.
2. Добавлен `bot.catch` (webhook + polling) — пользователю уходит понятный ответ при необработанной ошибке.
3. `/start` получил fallback без Markdown (как у `/help`).
4. Исправлены `catch { ... error }` без binding в `api/bot/init` и `api/bot/webhook` (ReferenceError при реальной ошибке).
5. `getStatus().mode` больше не захардкожен в `"polling"`.

## Файлы
- `src/bot/middleware/sessionMiddleware.ts` — новый shared middleware
- `src/app/api/telegram/webhook/route.ts`
- `src/bot/index.ts`
- `src/bot/commands.ts`
- `src/app/api/bot/init/route.ts`
- `src/app/api/bot/webhook/route.ts`
- `src/__tests__/bot/sessionMiddleware.test.ts`

## Тесты
- Регресс: handler throws → `next` ровно 1 раз
- Session load fail → `next` всё равно 1 раз, empty session
- Session save fail → запрос не падает
