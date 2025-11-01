# 🔧 Активация Кастомных Режимов Cursor

**Дата:** 30 октября 2025

## 📋 Проблема

Кастомные режимы (VAN, PLAN, CREATIVE, BUILD, REFLECT, ARCHIVE) не отображались в интерфейсе Cursor, несмотря на наличие всех конфигурационных файлов.

## ✅ Решение

Внесены следующие изменения для активации системы режимов:

### 1. Активированы основные правила

**Файлы:**
- `.cursor/rules/isolation_rules/main.mdc`
- `.cursor/rules/isolation_rules/main-optimized.mdc`

**Изменение:**
```yaml
alwaysApply: false  →  alwaysApply: true
```

Теперь система Memory Bank и режимов активируется автоматически при запуске Cursor.

### 2. Создан файл `.cursorrules`

Добавлен файл `.cursorrules` в корне проекта для явной регистрации всех режимов:
- VAN Mode - Инициализация и анализ
- PLAN Mode - Планирование задач
- CREATIVE Mode - Дизайн решения
- BUILD Mode - Имплементация
- REFLECT Mode - Рефлексия и обзор
- ARCHIVE Mode - Документация

### 3. Создана документация

Добавлен файл `CURSOR_MODES_ACTIVATION.md` с описанием изменений.

## 🎯 Как использовать режимы

После перезагрузки Cursor можно активировать режимы, введя их название:

```
VAN      - Начать новую задачу
PLAN     - Спланировать задачу (Level 2-4)
CREATIVE - Принять дизайн решения (Level 3-4)
BUILD    - Начать имплементацию
REFLECT  - Провести ревью задачи
ARCHIVE  - Задокументировать задачу
VAN QA   - Техническая валидация перед BUILD
```

## 📁 Структура Memory Bank

Все режимы работают с централизованной системой Memory Bank:

```
memory-bank/
├── tasks.md              # Активная задача
├── activeContext.md      # Текущий контекст
├── progress.md           # Прогресс имплементации
├── projectbrief.md       # Бриф проекта
├── productContext.md     # Контекст продукта
├── systemPatterns.md     # Системные паттерны
├── techContext.md        # Технический контекст
├── style-guide.md        # Стайл-гайд
├── creative/             # Дизайн решения
├── reflection/           # Рефлексии
└── archive/              # Архив задач
```

## ℹ️ Важное примечание об UI

**Cursor изменил интерфейс** в последних версиях:
- Старая верхняя панель с выбором режима была убрана
- Режимы теперь работают через команды в чате
- Функциональность сохранена, изменился только UI

### Как работать с режимами сейчас:

**Просто пишите название режима в чат:**
```
VAN      → Инициализация задачи
PLAN     → Планирование
CREATIVE → Дизайн решения
BUILD    → Имплементация
REFLECT  → Ревью
ARCHIVE  → Документация
VAN QA   → Техническая валидация
```

AI ответит подтверждением:
```
OK VAN - Beginning Initialization Process
```

## 🔄 Следующие шаги

1. **Режимы уже активны** благодаря `alwaysApply: true`
2. **Используйте команды** в чате для переключения режимов
3. **Не нужно** искать панель выбора режима - её больше нет в новом UI
4. Вся функциональность работает через текстовые команды

## 📚 Дополнительная информация

### Файлы правил

Все правила находятся в `.cursor/rules/`:

- `basic-rules.mdc` - Основные правила кодирования
- `global.mdc` - Глобальная архитектура проекта
- `isolation_rules/` - Система режимов и Memory Bank
- `next-js-guidelines.mdc` - Next.js guidelines
- `test.mdc` - Принципы тестирования
- `ui-ux.mdc` - UI/UX дизайн принципы

### Complexity Levels

Система автоматически определяет уровень сложности:

- **Level 1:** Quick Bug Fix - VAN → BUILD → REFLECT
- **Level 2:** Simple Enhancement - VAN → PLAN → BUILD → REFLECT
- **Level 3:** Intermediate Feature - VAN → PLAN → CREATIVE → BUILD → REFLECT
- **Level 4:** Complex System - VAN → PLAN → CREATIVE → BUILD → REFLECT → ARCHIVE

## 🐛 Troubleshooting

Если режимы не активировались:

1. Убедитесь, что Cursor обновлен до последней версии
2. Проверьте, что файлы `.cursorrules` и `.cursor/rules/isolation_rules/main.mdc` существуют
3. Очистите кэш Cursor: `Cmd+Shift+P` → "Clear Workspace Cache"
4. Перезагрузите окно: `Cmd+Shift+P` → "Reload Window"

## ✨ Ожидаемый результат

После применения изменений система режимов должна:
- Автоматически загружаться при старте Cursor
- Отображаться в интерфейсе (если поддерживается версией)
- Реагировать на команды режимов (VAN, PLAN, etc.)
- Управлять Memory Bank автоматически

---

**Статус:** ✅ Изменения внесены  
**Требуется:** Перезагрузка Cursor

