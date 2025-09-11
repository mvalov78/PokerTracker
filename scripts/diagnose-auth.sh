#!/bin/bash

# 🔍 PokerTracker Pro - Диагностика проблем авторизации

set -e

echo "🔍 Диагностика проблем авторизации на продакшене"
echo "=================================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для проверки переменных окружения
check_env_vars() {
    echo -e "\n${BLUE}📋 Проверка переменных окружения...${NC}"
    
    # Критические переменные для авторизации
    local required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "NEXT_PUBLIC_APP_URL"
    )
    
    local optional_vars=(
        "NEXT_PUBLIC_GOOGLE_CLIENT_ID"
        "GOOGLE_CLIENT_SECRET"
        "TELEGRAM_BOT_TOKEN"
    )
    
    local missing_critical=0
    local missing_optional=0
    
    echo "Критические переменные:"
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "  ❌ $var - ${RED}НЕ УСТАНОВЛЕНА${NC}"
            missing_critical=$((missing_critical + 1))
        else
            # Показываем только первые и последние символы для безопасности
            local value="${!var}"
            local masked="${value:0:8}...${value: -8}"
            echo -e "  ✅ $var - ${GREEN}установлена${NC} ($masked)"
        fi
    done
    
    echo -e "\nОпциональные переменные:"
    for var in "${optional_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "  ⚠️  $var - ${YELLOW}не установлена${NC}"
            missing_optional=$((missing_optional + 1))
        else
            local value="${!var}"
            local masked="${value:0:8}...${value: -8}"
            echo -e "  ✅ $var - ${GREEN}установлена${NC} ($masked)"
        fi
    done
    
    if [ $missing_critical -gt 0 ]; then
        echo -e "\n${RED}❌ Найдено $missing_critical критических проблем с переменными окружения!${NC}"
        return 1
    else
        echo -e "\n${GREEN}✅ Все критические переменные окружения настроены${NC}"
    fi
    
    if [ $missing_optional -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $missing_optional опциональных переменных не настроены${NC}"
    fi
}

# Функция для проверки Supabase подключения
check_supabase_connection() {
    echo -e "\n${BLUE}🔌 Проверка подключения к Supabase...${NC}"
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        echo -e "${RED}❌ Supabase переменные не настроены${NC}"
        return 1
    fi
    
    # Проверяем доступность Supabase API
    local supabase_health="${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/"
    echo "Проверяем: $supabase_health"
    
    if curl -s --max-time 10 -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" "$supabase_health" > /dev/null; then
        echo -e "${GREEN}✅ Supabase API доступен${NC}"
    else
        echo -e "${RED}❌ Supabase API недоступен или неправильные ключи${NC}"
        return 1
    fi
}

# Функция для проверки конфигурации Next.js
check_nextjs_config() {
    echo -e "\n${BLUE}⚙️ Проверка конфигурации Next.js...${NC}"
    
    # Проверяем next.config.ts
    if [ -f "next.config.ts" ]; then
        echo -e "✅ next.config.ts найден"
        
        # Проверяем на наличие проблемных настроек
        if grep -q "experimental.*esmExternals.*false" next.config.ts; then
            echo -e "${YELLOW}⚠️  Найдена настройка esmExternals: false${NC}"
        fi
        
        if grep -q "webpack.*externals" next.config.ts; then
            echo -e "${GREEN}✅ Webpack externals настроены${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  next.config.ts не найден${NC}"
    fi
    
    # Проверяем middleware.ts
    if [ -f "middleware.ts" ]; then
        echo -e "✅ middleware.ts найден"
        
        # Проверяем на наличие проблем с cookies
        if grep -q "cookies.*getAll\|cookies.*setAll" middleware.ts; then
            echo -e "${GREEN}✅ Cookie handling настроен${NC}"
        else
            echo -e "${YELLOW}⚠️  Возможны проблемы с cookie handling${NC}"
        fi
    else
        echo -e "${RED}❌ middleware.ts не найден${NC}"
    fi
}

# Функция для проверки сборки
check_build() {
    echo -e "\n${BLUE}🏗️ Проверка сборки приложения...${NC}"
    
    if [ -d ".next" ]; then
        echo -e "✅ Директория .next найдена"
        
        # Проверяем размер сборки
        local build_size=$(du -sh .next 2>/dev/null | cut -f1)
        echo -e "📦 Размер сборки: $build_size"
        
        # Проверяем наличие критических файлов
        if [ -f ".next/BUILD_ID" ]; then
            local build_id=$(cat .next/BUILD_ID)
            echo -e "🆔 Build ID: $build_id"
        fi
    else
        echo -e "${RED}❌ Приложение не собрано. Запустите: npm run build${NC}"
        return 1
    fi
}

# Функция для проверки логов (если доступны)
check_logs() {
    echo -e "\n${BLUE}📋 Проверка возможных проблем в коде...${NC}"
    
    # Проверяем на наличие console.error в коде авторизации
    local auth_files=(
        "src/hooks/useAuth.tsx"
        "src/app/auth/page.tsx" 
        "src/lib/supabase.ts"
        "middleware.ts"
    )
    
    for file in "${auth_files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "📄 Проверяем $file..."
            
            # Ищем потенциальные проблемы
            if grep -n "console\.error\|throw new Error\|catch.*error" "$file" > /dev/null; then
                echo -e "  ${YELLOW}⚠️  Найдены обработчики ошибок${NC}"
            fi
            
            if grep -n "useEffect.*\[\]" "$file" > /dev/null; then
                echo -e "  ✅ useEffect с пустыми зависимостями найден"
            fi
            
            if grep -n "isLoading.*true" "$file" > /dev/null; then
                echo -e "  ✅ Состояние загрузки обрабатывается"
            fi
        else
            echo -e "  ${RED}❌ $file не найден${NC}"
        fi
    done
}

# Функция для создания тестового запроса
test_auth_endpoints() {
    echo -e "\n${BLUE}🧪 Тестирование auth endpoints...${NC}"
    
    if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
        echo -e "${YELLOW}⚠️  NEXT_PUBLIC_APP_URL не установлен, пропускаем тесты${NC}"
        return 0
    fi
    
    local app_url="$NEXT_PUBLIC_APP_URL"
    echo "Тестируем: $app_url"
    
    # Тест главной страницы
    echo -n "📄 Главная страница: "
    if curl -s --max-time 10 "$app_url" > /dev/null; then
        echo -e "${GREEN}✅ доступна${NC}"
    else
        echo -e "${RED}❌ недоступна${NC}"
    fi
    
    # Тест страницы авторизации
    echo -n "🔐 Страница авторизации: "
    if curl -s --max-time 10 "$app_url/auth" > /dev/null; then
        echo -e "${GREEN}✅ доступна${NC}"
    else
        echo -e "${RED}❌ недоступна${NC}"
    fi
    
    # Тест API endpoints
    echo -n "🔌 Health check: "
    if curl -s --max-time 10 "$app_url/api/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ работает${NC}"
    else
        echo -e "${YELLOW}⚠️  endpoint не найден или недоступен${NC}"
    fi
}

# Функция для генерации рекомендаций по исправлению
generate_recommendations() {
    echo -e "\n${BLUE}💡 Рекомендации по исправлению...${NC}"
    
    echo -e "\n${YELLOW}🔧 Частые причины зависания авторизации:${NC}"
    echo "1. 🔑 Неправильные Supabase ключи"
    echo "2. 🌐 Неправильный NEXT_PUBLIC_APP_URL"
    echo "3. 🍪 Проблемы с cookies в middleware"
    echo "4. 🔄 Бесконечные перенаправления"
    echo "5. 🚫 Блокировка CORS"
    echo "6. 📱 Проблемы с OAuth redirect URLs"
    
    echo -e "\n${GREEN}✅ Быстрые исправления:${NC}"
    echo "1. Проверьте переменные окружения в Vercel Dashboard"
    echo "2. Убедитесь что NEXT_PUBLIC_APP_URL точно соответствует домену"
    echo "3. Проверьте Supabase Auth settings:"
    echo "   - Site URL должен совпадать с NEXT_PUBLIC_APP_URL"
    echo "   - Redirect URLs должны включать ваш домен"
    echo "4. Очистите кеш браузера и cookies"
    echo "5. Проверьте Network tab в DevTools на ошибки"
    
    echo -e "\n${BLUE}🔍 Для детальной диагностики:${NC}"
    echo "1. Откройте DevTools → Network tab"
    echo "2. Попробуйте авторизацию"
    echo "3. Найдите зависший или падающий запрос"
    echo "4. Проверьте ответ сервера на ошибки"
    
    echo -e "\n${YELLOW}⚡ Экстренное исправление:${NC}"
    echo "Если проблема критическая, используйте локальную авторизацию:"
    echo "1. Временно отключите Google OAuth"
    echo "2. Используйте только email/password"
    echo "3. Проверьте что Supabase Auth включен"
}

# Основная функция
main() {
    echo -e "${GREEN}🚀 Запуск диагностики авторизации...${NC}"
    
    local exit_code=0
    
    # Загружаем переменные окружения если есть .env.local
    if [ -f ".env.local" ]; then
        echo -e "📄 Загружаем .env.local..."
        set -a
        source .env.local
        set +a
    else
        echo -e "${YELLOW}⚠️  .env.local не найден, используем системные переменные${NC}"
    fi
    
    # Запускаем проверки
    check_env_vars || exit_code=1
    check_supabase_connection || exit_code=1
    check_nextjs_config
    check_build || exit_code=1
    check_logs
    test_auth_endpoints
    
    echo -e "\n=================================================="
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ Диагностика завершена. Критических проблем не найдено.${NC}"
        echo -e "Если авторизация всё ещё зависает, проверьте browser DevTools."
    else
        echo -e "${RED}❌ Найдены критические проблемы!${NC}"
        generate_recommendations
    fi
    
    echo -e "\n${BLUE}📋 Полный отчет сохранен в: auth-diagnosis.log${NC}"
    
    return $exit_code
}

# Запуск с перенаправлением вывода
main 2>&1 | tee auth-diagnosis.log
