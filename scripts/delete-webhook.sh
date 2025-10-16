#!/bin/bash
# Скрипт для удаления Telegram webhook (возврат к polling)

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🗑️  Удаление Telegram Webhook${NC}\n"

# Проверка переменной окружения
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo -e "${RED}❌ Ошибка: TELEGRAM_BOT_TOKEN не установлен${NC}"
    echo "Установите переменную окружения:"
    echo "export TELEGRAM_BOT_TOKEN='your-bot-token'"
    exit 1
fi

echo -e "Token: ${TELEGRAM_BOT_TOKEN:0:10}...${TELEGRAM_BOT_TOKEN: -10}\n"

# Удаляем webhook
echo -e "${YELLOW}🔄 Удаляем webhook...${NC}"

RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook")

# Проверка результата
OK=$(echo $RESPONSE | grep -o '"ok":true')

if [ -n "$OK" ]; then
    echo -e "${GREEN}✅ Webhook успешно удален!${NC}"
    echo -e "${GREEN}🔄 Бот переключен в polling режим${NC}\n"
else
    echo -e "${RED}❌ Ошибка удаления webhook:${NC}"
    echo $RESPONSE | jq '.'
    exit 1
fi

echo -e "${GREEN}🎉 Готово! Проверьте страницу /admin/bot${NC}"

