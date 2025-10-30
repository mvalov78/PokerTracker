# ESLint Setup для PokerTracker

## 📋 Обзор

ESLint настроен для Next.js 15 проекта с использованием нового **flat config** формата (ESLint 9+).

## 🎯 Возможности

- ✅ **TypeScript** - полная поддержка TypeScript с `typescript-eslint`
- ✅ **React** - правила для React компонентов и хуков
- ✅ **Next.js** - специальные правила для Next.js приложений
- ✅ **Jest** - поддержка тестовых файлов с Jest globals
- ✅ **Автоматическое исправление** - многие проблемы можно исправить автоматически

## 📦 Установленные пакеты

```json
{
  "eslint": "^9.x",
  "eslint-config-next": "latest",
  "@typescript-eslint/parser": "latest",
  "@typescript-eslint/eslint-plugin": "latest",
  "@eslint/js": "latest",
  "@eslint/compat": "latest",
  "typescript-eslint": "latest",
  "eslint-plugin-react": "latest",
  "globals": "latest"
}
```

## 🔧 Конфигурация

### Файл `eslint.config.mjs`

Использует новый flat config формат (ESLint 9+):

```javascript
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import globals from "globals";

export default [
  // Игнорируемые файлы
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      "migrations/**",
      // ...
    ],
  },

  // Базовые правила
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...fixupConfigRules(pluginReactConfig),

  // Специальные правила для тестов
  {
    files: ["**/__tests__/**", "**/*.test.*"],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
];
```

## 🚀 Использование

### Команды npm

```bash
# Проверка всего проекта
npm run lint

# Автоматическое исправление проблем
npm run lint:fix

# Проверка только с Biome (старый линтер)
npm run lint:biome

# Форматирование с помощью ESLint
npm run format:eslint
```

### В IDE (VSCode)

Создан файл `.vscode/settings.json` с автоматическими настройками:

- ✅ Автоматическое исправление при сохранении
- ✅ Организация импортов
- ✅ Форматирование через ESLint

## 📊 Текущий статус

После первичной настройки:

- **Всего проблем**: 360
- **Ошибки**: 32 (требуют ручного исправления)
- **Предупреждения**: 328 (не блокируют сборку)

### Основные категории проблем

1. **Неиспользуемые переменные** (~150) - `@typescript-eslint/no-unused-vars`
2. **Console statements** (~50) - `no-console` (разрешены только `warn` и `error`)
3. **Type any** (~80) - `@typescript-eslint/no-explicit-any`
4. **Missing curly braces** (~10) - `curly`
5. **React unescaped entities** (~5) - `react/no-unescaped-entities`

## 🎨 Правила

### TypeScript

```javascript
{
  "@typescript-eslint/no-unused-vars": "warn",
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/explicit-module-boundary-types": "off",
  "@typescript-eslint/triple-slash-reference": "off",
  "@typescript-eslint/no-require-imports": "warn",
}
```

### React

```javascript
{
  "react/react-in-jsx-scope": "off",  // Next.js не требует импорт React
  "react/prop-types": "off",          // Используем TypeScript
}
```

### Общие

```javascript
{
  "no-console": ["warn", { "allow": ["warn", "error"] }],
  "prefer-const": "error",
  "no-var": "error",
  "eqeqeq": ["error", "always"],
  "curly": ["error", "all"],
  "no-debugger": "warn",
}
```

### Тестовые файлы

Для файлов в `__tests__/` и `*.test.*`:

```javascript
{
  "@typescript-eslint/no-explicit-any": "off",
  "@typescript-eslint/no-require-imports": "off",
  "no-console": "off",
}
```

## 🔄 Миграция с Biome

Проект изначально использовал **Biome** для линтинга и форматирования. Теперь доступны оба инструмента:

- **ESLint** - основной линтер для code quality
- **Biome** - альтернативный линтер (можно удалить или оставить для форматирования)

### Команды доступны параллельно:

```bash
npm run lint          # ESLint
npm run lint:biome    # Biome
npm run format        # Biome format
npm run format:eslint # ESLint fix
```

## 📝 Игнорируемые файлы

ESLint не проверяет следующие директории и файлы:

- `node_modules/`
- `.next/`
- `out/`, `build/`, `dist/`
- `coverage/`
- `migrations/`
- `mvalovpokertracker/` (старая версия)
- `*.backup`
- `next-env.d.ts`
- Конфигурационные файлы (`*.config.js`, `*.config.ts`)

## 🐛 Исправление проблем

### Автоматически исправляемые

Многие проблемы можно исправить автоматически:

```bash
npm run lint:fix
```

Это исправит:
- Отсутствующие фигурные скобки (`curly`)
- `==` → `===` (`eqeqeq`)
- `var` → `const`/`let` (`no-var`)
- Лишние пробелы и форматирование

### Требуют ручного исправления

1. **Неиспользуемые переменные**
   - Переименуйте в `_varName` если нужна для интерфейса
   - Удалите если действительно не используется

2. **Console.log**
   - Замените на `console.warn()` или `console.error()`
   - Или удалите

3. **Type any**
   - Определите правильный тип
   - Или используйте `unknown` с type guards

4. **React unescaped entities**
   - Используйте HTML entities (`&quot;`, `&apos;`)
   - Или оберните в `{'"'}`, `{"'"}`

## 🔗 Интеграция с CI/CD

Добавьте в workflow:

```yaml
# .github/workflows/ci.yml
- name: Lint
  run: npm run lint
```

Или игнорируйте warnings в production:

```yaml
- name: Lint (errors only)
  run: npm run lint -- --max-warnings 0
```

## 📚 Дополнительные ресурсы

- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [ESLint Plugin React](https://github.com/jsx-eslint/eslint-plugin-react)
- [Next.js ESLint](https://nextjs.org/docs/app/building-your-application/configuring/eslint)

## 🎯 Следующие шаги

1. ✅ Установлен и настроен ESLint
2. ⏳ Постепенно исправлять ошибки (32 критических)
3. ⏳ Опционально: исправить предупреждения (328)
4. ⏳ Настроить pre-commit hooks (husky + lint-staged)
5. ⏳ Добавить ESLint в CI/CD pipeline

---

**Дата настройки**: Октябрь 30, 2025  
**Версия ESLint**: 9.x  
**Формат конфигурации**: Flat Config

