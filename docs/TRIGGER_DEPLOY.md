# 🚀 Как запустить деплой на Vercel вручную

## Проблема
GitHub показывает изменения, но Vercel не подхватывает автоматически.

## ✅ Решение 1: Через веб-интерфейс Vercel (РЕКОМЕНДУЕТСЯ)

### Шаг 1: Откройте Vercel Dashboard
1. Перейдите на https://vercel.com/dashboard
2. Войдите в аккаунт `mvalov78`

### Шаг 2: Выберите проект
1. Найдите проект **PokerTracker** (или `pokertracker`)
2. Кликните на него

### Шаг 3: Триггерните новый деплой
**Вариант A - Через Deployments:**
1. Перейдите на вкладку "Deployments"
2. Нажмите кнопку "Redeploy" на последнем деплое
3. Выберите "Use existing Build Cache" → UNCHECKED ❌
4. Нажмите "Redeploy"

**Вариант B - Через Settings:**
1. Перейдите в "Settings" → "Git"
2. Нажмите "Redeploy" 
3. Или нажмите "Disconnect" и затем "Connect" заново для пересоздания webhook

**Вариант C - Создать пустой коммит (самый простой):**
Просто выполните в терминале:
```bash
cd /Users/mvalov/PokerTracker
git commit --allow-empty -m "trigger vercel deploy"
git push origin main
```

---

## 🔧 Решение 2: Проверка интеграции GitHub-Vercel

### Проверьте webhook в GitHub
1. Откройте https://github.com/mvalov78/PokerTracker/settings/hooks
2. Найдите webhook для Vercel (обычно `https://api.vercel.com/...`)
3. Проверьте статус последних deliveries
4. Если есть ошибки - нажмите "Redeliver" на последнем событии

### Если webhook отсутствует
1. В Vercel: Settings → Git → Disconnect
2. Затем: Git → Connect и выберите репозиторий заново
3. Это пересоздаст webhook

---

## 🔄 Решение 3: Пустой коммит (быстрый способ)

Создайте пустой коммит, чтобы триггернуть GitHub webhook:
```bash
cd /Users/mvalov/PokerTracker
git commit --allow-empty -m "trigger vercel deploy"
git push origin main
```

Vercel должен среагировать на этот push.

---

## 📊 Проверка статуса

### После запуска деплоя проверьте:

1. **Vercel Dashboard:**
   - Deployments → Должен появиться новый деплой со статусом "Building"
   - Подождите ~2 минуты до статуса "Ready"

2. **GitHub:**
   - Перейдите в репозиторий
   - Вкладка "Actions" или раздел коммитов
   - Должна быть зеленая галочка ✅ от Vercel

3. **Vercel CLI (опционально):**
   ```bash
   vercel ls
   ```

---

## 🐛 Если ничего не помогает

### Крайние меры:

1. **Пересоздать интеграцию:**
   - Vercel: Settings → Git → Disconnect
   - Затем заново: Import Project → Select GitHub → Выбрать репозиторий

2. **Проверить Environment Variables:**
   - Settings → Environment Variables
   - Убедитесь, что все переменные на месте:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `TELEGRAM_BOT_TOKEN`
     - И т.д.

3. **Проверить .gitignore:**
   - Убедитесь, что критичные файлы не игнорируются

4. **Связаться с Vercel Support:**
   - https://vercel.com/help

---

## ✅ Текущие изменения для деплоя

**Коммит:** `38afb38`
**Версия:** 1.4.3
**Описание:** Критическое исправление сессий при обработке фото в боте

**Файлы:**
- src/bot/handlers/photoHandler.ts
- src/app/api/telegram/webhook/route.ts
- package.json
- .cursor/rules/global.mdc
- docs/QUICK_FIX_SESSION_ERROR.md
- docs/RELEASE_v1.4.3.md

---

**Рекомендация:** Используйте Решение 3 (пустой коммит) - это самый быстрый способ!

