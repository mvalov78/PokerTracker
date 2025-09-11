# ⚡ Быстрый деплой на Vercel

> **5-минутное развертывание PokerTracker Pro в продакшен**

## 🚀 Экспресс-инструкция

### **1️⃣ Установка Vercel CLI (1 мин)**

```bash
npm install -g vercel
vercel login
```

### **2️⃣ Настройка проекта (2 мин)**

```bash
# Делаем скрипт исполняемым
chmod +x scripts/deploy-vercel.sh

# Настройка Vercel проекта
./scripts/deploy-vercel.sh setup
```

### **3️⃣ Создание продакшен Supabase (2 мин)**

1. **Откройте [supabase.com/dashboard](https://supabase.com/dashboard)**
2. **Create new project:**
   - Name: `pokertracker-prod`
   - Password: Сильный пароль
3. **SQL Editor → New Query:**
   ```sql
   \i sql-scripts/setup-auth-schema-simple.sql
   \i sql-scripts/add-telegram-linking-table.sql
   ```

### **4️⃣ Настройка переменных в Vercel**

**Vercel Dashboard** → **Settings** → **Environment Variables:**

```bash
# Supabase (из нового проекта)
NEXT_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key  
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key

# Google OAuth (из Google Cloud Console)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Telegram (создайте нового бота через @BotFather)
TELEGRAM_BOT_TOKEN=your-new-bot-token

# App URL (получите после первого деплоя)
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

### **5️⃣ Деплой! (30 сек)**

```bash
# Preview деплой для тестирования
./scripts/deploy-vercel.sh preview

# После проверки - production деплой
./scripts/deploy-vercel.sh production 1.0.0
```

## ✅ Проверка работоспособности

### **Автоматическая проверка:**
```bash
# Проверка всех endpoints
./scripts/deploy-vercel.sh verify https://your-app.vercel.app
```

### **Ручная проверка:**
1. **Откройте приложение** в браузере
2. **Зарегистрируйтесь** через email или Google
3. **Создайте турнир** через веб-интерфейс
4. **Протестируйте Telegram бота**
5. **Свяжите аккаунты** через `/link`

## 🤖 Настройка Telegram бота

### **Автоматическая настройка:**
```bash
# После деплоя
./scripts/deploy-vercel.sh webhook https://your-app.vercel.app
```

### **Ручная настройка:**
```bash
# Установка webhook
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.vercel.app/api/bot/webhook"}'

# Проверка
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

## 🎯 Готово!

После выполнения этих шагов у вас будет:

- ✅ **Живое приложение** на Vercel
- ✅ **Автоматические деплои** из GitHub  
- ✅ **Рабочий Telegram бот**
- ✅ **Продакшен база данных**
- ✅ **Google OAuth** авторизация

## 🆘 Если что-то не работает

### **Частые проблемы:**

1. **Ошибки сборки:**
   ```bash
   # Проверьте локально
   npm run build
   
   # Проверьте логи в Vercel Dashboard
   vercel logs
   ```

2. **Проблемы с переменными:**
   ```bash
   # Проверьте в Vercel Dashboard → Settings → Environment Variables
   # Убедитесь что все обязательные переменные установлены
   ```

3. **Telegram бот не работает:**
   ```bash
   # Проверьте токен
   curl "https://api.telegram.org/botYOUR_TOKEN/getMe"
   
   # Проверьте webhook
   curl "https://your-app.vercel.app/api/bot/webhook"
   ```

## 📞 Поддержка

- 📧 **Email:** mvalov78@gmail.com
- 🐛 **Issues:** [GitHub Issues](https://github.com/mvalov78/PokerTracker/issues)
- 📚 **Документация:** [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

---

**🎰 Удачного деплоя! Пусть ваш PokerTracker Pro покорит мир! 🚀**

