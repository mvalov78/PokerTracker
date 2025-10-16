#!/bin/bash
# Скрипт для установки Telegram webhook

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔗 Установка Telegram Webhook${NC}\n"

# Проверка переменных окружения
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo -e "${RED}❌ Ошибка: TELEGRAM_BOT_TOKEN не установлен${NC}"
    echo "Установите переменную окружения:"
    echo "export TELEGRAM_BOT_TOKEN='your-bot-token'"
    exit 1
fi

if [ -z "$BOT_WEBHOOK_URL" ]; then
    echo -e "${RED}❌ Ошибка: BOT_WEBHOOK_URL не установлен${NC}"
    echo "Установите переменную окружения:"
    echo "export BOT_WEBHOOK_URL='https://your-app.vercel.app/api/telegram/webhook'"
    exit 1
fi

echo -e "📋 Параметры:"
echo -e "Token: ${TELEGRAM_BOT_TOKEN:0:10}...${TELEGRAM_BOT_TOKEN: -10}"
echo -e "Webhook URL: $BOT_WEBHOOK_URL\n"

# Установка webhook
echo -e "${YELLOW}🔄 Устанавливаем webhook...${NC}"

RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${BOT_WEBHOOK_URL}\", \"allowed_updates\": [\"message\", \"callback_query\"]}")

# Проверка результата
OK=$(echo $RESPONSE | grep -o '"ok":true')

if [ -n "$OK" ]; then
    echo -e "${GREEN}✅ Webhook успешно установлен!${NC}\n"
    
    # Получаем информацию о webhook
    echo -e "${YELLOW}📊 Информация о webhook:${NC}"
    curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq '.'
else
    echo -e "${RED}❌ Ошибка установки webhook:${NC}"
    echo $RESPONSE | jq '.'
    exit 1
fi

echo -e "\n${GREEN}🎉 Готово! Теперь проверьте страницу /admin/bot${NC}"

