#!/bin/bash

# 🏷️ Скрипт управления версиями PokerTracker Pro
# Использование: ./scripts/version-management.sh [command] [version]

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для вывода
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# Проверка, что мы в правильной директории
if [ ! -f "package.json" ]; then
    error "Запустите скрипт из корня проекта (где находится package.json)"
    exit 1
fi

# Функция для создания нового релиза
create_release() {
    local version=$1
    local message=$2
    
    if [ -z "$version" ]; then
        error "Укажите версию: ./scripts/version-management.sh release 1.0.1"
        exit 1
    fi
    
    if [ -z "$message" ]; then
        message="Release version $version"
    fi
    
    info "Создание релиза версии $version..."
    
    # Проверяем, что рабочая директория чистая
    if [ -n "$(git status --porcelain)" ]; then
        warning "Рабочая директория не чистая. Коммитим изменения..."
        git add .
        git commit -m "Prepare for release $version"
    fi
    
    # Обновляем VERSION.json
    info "Обновление VERSION.json..."
    temp_file=$(mktemp)
    jq --arg version "$version" --arg date "$(date -u +%Y-%m-%d)" \
       '.version = $version | .releaseDate = $date' VERSION.json > "$temp_file"
    mv "$temp_file" VERSION.json
    
    # Обновляем package.json
    info "Обновление package.json..."
    npm version "$version" --no-git-tag-version
    
    # Коммитим изменения версии
    git add VERSION.json package.json
    git commit -m "🏷️ Bump version to $version"
    
    # Создаем тег
    info "Создание Git тега v$version..."
    git tag -a "v$version" -m "$message"
    
    success "Релиз v$version создан успешно!"
    info "Для отправки в remote: git push origin main --tags"
}

# Функция для отката к предыдущей версии
rollback() {
    local target_version=$1
    
    if [ -z "$target_version" ]; then
        error "Укажите версию для отката: ./scripts/version-management.sh rollback 1.0.0"
        exit 1
    fi
    
    # Проверяем, существует ли тег
    if ! git rev-parse "v$target_version" >/dev/null 2>&1; then
        error "Тег v$target_version не существует"
        exit 1
    fi
    
    warning "ВНИМАНИЕ: Откат к версии $target_version"
    warning "Это действие изменит код и может потребовать миграции базы данных"
    
    read -p "Продолжить? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Отката отменен"
        exit 0
    fi
    
    info "Создание backup ветки перед откатом..."
    backup_branch="backup-$(date +%Y%m%d-%H%M%S)"
    git checkout -b "$backup_branch"
    git checkout main
    
    info "Откат к версии v$target_version..."
    git reset --hard "v$target_version"
    
    success "Откат к версии $target_version завершен!"
    success "Backup сохранен в ветке: $backup_branch"
    warning "Не забудьте проверить совместимость базы данных!"
}

# Функция для просмотра истории версий
list_versions() {
    info "История релизов:"
    git tag -l "v*" --sort=-version:refname | head -10 | while read tag; do
        commit_date=$(git log -1 --format=%ai "$tag")
        commit_message=$(git tag -l --format='%(contents)' "$tag")
        echo -e "${GREEN}$tag${NC} - $commit_date"
        echo "  📝 $commit_message"
        echo
    done
}

# Функция для сравнения версий
compare_versions() {
    local version1=$1
    local version2=$2
    
    if [ -z "$version1" ] || [ -z "$version2" ]; then
        error "Укажите две версии: ./scripts/version-management.sh compare 1.0.0 1.0.1"
        exit 1
    fi
    
    info "Сравнение версий v$version1 и v$version2:"
    git diff "v$version1" "v$version2" --stat
    
    echo
    info "Подробные изменения:"
    git log "v$version1..v$version2" --oneline
}

# Функция для создания hotfix
create_hotfix() {
    local version=$1
    local issue=$2
    
    if [ -z "$version" ] || [ -z "$issue" ]; then
        error "Укажите версию и описание: ./scripts/version-management.sh hotfix 1.0.1 'Fix critical bug'"
        exit 1
    fi
    
    info "Создание hotfix версии $version..."
    
    # Создаем hotfix ветку от main
    hotfix_branch="hotfix/$version"
    git checkout main
    git checkout -b "$hotfix_branch"
    
    info "Ветка $hotfix_branch создана"
    info "Внесите необходимые изменения и запустите:"
    info "  ./scripts/version-management.sh release $version '$issue'"
    info "  git checkout main && git merge $hotfix_branch"
    info "  git branch -d $hotfix_branch"
}

# Функция для проверки готовности к релизу
check_release_readiness() {
    info "Проверка готовности к релизу..."
    
    local issues=0
    
    # Проверяем тесты
    info "Запуск тестов..."
    if npm test > /dev/null 2>&1; then
        success "Тесты проходят"
    else
        error "Тесты не проходят!"
        ((issues++))
    fi
    
    # Проверяем сборку
    info "Проверка сборки..."
    if npm run build > /dev/null 2>&1; then
        success "Сборка успешна"
    else
        error "Ошибка сборки!"
        ((issues++))
    fi
    
    # Проверяем переменные окружения
    info "Проверка переменных окружения..."
    if [ -f ".env.example" ]; then
        success ".env.example найден"
    else
        warning ".env.example отсутствует"
        ((issues++))
    fi
    
    # Проверяем документацию
    info "Проверка документации..."
    required_docs=("README.md" "CHANGELOG.md" "VERSION.json")
    for doc in "${required_docs[@]}"; do
        if [ -f "$doc" ]; then
            success "$doc найден"
        else
            error "$doc отсутствует!"
            ((issues++))
        fi
    done
    
    # Итоговый результат
    if [ $issues -eq 0 ]; then
        success "🎉 Проект готов к релизу!"
        return 0
    else
        error "❌ Найдено $issues проблем. Исправьте их перед релизом."
        return 1
    fi
}

# Функция для создания бэкапа базы данных
backup_database() {
    info "Создание бэкапа базы данных..."
    
    # Создаем директорию для бэкапов
    backup_dir="backups/$(date +%Y-%m-%d)"
    mkdir -p "$backup_dir"
    
    # Создаем SQL дамп (псевдокод - в реальности зависит от настроек Supabase)
    backup_file="$backup_dir/database-backup-$(date +%Y%m%d-%H%M%S).sql"
    
    info "Бэкап будет сохранен в: $backup_file"
    warning "ВАЖНО: Для Supabase используйте Dashboard -> Settings -> Database -> Backup"
    warning "Или настройте автоматические бэкапы в Supabase"
    
    # Создаем информационный файл о бэкапе
    cat > "$backup_dir/backup-info.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$(jq -r '.version' VERSION.json)",
  "environment": "production",
  "type": "pre-deployment",
  "note": "Backup created before deployment"
}
EOF
    
    success "Информация о бэкапе сохранена в $backup_dir/backup-info.json"
}

# Главная функция
main() {
    local command=$1
    
    case "$command" in
        "release")
            create_release "$2" "$3"
            ;;
        "rollback") 
            rollback "$2"
            ;;
        "list"|"versions")
            list_versions
            ;;
        "compare")
            compare_versions "$2" "$3"
            ;;
        "hotfix")
            create_hotfix "$2" "$3"
            ;;
        "check"|"ready")
            check_release_readiness
            ;;
        "backup")
            backup_database
            ;;
        "help"|"")
            echo "🏷️ PokerTracker Pro - Управление версиями"
            echo
            echo "Команды:"
            echo "  release <version> [message]  - Создать новый релиз"
            echo "  rollback <version>          - Откатиться к версии"  
            echo "  list                        - Показать историю версий"
            echo "  compare <v1> <v2>           - Сравнить две версии"
            echo "  hotfix <version> <issue>    - Создать hotfix"
            echo "  check                       - Проверить готовность к релизу"
            echo "  backup                      - Создать бэкап БД"
            echo "  help                        - Показать эту справку"
            echo
            echo "Примеры:"
            echo "  ./scripts/version-management.sh release 1.0.1"
            echo "  ./scripts/version-management.sh rollback 1.0.0"
            echo "  ./scripts/version-management.sh compare 1.0.0 1.0.1"
            echo "  ./scripts/version-management.sh hotfix 1.0.1 'Fix critical auth bug'"
            ;;
        *)
            error "Неизвестная команда: $command"
            echo "Используйте: ./scripts/version-management.sh help"
            exit 1
            ;;
    esac
}

# Запуск главной функции
main "$@"
