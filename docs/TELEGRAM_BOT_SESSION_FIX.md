# Исправление ошибки обработки фотографий в Telegram боте (webhook режим)

**Дата**: 31 октября 2025  
**Версия**: 1.4.1  
**Автор**: AI-специалист  

## Проблема

При отправке фотографий (как документов) в Telegram бот в режиме webhook возникала следующая ошибка:

```
❌ Ошибка обработки документа как фотографии: TypeError: Cannot set properties of undefined (setting 'ocrData')
```

Ошибка происходила в файле `src/bot/handlers/photoHandler.ts` в функции `handleDocumentAsPhoto` при попытке установить свойство `ocrData` в объекте `ctx.session`.

## Анализ

1. В логах видно, что OCR успешно обрабатывал изображение и возвращал данные
2. Ошибка происходила в строке 79 файла `src/bot/handlers/photoHandler.ts`: 
   ```typescript
   ctx.session.ocrData = { ...data, venue: finalVenueDoc };
   ```
3. Проблема заключалась в том, что в режиме webhook объект `ctx.session` был `undefined`
4. Middleware для сессий было настроено только в основном файле бота (`src/bot/index.ts`), но не в webhook обработчике (`src/app/api/telegram/webhook/route.ts`)

## Решение

В файле `src/app/api/telegram/webhook/route.ts` было добавлено middleware для сессий, аналогичное тому, что используется в основном боте:

```typescript
// Хранилище сессий для webhook режима
const sessions = new Map();

// Middleware для сессий (аналогично как в src/bot/index.ts)
webhookBot.use((ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) {return next();}
  
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      userId: userId.toString(),
      currentAction: undefined,
      tournamentData: undefined,
      ocrData: undefined,
    });
  }
  
  ctx.session = sessions.get(userId);
  return next();
});
```

Также была исправлена ошибка в обработке исключений (отсутствовал параметр `error` в блоке catch).

## Результат

После внесения изменений бот должен корректно обрабатывать фотографии, отправленные как документы, в режиме webhook.

## Рекомендации

1. Для сохранения сессий между перезапусками сервера рекомендуется использовать внешнее хранилище (например, Redis или базу данных)
2. Для синхронизации кода между локальной разработкой и продакшн-средой рекомендуется настроить CI/CD пайплайн

## Связанные файлы

- `src/app/api/telegram/webhook/route.ts` - основной файл webhook обработчика
- `src/bot/handlers/photoHandler.ts` - обработчик фотографий
- `src/bot/index.ts` - основной файл бота с настройками сессий

## Дополнительная информация

Этот баг возник из-за различий в обработке запросов между polling и webhook режимами бота. В polling режиме используется единый экземпляр бота с настроенными middleware, а в webhook режиме для каждого запроса создается новый контекст.
