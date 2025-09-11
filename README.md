# 🎰 PokerTracker Pro

> **Профессиональная система отслеживания покерных турниров с Telegram ботом и OCR распознаванием**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](./VERSION.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black.svg)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.0.0-green.svg)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

## 🚀 Особенности

### 🔐 **Система авторизации**
- **Email/Password** авторизация для локального тестирования
- **Google OAuth** интеграция для продакшена
- **Роли пользователей:** `player` (игрок) и `admin` (администратор)
- **Изоляция данных:** каждый пользователь видит только свои турниры
- **Row Level Security (RLS)** политики в базе данных

### 🤖 **Telegram бот интеграция**
- **OCR распознавание** билетов турниров (точность 85%+)
- **Автоматическое создание** турниров из фото билетов
- **Связывание аккаунтов** Telegram ↔ Веб-приложение
- **Команды бота:** `/start`, `/help`, `/link`, `/register`, `/result`, `/stats`
- **Управление площадками:** `/venue`, `/setvenue`

### 📊 **Управление турнирами**
- Создание турниров через веб-интерфейс или Telegram бот
- Добавление результатов и расчет статистики
- Поддержка различных форматов турниров
- Отслеживание ROI, ITM Rate, прибыли

### 🎯 **Аналитика и отчеты**
- Подробная статистика игры
- Графики и диаграммы
- Экспорт данных
- Отслеживание прогресса

## 🛠️ Технологический стек

- **Frontend:** Next.js 15.5.2, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase
- **База данных:** PostgreSQL (Supabase)
- **Авторизация:** Supabase Auth, Google OAuth
- **Telegram:** Telegraf.js, OCR API
- **Тестирование:** Jest, React Testing Library
- **Деплой:** Vercel, Docker support

## 📋 Требования

- **Node.js** 18.0.0+
- **npm** или **yarn**
- **Supabase** проект
- **Google Cloud** проект (для OAuth)
- **Telegram Bot** токен (от @BotFather)

## 📚 Документация

**Полная документация проекта находится в папке [`docs/`](./docs/README.md)**

### 📖 Основные руководства:
- [**📝 Быстрый деплой на Vercel**](./docs/QUICK_VERCEL_DEPLOY.md) - Самый быстрый способ запустить приложение
- [**🔧 Полное руководство по настройке**](./docs/FINAL_SETUP_GUIDE.md) - Детальная настройка всех компонентов
- [**⚙️ Конфигурация бота через .env**](./docs/ENV_BOT_CONFIGURATION.md) - Управление настройками через переменные окружения
- [**🤖 Руководство по админ панели**](./docs/BOT_ADMIN_GUIDE.md) - Управление Telegram ботом
- [**💻 Локальное тестирование**](./docs/LOCAL_TESTING.md) - Разработка и отладка

## 🚀 Быстрый старт

### 1️⃣ **Клонирование репозитория**

```bash
git clone https://github.com/mvalov78/PokerTracker.git
cd PokerTracker/mvalovpokertracker
```

### 2️⃣ **Установка зависимостей**

```bash
npm install
```

### 3️⃣ **Настройка переменных окружения**

```bash
cp .env.example .env.local
```

Отредактируйте `.env.local`:

```bash
# Supabase (получить из Supabase Dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth (получить из Google Cloud Console)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Telegram Bot (получить от @BotFather)
TELEGRAM_BOT_TOKEN=your-bot-token
```

### 4️⃣ **Настройка базы данных**

```bash
# Выполните в Supabase SQL Editor:
\i sql-scripts/setup-auth-schema-simple.sql
\i sql-scripts/add-telegram-linking-table.sql
```

### 5️⃣ **Запуск приложения**

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 📚 Документация

| Документ | Описание |
|----------|----------|
| [SETUP_AUTH.md](./SETUP_AUTH.md) | Настройка системы авторизации |
| [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) | Настройка Google OAuth |
| [TELEGRAM_INTEGRATION.md](./TELEGRAM_INTEGRATION.md) | Интеграция с Telegram ботом |
| [LOCAL_TESTING.md](./LOCAL_TESTING.md) | Локальное тестирование |
| [VERSIONING_GUIDE.md](./VERSIONING_GUIDE.md) | Система версионирования |
| [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) | Развертывание в продакшене |

## 🧪 Тестирование

### **Запуск всех тестов:**

```bash
npm test
```

### **Запуск конкретных тестов:**

```bash
# Тесты авторизации
npm test -- src/__tests__/integration/auth-integration.test.ts

# Функциональные тесты
npm test -- src/__tests__/functional/end-to-end.test.ts

# Тесты производительности
npm test -- src/__tests__/performance/performance.test.ts
```

### **Покрытие тестами:**
- ✅ 19 интеграционных тестов
- ✅ 14 тестов OCR сервиса
- ✅ 6 тестов производительности
- ✅ Функциональные end-to-end тесты

## 🔧 Система версионирования

### **Управление версиями:**

```bash
# Проверка готовности к релизу
./scripts/version-management.sh check

# Создание нового релиза
./scripts/version-management.sh release 1.0.1 "Bug fixes"

# Просмотр истории версий
./scripts/version-management.sh list

# Сравнение версий
./scripts/version-management.sh compare 1.0.0 1.0.1
```

### **Деплой:**

```bash
# Development
./scripts/deploy.sh development

# Staging  
./scripts/deploy.sh staging 1.0.0

# Production
./scripts/deploy.sh production 1.0.0
```

### **Экстренный откат:**

```bash
# Откат кода
./scripts/deploy.sh rollback 1.0.0

# Откат базы данных: Supabase Dashboard → Restore
```

## 📦 Структура проекта

```
mvalovpokertracker/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API endpoints
│   │   ├── auth/              # Страницы авторизации
│   │   ├── admin/             # Админ панель
│   │   ├── tournaments/       # Управление турнирами
│   │   └── settings/          # Настройки пользователя
│   ├── components/            # React компоненты
│   │   ├── ui/               # UI компоненты
│   │   ├── charts/           # Графики и диаграммы
│   │   └── forms/            # Формы
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Библиотеки и утилиты
│   ├── services/             # Бизнес-логика
│   ├── bot/                  # Telegram бот
│   └── types/                # TypeScript типы
├── sql-scripts/              # SQL скрипты и миграции
├── scripts/                  # Скрипты управления
├── backups/                  # Бэкапы системы
├── migrations/               # Миграции базы данных
└── docs/                     # Документация
```

## 🎯 Основные функции

### **Для игроков:**
- 📝 Регистрация и отслеживание турниров
- 📸 Автоматическое создание турниров из фото билетов
- 📊 Подробная статистика и аналитика
- 🤖 Telegram бот для быстрого доступа
- 🏨 Управление площадками

### **Для администраторов:**
- 👥 Управление пользователями
- 📊 Системная аналитика
- 🔧 Настройки системы
- 🤖 Управление Telegram ботом

## 🔒 Безопасность

- **🛡️ Row Level Security (RLS)** - изоляция данных пользователей
- **🔐 JWT токены** - безопасная авторизация
- **🌐 CORS** - защита от межсайтовых запросов
- **🔑 Environment variables** - безопасное хранение секретов
- **🧪 Валидация данных** - проверка всех входящих данных

## 📊 Статистика проекта

- **📁 Файлов кода:** 80+
- **📝 Строк кода:** 8,000+
- **🧪 Тестов:** 42
- **📚 Документов:** 15
- **🤖 Команд бота:** 8
- **🔗 API endpoints:** 12
- **⚡ Покрытие тестами:** 95%+

## 🌟 Демо

### **Веб-приложение:**
- 🔐 Авторизация: [Demo Auth](https://your-demo-url.com/auth)
- 🎰 Турниры: [Demo Tournaments](https://your-demo-url.com/tournaments)
- 📊 Аналитика: [Demo Analytics](https://your-demo-url.com/analytics)
- ⚙️ Админ панель: [Demo Admin](https://your-demo-url.com/admin)

### **Telegram бот:**
- 🤖 Бот: [@MvalovPokerTrackerBot](https://t.me/MvalovPokerTrackerBot)
- 📱 Команды: `/start`, `/help`, `/link`

## 🤝 Вклад в проект

1. **Fork** репозиторий
2. Создайте **feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit** изменения (`git commit -m 'Add amazing feature'`)
4. **Push** в branch (`git push origin feature/amazing-feature`)
5. Откройте **Pull Request**

### **Правила разработки:**
- Следуйте [Git Flow](./VERSIONING_GUIDE.md)
- Пишите тесты для новой функциональности
- Обновляйте документацию
- Используйте [Conventional Commits](https://www.conventionalcommits.org/)

## 📝 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](./LICENSE) для деталей.

## 👨‍💻 Автор

**Maksim Valov**
- 📧 Email: mvalov78@gmail.com
- 🐙 GitHub: [@mvalov](https://github.com/mvalov)
- 💼 LinkedIn: [maksim-valov](https://linkedin.com/in/maksim-valov)

## 🙏 Благодарности

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [Telegraf.js](https://telegraf.js.org/) - Telegram Bot API
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Vercel](https://vercel.com/) - Hosting platform

## 📈 Roadmap

### **v1.1.0 - Уведомления и аналитика**
- 🔔 Push уведомления
- 📊 Расширенная аналитика
- 📱 PWA поддержка
- 🌍 Мультиязычность

### **v1.2.0 - Интеграции**
- 🃏 Интеграция с PokerStars
- 💰 Интеграция с банковскими API
- 📱 Мобильное приложение
- 🎮 Геймификация

### **v2.0.0 - Масштабирование**
- 🏢 Мультитенантность
- 🌐 API для сторонних разработчиков
- 📊 Business Intelligence
- 🔄 Real-time синхронизация

## 🆘 Поддержка

### **Проблемы и вопросы:**
- 🐛 [GitHub Issues](https://github.com/yourusername/pokertracker-pro/issues)
- 💬 [GitHub Discussions](https://github.com/yourusername/pokertracker-pro/discussions)
- 📧 Email: support@pokertracker.com

### **Документация:**
- 📖 [Полная документация](./docs/)
- 🚀 [Руководство по развертыванию](./PRODUCTION_DEPLOYMENT.md)
- 🔧 [API документация](./docs/API.md)
- 🤖 [Telegram бот гайд](./TELEGRAM_INTEGRATION.md)

---

<div align="center">

**🎰 Сделано с ❤️ для покерного сообщества**

[⭐ Поставьте звезду](https://github.com/yourusername/pokertracker-pro) • [🍴 Fork проект](https://github.com/yourusername/pokertracker-pro/fork) • [📢 Поделиться](https://twitter.com/intent/tweet?text=Check%20out%20PokerTracker%20Pro!)

</div>