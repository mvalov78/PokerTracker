#!/bin/bash

# 🔧 PokerTracker Pro - Исправление проблем авторизации на продакшене

set -e

echo "🔧 Исправление проблем авторизации на продакшене"
echo "================================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для создания исправленной конфигурации
create_production_env() {
    echo -e "\n${BLUE}📝 Создание production .env конфигурации...${NC}"
    
    # Запрашиваем URL продакшена
    echo -e "${YELLOW}Введите URL вашего продакшен приложения (например: https://poker-tracker.vercel.app):${NC}"
    read -r PRODUCTION_URL
    
    if [ -z "$PRODUCTION_URL" ]; then
        echo -e "${RED}❌ URL не может быть пустым${NC}"
        exit 1
    fi
    
    # Убираем trailing slash если есть
    PRODUCTION_URL=${PRODUCTION_URL%/}
    
    # Создаем .env.production
    cat > .env.production << EOF
# Production Environment Variables for PokerTracker Pro
# Copy these to Vercel Dashboard → Settings → Environment Variables

# App Configuration
NEXT_PUBLIC_APP_URL=$PRODUCTION_URL

# Supabase Configuration (copy from your Supabase Dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth (optional - get from Google Cloud Console)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Bot Mode Configuration for Production
BOT_MODE=webhook
BOT_WEBHOOK_URL=$PRODUCTION_URL/api/bot/webhook
BOT_AUTO_RESTART=true
EOF
    
    echo -e "${GREEN}✅ Создан файл .env.production${NC}"
    echo -e "📄 Скопируйте эти переменные в Vercel Dashboard"
}

# Функция для создания Vercel deployment script
create_vercel_deploy_script() {
    echo -e "\n${BLUE}🚀 Создание скрипта деплоя для Vercel...${NC}"
    
    cat > scripts/deploy-production.sh << 'EOF'
#!/bin/bash

# 🚀 Deploy to Vercel with proper environment variables

set -e

echo "🚀 Deploying PokerTracker Pro to Vercel..."

# Проверяем что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Запустите скрипт из корневой директории проекта"
    exit 1
fi

# Проверяем что .env.production существует
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production не найден. Создайте его сначала."
    echo "Запустите: ./scripts/fix-production-auth.sh"
    exit 1
fi

echo "📋 Проверяем переменные окружения..."

# Читаем переменные из .env.production
source .env.production

# Проверяем критические переменные
if [ -z "$NEXT_PUBLIC_APP_URL" ] || [ "$NEXT_PUBLIC_APP_URL" = "https://your-app.vercel.app" ]; then
    echo "❌ NEXT_PUBLIC_APP_URL не настроен в .env.production"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ "$NEXT_PUBLIC_SUPABASE_URL" = "https://your-project.supabase.co" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL не настроен в .env.production"
    exit 1
fi

echo "✅ Переменные окружения проверены"

# Деплой
echo "🚀 Запуск деплоя..."
vercel --prod

echo ""
echo "✅ Деплой завершен!"
echo ""
echo "🔧 Следующие шаги:"
echo "1. Откройте Vercel Dashboard"
echo "2. Settings → Environment Variables"
echo "3. Добавьте переменные из .env.production"
echo "4. Redeploy приложение"
echo ""
echo "🔗 Важно: Обновите Supabase Auth settings:"
echo "   - Site URL: $NEXT_PUBLIC_APP_URL"
echo "   - Redirect URLs: $NEXT_PUBLIC_APP_URL/auth/callback"
EOF
    
    chmod +x scripts/deploy-production.sh
    echo -e "${GREEN}✅ Создан скрипт scripts/deploy-production.sh${NC}"
}

# Функция для создания инструкций по Supabase
create_supabase_instructions() {
    echo -e "\n${BLUE}📋 Создание инструкций по настройке Supabase...${NC}"
    
    cat > SUPABASE_PRODUCTION_SETUP.md << 'EOF'
# 🔧 Настройка Supabase для продакшена

## 🎯 Критические настройки для исправления зависания авторизации

### 1. **Auth Settings в Supabase Dashboard**

Откройте ваш проект в [Supabase Dashboard](https://app.supabase.com/) → Authentication → Settings:

#### **Site URL:**
```
https://your-app.vercel.app
```
⚠️ **ВАЖНО:** Должен точно совпадать с NEXT_PUBLIC_APP_URL

#### **Redirect URLs:**
```
https://your-app.vercel.app/auth/callback
https://your-app.vercel.app/auth
```

### 2. **Google OAuth Setup (если используется)**

В Google Cloud Console → APIs & Services → Credentials:

#### **Authorized JavaScript origins:**
```
https://your-app.vercel.app
```

#### **Authorized redirect URIs:**
```
https://your-app.vercel.app/auth/callback
https://eyytlxntilefnmkhjgot.supabase.co/auth/v1/callback
```

### 3. **Environment Variables в Vercel**

Vercel Dashboard → Settings → Environment Variables:

```bash
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
BOT_MODE=webhook
BOT_WEBHOOK_URL=https://your-app.vercel.app/api/bot/webhook
BOT_AUTO_RESTART=true
```

### 4. **Проверка настроек**

После применения настроек:

1. **Redeploy** приложение в Vercel
2. Откройте **DevTools** → Network tab
3. Попробуйте авторизацию
4. Проверьте что нет ошибок CORS или redirect

### 5. **Частые проблемы и решения**

#### **Зависание на кнопке "Войти":**
- Проверьте Site URL в Supabase
- Убедитесь что NEXT_PUBLIC_APP_URL правильный
- Очистите кеш браузера

#### **Ошибки CORS:**
- Добавьте ваш домен в Supabase Auth settings
- Проверьте Redirect URLs

#### **Google OAuth не работает:**
- Проверьте Google Cloud Console настройки
- Убедитесь что домен добавлен в Authorized origins

### 6. **Экстренное исправление**

Если проблема критическая:

1. Временно отключите Google OAuth
2. Используйте только email/password авторизацию
3. В Supabase Dashboard → Authentication → Providers отключите Google
4. Redeploy приложение

### 7. **Тестирование**

После исправления:
```bash
# Проверьте основные endpoints
curl https://your-app.vercel.app
curl https://your-app.vercel.app/auth
curl https://your-app.vercel.app/api/health
```

Все должны возвращать 200 или корректные ответы.
EOF
    
    echo -e "${GREEN}✅ Создан файл SUPABASE_PRODUCTION_SETUP.md${NC}"
}

# Функция для создания health check endpoint
create_health_endpoint() {
    echo -e "\n${BLUE}🏥 Создание health check endpoint...${NC}"
    
    mkdir -p src/app/api/health
    
    cat > src/app/api/health/route.ts << 'EOF'
import { NextResponse } from "next/server";

/**
 * Health check endpoint для мониторинга приложения
 * GET /api/health
 */
export async function GET() {
  try {
    // Проверяем основные переменные окружения
    const requiredEnvVars = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_APP_URL"
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "unknown",
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "not-set",
      supabaseConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      googleOAuthConfigured: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      botConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
      botMode: process.env.BOT_MODE || "polling",
      missingEnvVars: missingVars.length > 0 ? missingVars : undefined
    };

    // Если есть критические проблемы, возвращаем 500
    if (missingVars.length > 0) {
      return NextResponse.json(
        { ...health, status: "error" },
        { status: 500 }
      );
    }

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
EOF
    
    echo -e "${GREEN}✅ Создан health check endpoint: /api/health${NC}"
}

# Функция для создания фикса middleware
fix_middleware() {
    echo -e "\n${BLUE}🔧 Проверка и исправление middleware...${NC}"
    
    # Создаем бэкап текущего middleware
    if [ -f "middleware.ts" ]; then
        cp middleware.ts middleware.ts.backup
        echo -e "📄 Создан бэкап: middleware.ts.backup"
    fi
    
    # Проверяем на наличие проблемных паттернов
    if grep -q "process.env.NEXT_PUBLIC_SUPABASE_URL!" middleware.ts; then
        echo -e "${YELLOW}⚠️  Найдено использование ! assertion в middleware${NC}"
        
        # Создаем исправленную версию
        sed -i.bak 's/process\.env\.NEXT_PUBLIC_SUPABASE_URL!/process.env.NEXT_PUBLIC_SUPABASE_URL || ""/g' middleware.ts
        sed -i.bak 's/process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY!/process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""/g' middleware.ts
        
        echo -e "${GREEN}✅ Исправлены ! assertions в middleware${NC}"
    fi
}

# Основная функция
main() {
    echo -e "${GREEN}🚀 Запуск исправления проблем авторизации...${NC}"
    
    # Создаем директорию scripts если её нет
    mkdir -p scripts
    
    # Запускаем исправления
    create_production_env
    create_vercel_deploy_script
    create_supabase_instructions
    create_health_endpoint
    fix_middleware
    
    echo -e "\n=================================================="
    echo -e "${GREEN}✅ Исправления созданы!${NC}"
    echo -e "\n${YELLOW}📋 Следующие шаги:${NC}"
    echo -e "1. 📝 Отредактируйте .env.production с вашими реальными данными"
    echo -e "2. 🔧 Следуйте инструкциям в SUPABASE_PRODUCTION_SETUP.md"
    echo -e "3. 🚀 Запустите: ./scripts/deploy-production.sh"
    echo -e "4. 🏥 Проверьте health: https://your-app.vercel.app/api/health"
    
    echo -e "\n${BLUE}🎯 Главные причины зависания авторизации:${NC}"
    echo -e "• NEXT_PUBLIC_APP_URL указывает на localhost вместо продакшен домена"
    echo -e "• Site URL в Supabase не совпадает с продакшен доменом"
    echo -e "• Redirect URLs не включают продакшен домен"
    echo -e "• Google OAuth настроен для localhost"
    
    echo -e "\n${GREEN}🔧 Эти исправления решат проблему!${NC}"
}

# Запуск
main
