# Release v1.5.6 — Фикс крэша Telegram-бота при регистрации турнира по фото

## Дата
Май 2026

## Краткое описание
Hotfix для прод-бага, при котором отправка фотографии билета турнира с символом `/` в названии (например, `EVENT#15 MAIN EVENT Day 1/A`) приводила к ошибке Telegram API:

```
400: Bad Request: can't parse entities: Can't find end of the entity starting at byte offset 101
```

Сообщение подтверждения с распознанными OCR-данными уходило в Telegram с `parse_mode: "Markdown"`, а в распознанном имени мог появиться `_` (его специально вставляет `cleanTournamentName`, заменяя `/` на `_` в составных именах). В legacy Markdown это открывает курсив без пары, и Telegram отвергал сообщение целиком.

## Корневая причина
1. `src/services/ocrService.ts → cleanTournamentName` намеренно превращает `Day 1/A` → `Day 1_A`, чтобы корректно обрабатывать составные имена вида `POKER_IN_2.0`.
2. `src/bot/handlers/photoHandler.ts` подставлял эти OCR-данные в шаблонные строки и отправлял с `parse_mode: "Markdown"`, не экранируя спец-символы legacy Markdown: `_`, `*`, `` ` ``, `[`.
3. В дополнение, fallback в `catch`-блоках также форматировал `error.message` через Markdown — что могло повторно ломать само сообщение об ошибке.

## Что исправлено
- В `src/bot/utils.ts` уточнена функция `escapeMarkdown` — теперь она экранирует ровно те 4 символа, которые открывают форматирующие сущности в Telegram legacy `Markdown`: `_`, `*`, `` ` ``, `[`. Дополнительно функция корректно обрабатывает `null/undefined/number` (возвращая безопасную строку).
- В `src/bot/handlers/photoHandler.ts` все подстановки OCR/БД/error-данных в Markdown-сообщения обёрнуты в `escapeMarkdown(...)`:
  - `handlePhoto` и `handleDocumentAsPhoto` — `data.name`, `venueText`, `data.tournamentType`, `error.message`.
  - `confirmTournament` — `newTournament.name`, `newTournament.venue`, `error.message`.
  - `editTournament` — `data.name`, `data.venue`.
- Сами шаблоны сообщений (`**bold**`, эмодзи, статический текст) не изменялись — внешний вид остался прежним.

## Файлы
- `src/bot/utils.ts` — обновлена функция `escapeMarkdown`, добавлены JSDoc-комментарии о её назначении.
- `src/bot/handlers/photoHandler.ts` — экранирование пользовательских данных в 6 точках с `parse_mode: "Markdown"`.
- `src/__tests__/bot/utils.test.ts` — расширенный набор тестов для `escapeMarkdown`, включая регресс на `MAIN EVENT Day 1_A` и обработку `null/undefined/number`.
- `src/__tests__/bot/photoHandler.test.ts` — добавлен интеграционный регресс-тест: при OCR-имени `MAIN EVENT Day 1_A`, площадке `Casino *unsafe*` и типе `freeze_out` проверяется, что в `ctx.reply` подставлены экранированные значения и нет «голых» спец-символов.

## Тесты
- `npm test` — **474/474** зелёные.
- `npm run lint` — 0 ошибок.

## Регресс-сценарий (как воспроизвести до фикса и проверить после)
1. Открыть Telegram-бот, отправить фото билета, где в имени события есть `/A`, `/B` и т.п. (например, скан билета `RPF SPRING 20-31 MAY 2026 → EVENT#15 MAIN EVENT Day 1/A`).
2. До фикса: бот пишет «Произошла ошибка при обработке фотографии. Техническая ошибка: 400: Bad Request: can't parse entities…».
3. После фикса: приходит обычное сообщение «Данные распознаны с билета…» с кнопками `✅ Подтвердить / ❌ Отменить / ✏️ Редактировать`.

## Деплой
Релиз катится через стандартный Vercel-флоу: после пуша в `main` Vercel автоматически собирает и деплоит. Бот в режиме `polling` подхватит новую версию после рестарта инстанса; в режиме `webhook` ничего дополнительно делать не нужно.

После деплоя проверить:
- Vercel Logs функции `/api/bot/polling` (или `/api/bot/webhook`) — больше не должно быть строк `400: Bad Request: can't parse entities`.
- `/api/debug/version` возвращает `1.5.6`.

## Альтернативы, которые НЕ применены (и почему)
- Перевод всех сообщений бота на `MarkdownV2` — требует переэкранирования всей статической вёрстки (`.`, `-`, `!`, `(`, `)` и т.п.), это новый паттерн с большой поверхностью изменений.
- Отказ от `parse_mode` целиком — теряется жирный текст во всех ответах, ухудшает UX.
- Замена `/` на `-` в `cleanTournamentName` — лечит симптом для конкретного билета, но любой другой OCR-артефакт с `*`, `` ` `` или `[` снова уронит сообщение.

**Версия:** 1.5.6
