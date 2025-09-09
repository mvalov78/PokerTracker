# 🃏 PokerTracker Pro

Профессиональное приложение для отслеживания покерных турниров с интеграцией Telegram-бота и автоматическим распознаванием билетов.

## 🚀 Возможности

### 📱 Telegram Bot
- 🤖 Автоматическое распознавание билетов турниров (OCR)
- 📊 Добавление результатов турниров
- 📈 Просмотр статистики
- 🏨 Управление площадками проведения
- 🎯 Быстрые команды для управления данными

### 💻 Web Interface
- 📋 Управление турнирами
- 📊 Детальная аналитика и статистика
- 💰 Отслеживание банкролла
- 📈 Графики и диаграммы
- 🎨 Современный UI/UX

### 🗄️ База данных
- 🔒 Supabase PostgreSQL
- 🔄 Real-time синхронизация
- 📦 Автоматические миграции
- 🛡️ Row Level Security (RLS)

## 🛠️ Технологический стек

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Bot**: Telegraf
- **Testing**: Jest, React Testing Library
- **Performance**: Bundle Analyzer, Lazy Loading

## 📁 Структура проекта

```
src/
├── __tests__/           # Тесты (104 теста)
│   ├── integration/     # Интеграционные тесты
│   ├── performance/     # Тесты производительности
│   └── ...             # Юнит-тесты
├── app/                 # Next.js App Router
│   ├── api/            # API маршруты
│   ├── admin/          # Админ панель
│   └── ...             # Страницы приложения
├── bot/                 # Telegram Bot
│   ├── commands.ts     # Команды бота
│   ├── handlers/       # Обработчики сообщений
│   └── services/       # Сервисы бота
├── components/          # React компоненты
│   ├── ui/             # UI компоненты
│   ├── charts/         # Графики и диаграммы
│   └── ...             # Другие компоненты
├── services/            # Бизнес-логика
│   ├── ocrService.ts   # OCR распознавание
│   ├── tournamentService.ts # Управление турнирами
│   └── ...             # Другие сервисы
├── hooks/               # React хуки
└── types/               # TypeScript типы

sql-scripts/             # SQL скрипты для базы данных
├── README.md           # Документация SQL скриптов
├── supabase-schema.sql # Основная схема БД
├── add-user-settings-table.sql # Настройки пользователей
└── ...                 # Другие SQL скрипты
```

## 🚀 Быстрый старт

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd mvalovpokertracker
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка окружения
```bash
cp env.example .env.local
# Отредактируйте .env.local с вашими ключами
```

### 4. Настройка Supabase
Следуйте инструкциям в `SUPABASE_SETUP.md`:
1. Создайте проект в Supabase
2. Выполните SQL скрипты из папки `sql-scripts/`
3. Получите API ключи и добавьте в `.env.local`

### 5. Настройка Telegram Bot
1. Создайте бота через @BotFather
2. Получите токен и добавьте в `.env.local`
3. Используйте админ панель `/admin/bot-setup` для настройки

### 6. Запуск приложения
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 📋 Доступные команды

```bash
# Разработка
npm run dev          # Запуск dev сервера
npm run build        # Сборка для продакшена
npm run start        # Запуск продакшн сервера

# Тестирование
npm test             # Запуск всех тестов
npm run test:watch   # Тесты в watch режиме

# Анализ
npm run analyze      # Анализ размера бандла
```

## 🤖 Команды Telegram Bot

- `/start` - Начало работы с ботом
- `/help` - Справка по командам
- `/register` - Ручная регистрация турнира
- `/result` - Добавление результата турнира
- `/stats` - Просмотр статистики
- `/tournaments` - Список турниров
- `/venue` - Просмотр текущей площадки
- `/setvenue` - Установка текущей площадки

## 🧪 Тестирование

Проект покрыт комплексными тестами:

- **104 теста** с 100% success rate
- **Юнит-тесты** для всех основных компонентов
- **Интеграционные тесты** для пользовательских сценариев
- **Тесты производительности** для оптимизации

```bash
npm test  # Запуск всех тестов
```

## 📊 Производительность

- **Bundle size**: 102 kB (First Load JS)
- **Build time**: ~4 секунды
- **Test suite**: ~16 секунд
- **Static pages**: 18 страниц

## 📝 Документация

- `SUPABASE_SETUP.md` - Настройка базы данных
- `TESTING_REPORT.md` - Отчет о тестировании
- `sql-scripts/README.md` - Документация SQL скриптов
- `PROJECT_REQUIREMENTS.md` - Требования проекта

## 🔧 Конфигурация

### Переменные окружения (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
```

## 🤝 Участие в разработке

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Создайте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License.

## 🆘 Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте документацию в папке проекта
2. Просмотрите существующие Issues
3. Создайте новый Issue с подробным описанием

---

**Статус проекта**: 🟢 **Готов к использованию**

*Последнее обновление: 9 сентября 2025*