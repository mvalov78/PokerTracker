# 🚨 ЭКСТРЕННЫЙ ПАТЧ v1.2.8 - Исправление hardcoded URLs для продакшена

**Дата релиза:** 12 сентября 2025  
**Тип:** Патч (Bug Fix)  
**Приоритет:** Критический  
**Статус:** ✅ Готов к продакшену

## 🎯 Описание проблемы

На продакшене при создании турниров через Telegram бот возникала критическая ошибка:
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

Причина: В коде использовались hardcoded URL `http://localhost:3000/api/...` вместо динамических URL для продакшена.

## 🔧 Исправления

### **1. Исправлены hardcoded URLs в `src/bot/commands.ts`:**
- ✅ `addResult()` - метод добавления результатов турнира
- ✅ `updateResult()` - метод обновления результатов  
- ✅ `getStats()` - метод получения статистики
- ✅ `listTournaments()` - метод списка турниров
- ✅ `finalizeTournamentEdit()` - метод создания турнира после редактирования

### **2. Исправлены hardcoded URLs в `src/bot/handlers/photoHandler.ts`:**
- ✅ `confirmTournament()` - метод создания турнира из OCR данных

### **3. Добавлено подробное логирование:**
- 🔍 Логирование URL для каждого API запроса
- 📊 Детальные ошибки API с кодами статуса
- ✅ Подтверждение успешных операций

## 🛠 Техническая реализация

### **До исправления:**
```typescript
const apiResponse = await fetch('http://localhost:3000/api/tournaments', {
```

### **После исправления:**
```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pokertracker-pro.vercel.app'
const apiUrl = `${appUrl}/api/tournaments`
console.log('🌐 [method] API URL:', apiUrl)
const apiResponse = await fetch(apiUrl, {
```

## 📋 Файлы изменений

| Файл | Изменения | Описание |
|------|-----------|-----------|
| `src/bot/commands.ts` | 5 URL исправлений + логирование | Все методы работы с турнирами |
| `src/bot/handlers/photoHandler.ts` | 1 URL исправление + логирование | Создание турниров из фото |

## 🧪 Тестирование

### **Локальное тестирование:**
- ✅ `npm run build` - сборка без ошибок
- ✅ Проверка линтера - ошибок нет

### **Продакшн тестирование:**
- 🔄 Создание турнира через фото в боте
- 🔄 Команды `/result`, `/stats`, `/tournaments` 
- 🔄 Редактирование турниров

## 🚀 Развертывание

### **1. Команды для развертывания:**
```bash
git add .
git commit -m "fix: Replace hardcoded localhost URLs with dynamic URLs"
npm version patch  # v1.2.8
git push origin main --tags
```

### **2. Vercel автоматически развернет:**
- URL: https://pokertracker-pro.vercel.app
- Время развертывания: ~2-3 минуты

### **3. Проверка после развертывания:**
- Отправить фото турнира боту
- Проверить логи Vercel на наличие ошибок `ECONNREFUSED`

## 📊 Ожидаемые результаты

### **✅ Исправлено:**
- ❌ `Error: connect ECONNREFUSED 127.0.0.1:3000`
- ❌ `fetch failed` при создании турниров
- ❌ Зависание бота при обработке команд

### **✅ Добавлено:**
- 🔍 Подробное логирование API запросов
- 🌐 Динамические URL для всех сред
- 📊 Детальная диагностика ошибок

## 🔍 Мониторинг

### **Логи для проверки в Vercel:**
```javascript
// Успешные запросы:
🌐 [method] API URL: https://pokertracker-pro.vercel.app/api/tournaments
✅ [method] API response: { success: true, tournament: {...} }

// Ошибки (если есть):
❌ [method] API error: { status: 500, error: "..." }
```

## 🎯 Критичность патча

**КРИТИЧЕСКИЙ** - Без этого патча:
- Telegram бот не может создавать турниры на продакшене
- Все команды бота с API вызовами не работают
- Пользователи получают ошибки "Ошибка при создании турнира"

## 📞 Поддержка

Если после развертывания v1.2.8 проблемы остаются:

1. **Проверить переменные окружения Vercel:**
   - `NEXT_PUBLIC_APP_URL` должен быть `https://pokertracker-pro.vercel.app`

2. **Проверить логи Vercel:**
   - Должны появиться логи `🌐 [method] API URL: ...`
   - Не должно быть `ECONNREFUSED 127.0.0.1:3000`

3. **Очистить кэш Vercel:**
   - Redeploy без изменений кода

---

**Патч v1.2.8 критически важен для работы Telegram бота на продакшене!** 🚀
