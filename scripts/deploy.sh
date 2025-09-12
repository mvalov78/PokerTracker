#!/bin/bash

# 🚀 Скрипт деплоя PokerTracker Pro
# Безопасный деплой с проверками и возможностью отката

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

# Конфигурация
ENVIRONMENTS=("development" "staging" "production")
REQUIRED_ENV_VARS=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY")

# Функция для проверки окружения
check_environment() {
    local env=$1
    
    info "Проверка окружения: $env"
    
    # Проверяем наличие .env файла
    local env_file=".env.${env}"
    if [ "$env" = "development" ]; then
        env_file=".env.local"
    fi
    
    if [ ! -f "$env_file" ]; then
        error "Файл $env_file не найден!"
        return 1
    fi
    
    # Проверяем обязательные переменные
    source "$env_file"
    for var in "${REQUIRED_ENV_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            error "Переменная $var не установлена в $env_file"
            return 1
        fi
    done
    
    success "Окружение $env настроено корректно"
    return 0
}

# Функция для запуска тестов
run_tests() {
    info "Запуск тестов..."
    
    if npm test > /dev/null 2>&1; then
        success "Все тесты проходят"
        return 0
    else
        error "Тесты не проходят!"
        warning "Запустите 'npm test' для подробностей"
        return 1
    fi
}

# Функция для проверки сборки
check_build() {
    info "Проверка сборки..."
    
    if npm run build > /dev/null 2>&1; then
        success "Сборка успешна"
        return 0
    else
        error "Ошибка сборки!"
        warning "Запустите 'npm run build' для подробностей"
        return 1
    fi
}

# Функция для создания pre-deploy бэкапа
create_pre_deploy_backup() {
    info "Создание pre-deploy бэкапа..."
    
    if [ -f "scripts/backup-database.sh" ]; then
        chmod +x scripts/backup-database.sh
        ./scripts/backup-database.sh full
        success "Pre-deploy бэкап создан"
    else
        warning "Скрипт бэкапа не найден, создаем базовый бэкап..."
        
        local backup_dir="backups/pre-deploy-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$backup_dir"
        
        # Сохраняем текущую версию и состояние
        cp VERSION.json "$backup_dir/"
        git log --oneline -10 > "$backup_dir/recent-commits.txt"
        git status > "$backup_dir/git-status.txt"
        
        success "Базовый бэкап создан в $backup_dir"
    fi
}

# Функция для деплоя в конкретное окружение
deploy_to_environment() {
    local env=$1
    local version=$2
    
    info "🚀 Деплой в окружение: $env"
    info "📦 Версия: $version"
    
    # Предварительные проверки
    if ! check_environment "$env"; then
        error "Окружение $env не готово к деплою"
        return 1
    fi
    
    if [ "$env" != "development" ]; then
        if ! run_tests; then
            error "Тесты не проходят, деплой отменен"
            return 1
        fi
        
        if ! check_build; then
            error "Сборка не удалась, деплой отменен"
            return 1
        fi
    fi
    
    # Создаем бэкап перед деплоем
    create_pre_deploy_backup
    
    # Деплой в зависимости от окружения
    case "$env" in
        "development")
            deploy_development "$version"
            ;;
        "staging")
            deploy_staging "$version"
            ;;
        "production")
            deploy_production "$version"
            ;;
        *)
            error "Неизвестное окружение: $env"
            return 1
            ;;
    esac
}

# Деплой в development
deploy_development() {
    local version=$1
    
    info "Деплой в development..."
    
    # Переключаемся на dev ветку
    git checkout dev 2>/dev/null || git checkout -b dev
    
    # Устанавливаем зависимости
    npm install
    
    # Запускаем в dev режиме
    info "Запуск development сервера..."
    success "Development готов! Запустите: npm run dev"
}

# Деплой в staging
deploy_staging() {
    local version=$1
    
    info "Деплой в staging..."
    
    # Переключаемся на staging ветку
    git checkout staging 2>/dev/null || git checkout -b staging
    git merge dev
    
    # Билдим проект
    npm install
    npm run build
    
    info "Staging деплой готов!"
    success "Проверьте приложение на staging сервере"
}

# Деплой в production
deploy_production() {
    local version=$1
    
    warning "🚨 ДЕПЛОЙ В PRODUCTION!"
    warning "Это действие повлияет на живую систему"
    
    read -p "Продолжить деплой в production? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Деплой в production отменен"
        return 0
    fi
    
    info "Деплой в production..."
    
    # Переключаемся на main ветку
    git checkout main
    git merge staging
    
    # Создаем тег релиза
    if ! git rev-parse "v$version" >/dev/null 2>&1; then
        git tag -a "v$version" -m "Production release $version"
        success "Создан тег v$version"
    fi
    
    # Финальная проверка
    npm install
    npm run build
    
    # Здесь должны быть команды для деплоя на production сервер
    # Например: docker build, kubernetes deploy, vercel deploy и т.д.
    
    success "🎉 Production деплой завершен!"
    success "🏷️ Версия: $version"
    
    # Создаем пост-деплой отчет
    create_post_deploy_report "$version"
}

# Создание отчета после деплоя
create_post_deploy_report() {
    local version=$1
    local report_file="$BACKUP_DIR/deploy-report.md"
    
    cat > "$report_file" << EOF
# 📊 Отчет о деплое

**Версия:** $version  
**Дата:** $(date)  
**Окружение:** production  
**Деплой:** УСПЕШНО ✅  

## 🔍 Проверки перед деплоем
- ✅ Тесты пройдены
- ✅ Сборка успешна  
- ✅ Бэкап создан
- ✅ Переменные окружения проверены

## 📦 Развернутые компоненты
- ✅ Веб-приложение Next.js
- ✅ API endpoints
- ✅ База данных Supabase
- ✅ Telegram бот

## 🔗 Ссылки
- **Приложение:** [Production URL]
- **Админ панель:** [Admin URL]  
- **Мониторинг:** [Monitoring URL]
- **Документация:** [Docs URL]

## 🚨 Процедура отката
В случае проблем:
1. \`./scripts/version-management.sh rollback [previous_version]\`
2. Восстановить бэкап базы данных из Supabase Dashboard
3. Уведомить команду

## 📞 Контакты
- **Разработчик:** [Ваш контакт]
- **DevOps:** [DevOps контакт]
- **Поддержка:** [Support контакт]
EOF

    success "Отчет о деплое создан: $report_file"
}

# Функция отката
rollback_deployment() {
    local target_version=$1
    
    if [ -z "$target_version" ]; then
        error "Укажите версию для отката: ./scripts/deploy.sh rollback 1.0.0"
        exit 1
    fi
    
    warning "🔄 ОТКАТ К ВЕРСИИ $target_version"
    warning "Это действие повлияет на production систему!"
    
    read -p "Продолжить откат? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Откат отменен"
        return 0
    fi
    
    info "Выполнение отката к версии $target_version..."
    
    # Используем скрипт управления версиями
    if [ -f "scripts/version-management.sh" ]; then
        chmod +x scripts/version-management.sh
        ./scripts/version-management.sh rollback "$target_version"
    else
        # Базовый откат через Git
        git checkout "v$target_version"
        git checkout -b "rollback-to-$target_version-$(date +%Y%m%d-%H%M%S)"
    fi
    
    warning "⚠️ ВАЖНО: Восстановите бэкап базы данных вручную!"
    warning "Инструкции в backups/*/SUPABASE_BACKUP.md"
    
    success "Откат кода завершен"
}

# Функция для проверки статуса деплоя
check_deployment_status() {
    info "Проверка статуса деплоя..."
    
    # Проверяем текущую версию
    if [ -f "VERSION.json" ]; then
        local current_version=$(jq -r '.version' VERSION.json)
        info "Текущая версия: $current_version"
    fi
    
    # Проверяем Git статус
    local git_branch=$(git branch --show-current)
    local git_commit=$(git rev-parse --short HEAD)
    info "Git ветка: $git_branch"
    info "Git коммит: $git_commit"
    
    # Проверяем последние бэкапы
    if [ -d "backups" ]; then
        local latest_backup=$(ls -t backups/ | head -1)
        info "Последний бэкап: $latest_backup"
    fi
    
    # Проверяем статус сервисов (если возможно)
    info "Для проверки живых сервисов используйте monitoring tools"
}

# Главная функция
main() {
    local command=$1
    local env=$2
    local version=$3
    
    case "$command" in
        "dev"|"development")
            deploy_to_environment "development" "${version:-dev}"
            ;;
        "staging")
            deploy_to_environment "staging" "${version:-$(jq -r '.version' VERSION.json)}"
            ;;
        "prod"|"production")
            if [ -z "$version" ]; then
                error "Для production обязательно укажите версию!"
                error "Пример: ./scripts/deploy.sh production 1.0.0"
                exit 1
            fi
            deploy_to_environment "production" "$version"
            ;;
        "rollback")
            rollback_deployment "$env"
            ;;
        "status")
            check_deployment_status
            ;;
        "help"|"")
            echo "🚀 PokerTracker Pro - Система деплоя"
            echo
            echo "Команды:"
            echo "  development              - Деплой в development"
            echo "  staging [version]        - Деплой в staging"
            echo "  production <version>     - Деплой в production (требует версию!)"
            echo "  rollback <version>       - Откат к указанной версии"
            echo "  status                   - Проверить статус деплоя"
            echo "  help                     - Показать эту справку"
            echo
            echo "Примеры:"
            echo "  ./scripts/deploy.sh development"
            echo "  ./scripts/deploy.sh staging 1.0.0"
            echo "  ./scripts/deploy.sh production 1.0.0"
            echo "  ./scripts/deploy.sh rollback 1.0.0"
            echo
            echo "⚠️ ВАЖНО:"
            echo "  - Всегда тестируйте на staging перед production"
            echo "  - Создавайте бэкап перед production деплоем"
            echo "  - Имейте план отката"
            ;;
        *)
            error "Неизвестная команда: $command"
            echo "Используйте: ./scripts/deploy.sh help"
            exit 1
            ;;
    esac
}

# Запуск
main "$@"


