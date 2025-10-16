#!/bin/bash
# Скрипт для проверки статуса Telegram webhook

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Проверка статуса Telegram Webhook${NC}\n"

# Проверка переменной окружения
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo -e "${RED}❌ Ошибка: TELEGRAM_BOT_TOKEN не установлен${NC}"
    echo "Установите переменную окружения:"
    echo "export TELEGRAM_BOT_TOKEN='your-bot-token'"
    exit 1
fi

echo -e "Token: ${TELEGRAM_BOT_TOKEN:0:10}...${TELEGRAM_BOT_TOKEN: -10}\n"

# Получаем информацию о webhook
echo -e "${YELLOW}📊 Получаем информацию о webhook...${NC}\n"

RESPONSE=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo")

# Проверяем наличие URL
URL=$(echo $RESPONSE | jq -r '.result.url')
PENDING=$(echo $RESPONSE | jq -r '.result.pending_update_count')
ERROR_DATE=$(echo $RESPONSE | jq -r '.result.last_error_date')
ERROR_MSG=$(echo $RESPONSE | jq -r '.result.last_error_message')

echo -e "${GREEN}Webhook информация:${NC}"
echo $RESPONSE | jq '.'

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$URL" = "" ] || [ "$URL" = "null" ]; then
    echo -e "${RED}❌ Webhook НЕ установлен${NC}"
    echo -e "\nЧтобы установить webhook, выполните:"
    echo -e "${YELLOW}./scripts/set-webhook.sh${NC}"
else
    echo -e "${GREEN}✅ Webhook установлен: $URL${NC}"
    
    if [ "$PENDING" != "0" ] && [ "$PENDING" != "null" ]; then
        echo -e "${YELLOW}⚠️  Ожидающих обновлений: $PENDING${NC}"
    else
        echo -e "${GREEN}✅ Нет ожидающих обновлений${NC}"
    fi
    
    if [ "$ERROR_MSG" != "null" ] && [ "$ERROR_MSG" != "" ]; then
        echo -e "${RED}❌ Последняя ошибка: $ERROR_MSG${NC}"
        echo -e "${RED}   Дата: $(date -r $ERROR_DATE)${NC}"
    else
        echo -e "${GREEN}✅ Нет ошибок${NC}"
    fi
fi

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

