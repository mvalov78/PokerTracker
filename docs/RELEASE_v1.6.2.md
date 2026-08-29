# Release v1.6.2 — Фикс OCR PokerStars Live Deep Stack (`#76 €330…`)

## Дата
Август 2026

## Краткое описание
Для квитков PokerStars Live с заголовком вида `#76 €330 Deep Stack - Unlimited Re-Entry` (без поля Festival) бот распознавал данные неверно:

| Поле | Было | Должно |
|------|------|--------|
| Турнир | Не определено | Deep Stack - Unlimited Re-Entry |
| Бай-ин | $76 (номер события) | $330 |
| Площадка | Maksim Valov (имя игрока) | PokerStars Live |
| Дата | 29.08.2026 | 29.08.2026 ✓ |

## Корневая причина
Три бага в `src/services/ocr/pokerStarsLiveParser.ts`:

1. **`parseMoneyAmount`** брал первое число в строке. Заголовок `#76 €330 Deep Stack…` давал `76` вместо суммы рядом с `€`.
2. **Имя турнира** бралось только из `Open tournament` / `Festival`. На Deep Stack квитках этих полей нет — название только в фиолетовом заголовке.
3. **Venue-эвристика** принимала любую Title Case строку (`Maksim Valov`) как город/площадку.

## Что исправлено
- `parseMoneyAmount`: приоритет сумме сразу после символа валюты (`€330`), затем `330 €` / `600 EUR`, и только потом fallback на первое число. Event `#76 €…` больше не путается с бай-ином.
- Извлечение имени из заголовка `#NN €buyin Name…` → `Name` (например `Deep Stack - Unlimited Re-Entry`), когда Festival/Open tournament отсутствуют.
- Площадка: строки вида First Last (имя игрока) больше не считаются venue; fallback — `PokerStars Live`.
- Money-строки: предпочитаются короткие `330 €`, а не длинные title-строки с вшитым бай-ином.

## Файлы
- `src/services/ocr/pokerStarsLiveParser.ts`
- `src/__tests__/pokerStarsLiveParser.test.ts` — регресс на Deep Stack (обычный и two-column OCR) + e2e через `processTicketImage`

## Тесты
- `pokerStarsLiveParser` + `ocrService`: **59/59**
- Стабильный unit-сьют `src/__tests__/**`: **479/479**

## Регресс-сценарий
1. Отправить в бота скрин квитка PokerStars Live `#76 €330 Deep Stack - Unlimited Re-Entry`.
2. **До фикса:** Турнир не определён, бай-ин $76, площадка = имя игрока.
3. **После фикса:** Турнир `Deep Stack - Unlimited Re-Entry`, бай-ин $330, площадка `PokerStars Live`.

**Версия:** 1.6.2
