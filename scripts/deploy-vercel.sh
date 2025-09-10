#!/bin/bash

# 🚀 Скрипт быстрого деплоя на Vercel
# Автоматизирует процесс развертывания PokerTracker Pro

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# Проверка зависимостей
check_dependencies() {
    info "Проверка зависимостей..."
    
    # Проверяем Vercel CLI
    if ! command -v vercel &> /dev/null; then
        warning "Vercel CLI не установлен. Устанавливаем..."
        npm install -g vercel
        success "Vercel CLI установлен"
    else
        success "Vercel CLI найден"
    fi
    
    # Проверяем jq
    if ! command -v jq &> /dev/null; then
        error "jq не установлен. Установите: brew install jq"
        exit 1
    fi
    
    # Проверяем curl
    if ! command -v curl &> /dev/null; then
        error "curl не найден"
        exit 1
    fi
}

# Предварительные проверки
pre_deploy_checks() {
    info "Предварительные проверки..."
    
    # Проверяем что мы в правильной директории
    if [ ! -f "package.json" ]; then
        error "Запустите скрипт из корня проекта"
        exit 1
    fi
    
    # Проверяем Git статус
    if [ -n "$(git status --porcelain)" ]; then
        warning "Рабочая директория не чистая"
        read -p "Коммитить изменения? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            git commit -m "Pre-deploy commit $(date)"
            git push origin main
            success "Изменения отправлены в GitHub"
        else
            error "Коммитьте изменения перед деплоем"
            exit 1
        fi
    fi
    
    # Проверяем тесты (быстрые)
    info "Проверка ключевых тестов..."
    if npm test -- src/__tests__/integration/auth-integration.test.ts --silent; then
        success "Ключевые тесты проходят"
    else
        error "Критические тесты не проходят!"
        exit 1
    fi
}

# Логин в Vercel
vercel_login() {
    info "Проверка авторизации в Vercel..."
    
    if vercel whoami > /dev/null 2>&1; then
        local user=$(vercel whoami)
        success "Авторизован как: $user"
    else
        info "Требуется авторизация в Vercel..."
        vercel login
        success "Авторизация завершена"
    fi
}

# Настройка проекта Vercel
setup_vercel_project() {
    info "Настройка Vercel проекта..."
    
    # Проверяем существует ли проект
    if [ -f ".vercel/project.json" ]; then
        success "Vercel проект уже настроен"
        return 0
    fi
    
    # Инициализируем проект
    info "Инициализация нового Vercel проекта..."
    vercel --yes
    
    success "Vercel проект настроен"
}

# Настройка переменных окружения
setup_environment_variables() {
    local env_type=$1
    
    info "Настройка переменных окружения для $env_type..."
    
    # Проверяем наличие .env.example
    if [ ! -f ".env.example" ]; then
        error ".env.example не найден"
        return 1
    fi
    
    warning "ВАЖНО: Настройте переменные окружения в Vercel Dashboard:"
    warning "https://vercel.com/dashboard → Settings → Environment Variables"
    echo
    
    info "Обязательные переменные из .env.example:"
    grep -E "^[^#].*=" .env.example | head -10
    echo
    
    read -p "Переменные окружения настроены в Vercel Dashboard? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        warning "Настройте переменные окружения и запустите скрипт снова"
        exit 1
    fi
}

# Деплой в preview (staging)
deploy_preview() {
    info "Деплой в preview (staging)..."
    
    vercel --yes
    
    local preview_url=$(vercel ls | grep "https://" | head -1 | awk '{print $2}')
    
    if [ -n "$preview_url" ]; then
        success "Preview деплой завершен: $preview_url"
        
        # Быстрая проверка
        info "Проверка доступности..."
        if curl -s "$preview_url" > /dev/null; then
            success "Приложение отвечает"
        else
            warning "Приложение не отвечает, проверьте логи"
        fi
    else
        error "Не удалось получить URL preview деплоя"
    fi
}

# Деплой в production
deploy_production() {
    local version=$1
    
    if [ -z "$version" ]; then
        version=$(jq -r '.version' VERSION.json 2>/dev/null || echo "1.0.0")
    fi
    
    warning "🚨 ДЕПЛОЙ В PRODUCTION!"
    warning "Версия: $version"
    warning "Это повлияет на живую систему!"
    
    read -p "Продолжить production деплой? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Production деплой отменен"
        return 0
    fi
    
    info "Деплой в production..."
    
    # Production деплой
    vercel --prod --yes
    
    local prod_url=$(vercel ls --prod | grep "https://" | head -1 | awk '{print $2}')
    
    if [ -n "$prod_url" ]; then
        success "🎉 Production деплой завершен!"
        success "🌐 URL: $prod_url"
        
        # Проверка доступности
        info "Проверка production приложения..."
        sleep 5 # Ждем немного для инициализации
        
        if curl -s "$prod_url" > /dev/null; then
            success "✅ Production приложение работает!"
        else
            error "❌ Production приложение не отвечает"
        fi
        
        # Настройка Telegram webhook
        setup_telegram_webhook "$prod_url"
        
    else
        error "Не удалось получить production URL"
    fi
}

# Настройка Telegram webhook
setup_telegram_webhook() {
    local app_url=$1
    
    info "Настройка Telegram webhook..."
    
    if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
        warning "TELEGRAM_BOT_TOKEN не установлен в окружении"
        read -p "Введите токен бота: " bot_token
    else
        bot_token=$TELEGRAM_BOT_TOKEN
    fi
    
    if [ -n "$bot_token" ]; then
        local webhook_url="$app_url/api/bot/webhook"
        
        info "Установка webhook: $webhook_url"
        
        local response=$(curl -s -X POST "https://api.telegram.org/bot$bot_token/setWebhook" \
          -H "Content-Type: application/json" \
          -d "{
            \"url\": \"$webhook_url\",
            \"allowed_updates\": [\"message\", \"callback_query\"]
          }")
        
        if echo "$response" | jq -r '.ok' | grep -q "true"; then
            success "✅ Telegram webhook настроен"
            
            # Проверяем webhook
            info "Проверка webhook..."
            local webhook_info=$(curl -s "https://api.telegram.org/bot$bot_token/getWebhookInfo")
            echo "$webhook_info" | jq -r '.result.url'
            
        else
            error "❌ Ошибка настройки webhook:"
            echo "$response" | jq -r '.description'
        fi
    else
        warning "Пропускаем настройку Telegram webhook"
    fi
}

# Проверка деплоя
verify_deployment() {
    local app_url=$1
    
    info "Проверка развернутого приложения..."
    
    # Базовые проверки
    local checks=(
        "$app_url"
        "$app_url/api/tournaments"
        "$app_url/auth"
        "$app_url/admin"
    )
    
    for url in "${checks[@]}"; do
        if curl -s "$url" > /dev/null; then
            success "✅ $url отвечает"
        else
            error "❌ $url не отвечает"
        fi
    done
}

# Главная функция
main() {
    local command=$1
    local version=$2
    
    echo "🚀 PokerTracker Pro - Vercel Deployment"
    echo "Версия: $(jq -r '.version' VERSION.json 2>/dev/null || echo 'unknown')"
    echo
    
    case "$command" in
        "setup")
            check_dependencies
            vercel_login
            setup_vercel_project
            setup_environment_variables "production"
            success "🎉 Vercel проект настроен! Теперь запустите: ./scripts/deploy-vercel.sh preview"
            ;;
        "preview"|"staging")
            check_dependencies
            pre_deploy_checks
            vercel_login
            deploy_preview
            ;;
        "production"|"prod")
            check_dependencies
            pre_deploy_checks
            vercel_login
            deploy_production "$version"
            ;;
        "webhook")
            if [ -n "$2" ]; then
                setup_telegram_webhook "$2"
            else
                error "Укажите URL приложения: ./scripts/deploy-vercel.sh webhook https://your-app.vercel.app"
            fi
            ;;
        "verify")
            if [ -n "$2" ]; then
                verify_deployment "$2"
            else
                error "Укажите URL приложения: ./scripts/deploy-vercel.sh verify https://your-app.vercel.app"
            fi
            ;;
        "status")
            vercel_login
            vercel ls
            ;;
        "logs")
            vercel_login
            vercel logs
            ;;
        "help"|"")
            echo "🚀 Команды для деплоя на Vercel:"
            echo
            echo "  setup                    - Первоначальная настройка Vercel проекта"
            echo "  preview                  - Деплой в preview (staging)"
            echo "  production [version]     - Деплой в production"
            echo "  webhook <url>            - Настройка Telegram webhook"
            echo "  verify <url>             - Проверка развернутого приложения"
            echo "  status                   - Статус проекта"
            echo "  logs                     - Просмотр логов"
            echo "  help                     - Эта справка"
            echo
            echo "Примеры:"
            echo "  ./scripts/deploy-vercel.sh setup"
            echo "  ./scripts/deploy-vercel.sh preview"
            echo "  ./scripts/deploy-vercel.sh production 1.0.0"
            echo "  ./scripts/deploy-vercel.sh webhook https://your-app.vercel.app"
            echo
            echo "📚 Полная инструкция: VERCEL_DEPLOYMENT.md"
            ;;
        *)
            error "Неизвестная команда: $command"
            echo "Используйте: ./scripts/deploy-vercel.sh help"
            exit 1
            ;;
    esac
}

# Запуск
main "$@"
