# Release v1.5.9 — Фикс OCR билетов Casino Barcelona (`#WEEKEND_WARRIOR`)

## Дата
Август 2026

## Краткое описание
Для билетов Casino Barcelona с названием в стиле `#WEEKEND_WARRIOR` OCR-парсер извлекал в поле `name` мусорную строку вроде `"o autoriza a Gran Casino"` из подвала билета. После этой правки такие названия распознаются корректно.

## Корневая причина
Два независимых бага в `extractTournamentData()` (`src/services/ocrService.ts`).

### Bug 1: EVENT-регулярка ловила подстроку в слове `evento`
Старый паттерн:
```regex
/EVENT\s*[:#]?\s*#?\d*\s*(.+?)(?:\n|$)/i
```
не имел границ слова и матчил `EVENT` **внутри** испанского `evento`. В подвале билета Casino Barcelona есть строка:

```
Con su inscripción al evento autoriza a Gran Casino
Barcelona, S.L.U. ("GCB") y a las entidades colaboradoras
```

Отсюда парсер захватывал `.+?` до `\n` и в `data.name` уезжало `"o autoriza a Gran Casino"`.

### Bug 2: `#PATTERN` требовал подстроку `POKER`
Старый паттерн:
```regex
/^#\s*([A-Z0-9_,.\- ]*POKER[A-Z0-9_,.\- ]*)$/i
```
работал только для имён вида `#POKER_IN_2.0`. Для `#WEEKEND_WARRIOR` (без слова `POKER`) он не срабатывал, и парсер откатывался на паттерны, которые ловили мусор из подвала (см. Bug 1) или из «серийного» блока (Pattern 3).

## Что исправлено

### `src/services/ocrService.ts`
1. Обе EVENT-регулярки обёрнуты в `\bEVENT\b`. Теперь они матчат `EVENT` только как отдельное слово (например `EVENT: OPENER`, `EVENT#8 …`), и **никогда** — как подстроку внутри `evento`, `eventual`, `event-driven` и т.п.
2. `#PATTERN` расширен до `/^#\s*([A-Z][A-Z0-9_,.\- ]*[A-Z0-9])\s*$/i` — ловит любое имя вида `#WORD_WORD` с одной или более заглавных букв, цифрами, подчёркиваниями, точками, запятыми, тире и пробелами. Первый символ обязан быть буквой (чтобы не ловить чистые `#12345`), последний — буквой или цифрой (чтобы не тянуть висящие разделители).

### `src/__tests__/ocrService.test.ts`
- Добавлен реальный mock билета Casino Barcelona `#WEEKEND_WARRIOR` с полным подвалом (`"Con su inscripción al evento autoriza a Gran Casino…"`), точно воспроизводящий прод-случай.
- Новый интеграционный тест: имя должно быть `"WEEKEND_WARRIOR"`, buy-in — `165` (`75 + 15 + 75` с bounty, через total-fallback), дата — `2026-08-01`. Явно проверяется, что в `name` не утекает `autoriza`, `evento` или `Gran Casino`.
- Новый unit-тест `cleanTournamentName('WEEKEND_WARRIOR')` — регресс на «имя без EVENT-префикса/Day-суффикса/POKER остаётся без изменений».

## Файлы
- `src/services/ocrService.ts` — правки регулярок в `extractTournamentData` + поясняющий комментарий про `evento`.
- `src/__tests__/ocrService.test.ts` — новые mock и тесты.

## Тесты
- Все `ocrService`-тесты: **30/30** зелёные (включая существующие 28 и новые 2).
- Полный стабильный unit-сьют `src/__tests__/**` (без flaky-перформанс/интеграционных): **450/450** зелёные.
- `npm run lint` — 0 ошибок.

Оставшиеся падения в `__tests__/performance/*` и `__tests__/integration/*` не связаны с фиксом (существовали и до правки, воспроизведены на чистом HEAD `37e151a`) — это отдельная задача про стабилизацию флейкающих тестов.

## Регресс-сценарий
1. Отправить в бота фото билета Casino Barcelona с шапкой `#WEEKEND_WARRIOR` (или другим именем без `POKER`, содержащим `_`).
2. **До фикса:** «🎰 Турнир: o autoriza a Gran Casino».
3. **После фикса:** «🎰 Турнир: WEEKEND\_WARRIOR» (символ `_` экранируется в Markdown из v1.5.6, содержимое имени корректное).

## Деплой
Стандартный Vercel-флоу: после пуша в `main` идёт автоматический production-деплой. Бот в режиме `polling` подхватит новую версию после рестарта функции; в режиме `webhook` — мгновенно.

После деплоя:
- `/api/debug/version` возвращает `1.5.9`.
- Отправка билета `#WEEKEND_WARRIOR` даёт корректное имя турнира.

**Версия:** 1.5.9
