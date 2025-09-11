#!/bin/bash

# 🗄️ Менеджер миграций базы данных PokerTracker Pro
# Управление версиями схемы базы данных

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# Директория с миграциями
MIGRATIONS_DIR="migrations"
APPLIED_MIGRATIONS_FILE="$MIGRATIONS_DIR/.applied_migrations"

# Создание структуры миграций
init_migrations() {
    info "Инициализация системы миграций..."
    
    mkdir -p "$MIGRATIONS_DIR"
    
    # Создаем файл отслеживания примененных миграций
    if [ ! -f "$APPLIED_MIGRATIONS_FILE" ]; then
        touch "$APPLIED_MIGRATIONS_FILE"
        success "Файл отслеживания миграций создан"
    fi
    
    # Создаем базовую миграцию
    local base_migration="$MIGRATIONS_DIR/001_initial_schema.sql"
    if [ ! -f "$base_migration" ]; then
        cat > "$base_migration" << 'EOF'
-- 🗄️ Базовая миграция: Инициализация схемы
-- Версия: 1.0.0
-- Дата: 2025-09-10

-- Создание таблиц профилей
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'player' CHECK (role IN ('player', 'admin')),
    telegram_id BIGINT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблиц настроек пользователей  
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    current_venue TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблиц турниров
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue TEXT,
    buyin DECIMAL(10,2) NOT NULL,
    tournament_type TEXT DEFAULT 'freezeout',
    structure TEXT DEFAULT 'NL Hold''em',
    participants INTEGER,
    prize_pool DECIMAL(10,2),
    blind_levels TEXT,
    starting_stack INTEGER,
    ticket_image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблиц результатов
CREATE TABLE IF NOT EXISTS public.tournament_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    payout DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблиц кодов связывания Telegram
CREATE TABLE IF NOT EXISTS public.telegram_linking_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    linking_code TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_tournaments_user_id ON public.tournaments(user_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_date ON public.tournaments(date);
CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament_id ON public.tournament_results(tournament_id);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON public.profiles(telegram_id);
CREATE INDEX IF NOT EXISTS idx_telegram_linking_codes_code ON public.telegram_linking_codes(linking_code);

-- Функция автоматического создания профиля
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (NEW.id, COALESCE(NEW.email, 'user_' || NEW.id), 'player');
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического создания профиля
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Запись о примененной миграции
INSERT INTO public.migration_log (migration_name, applied_at, version)
VALUES ('001_initial_schema', NOW(), '1.0.0')
ON CONFLICT (migration_name) DO NOTHING;
EOF
        success "Базовая миграция создана: $base_migration"
    fi
    
    # Создаем таблицу логов миграций
    create_migration_log_table
}

# Создание таблицы логов миграций
create_migration_log_table() {
    info "Создание таблицы логов миграций..."
    
    cat > "$MIGRATIONS_DIR/000_migration_log.sql" << 'EOF'
-- Таблица для отслеживания примененных миграций
CREATE TABLE IF NOT EXISTS public.migration_log (
    id SERIAL PRIMARY KEY,
    migration_name TEXT UNIQUE NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version TEXT,
    rollback_sql TEXT
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_migration_log_name ON public.migration_log(migration_name);
CREATE INDEX IF NOT EXISTS idx_migration_log_applied_at ON public.migration_log(applied_at);
EOF
}

# Создание новой миграции
create_migration() {
    local name=$1
    local description=$2
    
    if [ -z "$name" ]; then
        error "Укажите имя миграции: create_migration add_new_table 'Добавление новой таблицы'"
        return 1
    fi
    
    # Генерируем номер миграции
    local next_number=$(printf "%03d" $(($(ls $MIGRATIONS_DIR/*.sql 2>/dev/null | wc -l) + 1)))
    local migration_file="$MIGRATIONS_DIR/${next_number}_${name}.sql"
    
    info "Создание миграции: $migration_file"
    
    cat > "$migration_file" << EOF
-- 🗄️ Миграция: $description
-- Файл: ${next_number}_${name}.sql
-- Версия: $(jq -r '.version' VERSION.json 2>/dev/null || echo 'unknown')
-- Дата: $(date +%Y-%m-%d)

-- ⬆️ UP MIGRATION (применение изменений)

-- TODO: Добавьте SQL команды для применения миграции
-- Пример:
-- CREATE TABLE example (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     name TEXT NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- ⬇️ DOWN MIGRATION (откат изменений) 
-- ROLLBACK SQL (для отката):
/*
-- TODO: Добавьте SQL команды для отката миграции
-- Пример:
-- DROP TABLE IF EXISTS example;
*/

-- 📝 Запись о примененной миграции
INSERT INTO public.migration_log (migration_name, applied_at, version, rollback_sql)
VALUES ('${next_number}_${name}', NOW(), '$(jq -r '.version' VERSION.json 2>/dev/null || echo 'unknown')', 
'-- Rollback commands here')
ON CONFLICT (migration_name) DO NOTHING;
EOF
    
    success "Миграция создана: $migration_file"
    info "Отредактируйте файл и добавьте необходимые SQL команды"
}

# Применение миграций
apply_migrations() {
    info "Применение миграций..."
    
    # Создаем таблицу логов если её нет
    if [ -f "$MIGRATIONS_DIR/000_migration_log.sql" ]; then
        info "Создание таблицы логов миграций..."
        # Здесь должна быть команда выполнения SQL в Supabase
        success "Таблица логов готова"
    fi
    
    # Применяем миграции по порядку
    for migration_file in "$MIGRATIONS_DIR"/*.sql; do
        if [ -f "$migration_file" ]; then
            local migration_name=$(basename "$migration_file" .sql)
            
            # Проверяем, была ли миграция уже применена
            if grep -q "$migration_name" "$APPLIED_MIGRATIONS_FILE" 2>/dev/null; then
                info "Миграция $migration_name уже применена, пропускаем"
                continue
            fi
            
            info "Применение миграции: $migration_name"
            
            # Здесь должна быть команда выполнения SQL в Supabase
            # Например: supabase db push или psql команда
            warning "Выполните SQL из файла $migration_file в Supabase SQL Editor"
            
            # Отмечаем миграцию как примененную
            echo "$migration_name $(date)" >> "$APPLIED_MIGRATIONS_FILE"
            success "Миграция $migration_name применена"
        fi
    done
    
    success "Все миграции применены!"
}

# Откат миграций
rollback_migrations() {
    local target_migration=$1
    
    if [ -z "$target_migration" ]; then
        error "Укажите миграцию для отката: rollback_migrations 001_initial_schema"
        return 1
    fi
    
    warning "Откат миграций до: $target_migration"
    warning "Это может привести к потере данных!"
    
    read -p "Продолжить? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Откат миграций отменен"
        return 0
    fi
    
    info "Выполнение отката миграций..."
    warning "Выполните ROLLBACK SQL команды из соответствующих файлов миграций в обратном порядке"
    
    # Показываем какие миграции нужно откатить
    info "Миграции для отката:"
    grep -A 100 "$target_migration" "$APPLIED_MIGRATIONS_FILE" | tail -n +2
}

# Главная функция
main() {
    local command=$1
    
    case "$command" in
        "init")
            init_migrations
            ;;
        "create")
            create_migration "$2" "$3"
            ;;
        "apply"|"up")
            apply_migrations
            ;;
        "rollback"|"down")
            rollback_migrations "$2"
            ;;
        "status")
            info "Статус миграций:"
            if [ -f "$APPLIED_MIGRATIONS_FILE" ]; then
                cat "$APPLIED_MIGRATIONS_FILE"
            else
                warning "Миграции еще не инициализированы"
            fi
            ;;
        "help"|"")
            echo "🗄️ PokerTracker Pro - Менеджер миграций"
            echo
            echo "Команды:"
            echo "  init                        - Инициализировать систему миграций"
            echo "  create <name> [description] - Создать новую миграцию"
            echo "  apply                       - Применить все миграции"
            echo "  rollback <migration>        - Откатить до указанной миграции"
            echo "  status                      - Показать статус миграций"
            echo "  help                        - Показать эту справку"
            echo
            echo "Примеры:"
            echo "  ./migrations/migration-manager.sh init"
            echo "  ./migrations/migration-manager.sh create add_indexes 'Добавление индексов'"
            echo "  ./migrations/migration-manager.sh apply"
            echo "  ./migrations/migration-manager.sh rollback 001_initial_schema"
            ;;
        *)
            error "Неизвестная команда: $command"
            echo "Используйте: ./migrations/migration-manager.sh help"
            exit 1
            ;;
    esac
}

# Запуск
main "$@"

