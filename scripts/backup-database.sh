#!/bin/bash

# 💾 Скрипт бэкапа базы данных PokerTracker Pro
# Создает бэкап перед важными операциями

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
    
    if ! command -v jq &> /dev/null; then
        error "jq не установлен. Установите: brew install jq"
        exit 1
    fi
    
    if [ ! -f ".env.local" ]; then
        error ".env.local не найден. Настройте переменные окружения."
        exit 1
    fi
    
    success "Все зависимости найдены"
}

# Создание структуры директорий для бэкапов
create_backup_structure() {
    local backup_date=$(date +%Y-%m-%d)
    local backup_time=$(date +%H-%M-%S)
    
    export BACKUP_DIR="backups/$backup_date"
    export BACKUP_FILE="$BACKUP_DIR/backup-$backup_time"
    
    mkdir -p "$BACKUP_DIR"
    
    info "Директория бэкапа: $BACKUP_DIR"
}

# Создание бэкапа метаданных проекта
backup_metadata() {
    info "Создание бэкапа метаданных..."
    
    local metadata_file="$BACKUP_DIR/metadata.json"
    
    cat > "$metadata_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": $(cat VERSION.json | jq '.version'),
  "environment": "${NODE_ENV:-development}",
  "git": {
    "branch": "$(git branch --show-current)",
    "commit": "$(git rev-parse HEAD)",
    "tag": "$(git describe --tags --exact-match 2>/dev/null || echo 'none')"
  },
  "nodejs": "$(node --version)",
  "npm": "$(npm --version)",
  "backup_type": "pre-deployment"
}
EOF
    
    success "Метаданные сохранены в $metadata_file"
}

# Создание бэкапа SQL скриптов
backup_sql_scripts() {
    info "Создание бэкапа SQL скриптов..."
    
    local sql_backup_dir="$BACKUP_DIR/sql-scripts"
    mkdir -p "$sql_backup_dir"
    
    if [ -d "sql-scripts" ]; then
        cp -r sql-scripts/* "$sql_backup_dir/"
        success "SQL скрипты скопированы в $sql_backup_dir"
    else
        warning "Директория sql-scripts не найдена"
    fi
}

# Создание бэкапа конфигурационных файлов
backup_config() {
    info "Создание бэкапа конфигурации..."
    
    local config_backup_dir="$BACKUP_DIR/config"
    mkdir -p "$config_backup_dir"
    
    # Копируем важные конфигурационные файлы
    config_files=(
        "package.json"
        "package-lock.json"
        "next.config.ts"
        "tailwind.config.js"
        "tsconfig.json"
        "jest.config.js"
        "biome.json"
        ".env.example"
    )
    
    for file in "${config_files[@]}"; do
        if [ -f "$file" ]; then
            cp "$file" "$config_backup_dir/"
            info "✓ $file"
        fi
    done
    
    success "Конфигурация сохранена в $config_backup_dir"
}

# Инструкции по бэкапу Supabase
create_supabase_backup_instructions() {
    info "Создание инструкций по бэкапу Supabase..."
    
    cat > "$BACKUP_DIR/SUPABASE_BACKUP.md" << 'EOF'
# 💾 Инструкции по бэкапу Supabase

## 🔄 Автоматический бэкап

1. Откройте **Supabase Dashboard**
2. Перейдите в **Settings** → **Database**
3. В разделе **Backup** настройте автоматические бэкапы
4. Рекомендуется: ежедневные бэкапы с хранением 30 дней

## 📥 Ручной бэкап

### Через Dashboard:
1. **Settings** → **Database** → **Backup**
2. Нажмите **Create backup**
3. Дождитесь завершения
4. Скачайте файл бэкапа

### Через SQL Editor:
```sql
-- Экспорт всех таблиц
SELECT * FROM pg_dump('your_database_name');
```

### Через CLI (если настроен):
```bash
# Установите Supabase CLI
npm install -g supabase

# Логин
supabase login

# Создание бэкапа
supabase db dump -f backup.sql
```

## 🔄 Восстановление из бэкапа

### Через Dashboard:
1. **Settings** → **Database** → **Restore**
2. Выберите файл бэкапа
3. Подтвердите восстановление

### Через SQL Editor:
```sql
-- Восстановление из файла
-- Загрузите содержимое backup.sql в SQL Editor
```

## ⚠️ ВАЖНО

- Всегда создавайте бэкап перед важными изменениями
- Проверяйте целостность бэкапов
- Храните бэкапы в безопасном месте
- Тестируйте процедуру восстановления

## 📋 Чек-лист перед деплоем

- [ ] Создан бэкап базы данных
- [ ] Проверена целостность бэкапа
- [ ] Бэкап сохранен в безопасном месте
- [ ] Команда знает процедуру восстановления
EOF

    success "Инструкции по бэкапу созданы: $BACKUP_DIR/SUPABASE_BACKUP.md"
}

# Создание полного бэкапа
full_backup() {
    info "🚀 Создание полного бэкапа системы..."
    
    check_dependencies
    create_backup_structure
    backup_metadata
    backup_sql_scripts
    backup_config
    create_supabase_backup_instructions
    
    # Создаем архив
    local archive_name="$BACKUP_FILE.tar.gz"
    tar -czf "$archive_name" -C "backups" "$(basename "$BACKUP_DIR")"
    
    success "🎉 Полный бэкап создан!"
    success "📁 Директория: $BACKUP_DIR"
    success "📦 Архив: $archive_name"
    
    warning "Не забудьте создать бэкап базы данных в Supabase Dashboard!"
    
    # Показываем размер бэкапа
    local size=$(du -h "$archive_name" | cut -f1)
    info "Размер архива: $size"
}

# Главная функция
main() {
    local command=$1
    
    case "$command" in
        "full")
            full_backup
            ;;
        "metadata")
            check_dependencies
            create_backup_structure
            backup_metadata
            ;;
        "sql")
            create_backup_structure
            backup_sql_scripts
            ;;
        "config")
            create_backup_structure
            backup_config
            ;;
        "instructions")
            create_backup_structure
            create_supabase_backup_instructions
            ;;
        "help"|"")
            echo "💾 PokerTracker Pro - Система бэкапов"
            echo
            echo "Команды:"
            echo "  full         - Полный бэкап (рекомендуется)"
            echo "  metadata     - Бэкап метаданных проекта"
            echo "  sql          - Бэкап SQL скриптов"
            echo "  config       - Бэкап конфигурационных файлов"
            echo "  instructions - Создать инструкции по Supabase"
            echo "  help         - Показать эту справку"
            echo
            echo "Пример:"
            echo "  ./scripts/backup-database.sh full"
            ;;
        *)
            error "Неизвестная команда: $command"
            echo "Используйте: ./scripts/backup-database.sh help"
            exit 1
            ;;
    esac
}

# Запуск
main "$@"


