# ESLint Quick Start Guide

## 🚀 Быстрый старт

### Проверка кода

```bash
# Проверить весь проект
npm run lint

# Проверить и автоматически исправить
npm run lint:fix
```

### Основные команды

```bash
npm run lint              # Проверка с ESLint
npm run lint:fix          # Автоисправление
npm run format:eslint     # Форматирование через ESLint
npm run lint:biome        # Проверка с Biome (старый линтер)
```

## 📊 Текущий статус

После установки:
- ✅ ESLint настроен и работает
- ⚠️ 360 проблем найдено (32 ошибки, 328 предупреждений)
- 🔧 Многие можно исправить автоматически с `npm run lint:fix`

## 🎯 Основные проблемы

### 1. Неиспользуемые переменные (warning)

```typescript
// ❌ Плохо
const data = await fetch();
// 'data' is not used

// ✅ Хорошо - переименуйте с префиксом _
const _data = await fetch();

// ✅ Или удалите
await fetch();
```

### 2. Console.log (warning)

```typescript
// ❌ Плохо
console.log('Debug info');

// ✅ Хорошо
console.warn('Warning info');
console.error('Error info');

// ✅ Или удалите в production коде
if (process.env.NODE_ENV === 'development') {
  console.warn('Debug info');
}
```

### 3. Type any (warning)

```typescript
// ❌ Плохо
function process(data: any) {}

// ✅ Хорошо
function process(data: Record<string, unknown>) {}
function process(data: SomeType) {}
```

### 4. Отсутствующие фигурные скобки (error)

```typescript
// ❌ Плохо
if (condition) return;

// ✅ Хорошо
if (condition) {
  return;
}
```

Это исправляется автоматически с `npm run lint:fix`!

### 5. React unescaped entities (error)

```typescript
// ❌ Плохо
<p>This is "quoted" text</p>

// ✅ Хорошо
<p>This is &quot;quoted&quot; text</p>
<p>This is {'"'}quoted{'"'} text</p>
```

## 🔧 VSCode интеграция

Установите расширение **ESLint** для VSCode:

1. Откройте Extensions (Cmd+Shift+X)
2. Найдите "ESLint"
3. Установите официальное расширение от Microsoft

Настройки уже в `.vscode/settings.json`:
- ✅ Автоисправление при сохранении
- ✅ Подсветка ошибок в реальном времени

## 📝 Игнорирование правил

### В коде

```typescript
// Отключить для следующей строки
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = someValue;

// Отключить для файла
/* eslint-disable @typescript-eslint/no-explicit-any */
const data: any = someValue;
/* eslint-enable @typescript-eslint/no-explicit-any */
```

### В конфигурации

Редактируйте `eslint.config.mjs`:

```javascript
{
  rules: {
    "@typescript-eslint/no-explicit-any": "off", // Выключить
    "@typescript-eslint/no-unused-vars": "warn", // Только предупреждение
  }
}
```

## 🎯 Приоритеты исправления

1. **Критические ошибки** (32) - блокируют CI/CD
   - Missing curly braces
   - React unescaped entities
   - Constant binary expressions

2. **Неиспользуемые переменные** (~150) - улучшают читаемость
3. **Console statements** (~50) - чистота production кода
4. **Type any** (~80) - type safety

## 🚫 Что НЕ проверяется

- `node_modules/`
- `.next/`
- `out/`, `build/`, `dist/`
- `coverage/`
- `migrations/`
- `*.backup`
- `*.config.js/ts`

## 📚 Дополнительная информация

Полная документация: `docs/ESLINT_SETUP.md`

## 🆘 Troubleshooting

### Ошибка: "ESLint couldn't find the config file"

```bash
# Убедитесь что файл существует
ls -la eslint.config.mjs

# Переустановите зависимости
rm -rf node_modules package-lock.json
npm install
```

### Ошибка: "Parsing error"

Проверьте что TypeScript установлен:

```bash
npm list typescript
```

### Слишком много ошибок

Игнорируйте warnings для начала:

```bash
npm run lint -- --quiet  # Только errors
```

---

**Создано**: Октябрь 30, 2025  
**Версия**: 1.0

