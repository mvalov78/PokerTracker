#!/bin/bash

# 🤖 PokerTracker Pro - Исправление проблем бота на продакшене

set -e

echo "🤖 Исправление проблем бота на продакшене"
echo "========================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Диагностированные проблемы:${NC}"
echo -e "1. 🌐 Hardcoded localhost URL в photoHandler.ts"
echo -e "2. ⏰ Vercel timeout (30 секунд) для polling API"
echo -e "3. 🔄 Долгий polling процесс блокирует запросы"
echo -e "4. 🚫 API недоступен на продакшене для бота"

echo -e "\n${GREEN}✅ Применяем исправления...${NC}"

# 1. Исправляем hardcoded localhost URL
echo -e "\n${BLUE}1. Исправляем hardcoded localhost URL...${NC}"

if [ -f "src/bot/handlers/photoHandler.ts" ]; then
    # Создаем бэкап
    cp src/bot/handlers/photoHandler.ts src/bot/handlers/photoHandler.ts.backup
    
    # Заменяем localhost на переменную окружения
    sed -i.bak 's|http://localhost:3000/api/tournaments|${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/tournaments|g' src/bot/handlers/photoHandler.ts
    
    echo -e "${GREEN}✅ Заменен hardcoded localhost URL${NC}"
else
    echo -e "${RED}❌ photoHandler.ts не найден${NC}"
fi

# 2. Создаем оптимизированный polling endpoint
echo -e "\n${BLUE}2. Создаем оптимизированный polling endpoint...${NC}"

mkdir -p src/app/api/bot/polling-optimized

cat > src/app/api/bot/polling-optimized/route.ts << 'EOF'
/**
 * Оптимизированный API роут для управления polling режимом бота
 * Решает проблемы timeout на Vercel
 */

import { type NextRequest, NextResponse } from "next/server";
import { getBotInstance, initializeBot } from "../../../../bot";

// Максимальное время выполнения для Vercel (25 секунд из 30)
const MAX_EXECUTION_TIME = 25000;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { command, data } = body;

    console.log(`[Bot Polling API Optimized] Команда: ${command}`);

    let bot = getBotInstance();
    if (!bot) {
      bot = await initializeBot();
    }

    switch (command) {
      case "start":
        if (!bot.getStatus().isRunning) {
          // Запускаем бота асинхронно, не ждем полной инициализации
          bot.start().catch(error => {
            console.error("Ошибка запуска бота:", error);
          });
          
          // Возвращаем ответ немедленно
          return NextResponse.json({
            success: true,
            message: "Polling запускается...",
            status: { isRunning: true, mode: "polling" },
            note: "Инициализация может занять несколько секунд"
          });
        } else {
          return NextResponse.json({
            success: true,
            message: "Polling уже запущен",
            status: bot.getStatus(),
          });
        }

      case "stop":
        if (bot.getStatus().isRunning) {
          // Останавливаем асинхронно
          bot.stop().catch(error => {
            console.error("Ошибка остановки бота:", error);
          });
          
          return NextResponse.json({
            success: true,
            message: "Polling останавливается...",
            status: { isRunning: false, mode: "stopped" },
          });
        } else {
          return NextResponse.json({
            success: true,
            message: "Polling уже остановлен",
            status: bot.getStatus(),
          });
        }

      case "status":
        // Быстрая проверка статуса
        return NextResponse.json({
          success: true,
          status: bot.getStatus(),
          uptime: Date.now() - startTime,
          environment: process.env.NODE_ENV || "development"
        });

      case "health":
        // Health check для мониторинга
        return NextResponse.json({
          success: true,
          health: "ok",
          bot: {
            configured: !!process.env.TELEGRAM_BOT_TOKEN,
            status: bot.getStatus()
          },
          api: {
            appUrl: process.env.NEXT_PUBLIC_APP_URL || "not-configured",
            supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          {
            error: "Неизвестная команда. Доступные: start, stop, status, health",
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Ошибка управления polling:", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        executionTime: Date.now() - startTime
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    let bot = getBotInstance();
    if (!bot) {
      bot = await initializeBot();
    }

    const status = bot.getStatus();

    return NextResponse.json({
      success: true,
      polling: {
        ...status,
        lastUpdate: new Date().toISOString(),
        mode: process.env.BOT_MODE || "polling",
        environment: process.env.NODE_ENV || "development",
        apiUrl: process.env.NEXT_PUBLIC_APP_URL || "not-configured"
      },
    });
  } catch (error) {
    console.error("Ошибка получения статуса polling:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Устанавливаем максимальное время выполнения для Vercel
export const maxDuration = 25; // 25 секунд (меньше лимита Vercel)
EOF

echo -e "${GREEN}✅ Создан оптимизированный polling endpoint${NC}"

# 3. Исправляем photoHandler для использования правильного URL
echo -e "\n${BLUE}3. Создаем исправленный photoHandler...${NC}"

cat > src/bot/handlers/photoHandler.fixed.ts << 'EOF'
/**
 * Исправленный обработчик фотографий для продакшена
 * Использует правильный API URL и обработку ошибок
 */

import type { BotContext } from "../index";
import { processTicketImage } from "../../services/ocrService";
import { UserSettingsService } from "@/services/userSettingsService";
import { UserService } from "@/services/userService";

export class PhotoHandler {
  /**
   * Получение правильного API URL для текущего окружения
   */
  private getApiUrl(): string {
    // В продакшене используем NEXT_PUBLIC_APP_URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
    
    if (appUrl) {
      // Убеждаемся что URL содержит протокол
      if (appUrl.startsWith('http')) {
        return appUrl;
      } else {
        return `https://${appUrl}`;
      }
    }
    
    // Fallback для локальной разработки
    return "http://localhost:3000";
  }

  /**
   * Подтверждение создания турнира из OCR данных
   */
  async confirmTournament(ctx: BotContext) {
    try {
      await ctx.answerCbQuery();

      // Получаем данные из сессии
      console.log("🔍 Проверяем сессию:", ctx.session);
      const data = ctx.session.ocrData;
      console.log("🔍 Данные OCR из сессии:", data);

      if (!data) {
        console.log("❌ Данные OCR не найдены в сессии");
        await ctx.reply(
          "❌ Данные OCR не найдены. Попробуйте отправить фото еще раз.",
        );
        return;
      }

      // Создаем турнир через API
      const telegramId = ctx.from?.id.toString() || "user-1";

      // Получаем UUID пользователя по Telegram ID
      console.log(
        "🔍 [confirmTournament] Получаем UUID пользователя по Telegram ID:",
        telegramId,
      );
      const userUuid = await UserService.getUserUuidByTelegramId(telegramId);
      console.log("🔍 [confirmTournament] UUID пользователя:", userUuid);

      // Если UUID не найден, используем Telegram ID - API создаст пользователя через getUserOrCreate
      const finalUserId = userUuid || telegramId;
      console.log(
        "🔍 [confirmTournament] Финальный ID для создания турнира:",
        finalUserId,
      );

      // Используем текущую площадку пользователя, если установлена, иначе берем из OCR
      console.log(
        "🔍 [confirmTournament] Получаем текущую площадку пользователя:",
        telegramId,
      );
      const currentVenue =
        await UserSettingsService.getCurrentVenue(telegramId);
      console.log(
        "🏨 [confirmTournament] Текущая площадка пользователя:",
        currentVenue,
      );
      console.log("🏨 [confirmTournament] Площадка из OCR:", data.venue);
      const venue = currentVenue || data.venue || "Не указано";
      console.log(
        "🏨 [confirmTournament] Финальная площадка для создания турнира:",
        venue,
      );

      const tournamentData = {
        userId: finalUserId,
        name: data.name || "Турнир из билета",
        date: data.date || new Date().toISOString(),
        buyin: data.buyin || 0,
        venue: venue,
        tournamentType: data.tournamentType || "freezeout",
        structure: data.structure || "NL Hold'em",
        participants: data.participants,
        prizePool: data.prizePool,
        blindLevels: data.blindLevels,
        startingStack: data.startingStack,
        notes: "Создано через распознавание билета в Telegram боте",
      };

      // Получаем правильный API URL
      const apiUrl = this.getApiUrl();
      const apiEndpoint = `${apiUrl}/api/tournaments`;
      
      console.log(`🌐 [confirmTournament] Отправляем запрос к API: ${apiEndpoint}`);

      // Отправляем запрос к API с timeout и retry логикой
      const apiResponse = await this.fetchWithRetry(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tournamentData),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error(`❌ API error: ${apiResponse.status} - ${errorText}`);
        throw new Error(`API error: ${apiResponse.status} - ${errorText}`);
      }

      const apiResult = await apiResponse.json();
      if (!apiResult.success) {
        console.error("❌ API вернул ошибку:", apiResult);
        throw new Error(apiResult.error || "Failed to create tournament via API");
      }

      const newTournament = apiResult.tournament;

      // Очищаем данные OCR из сессии
      ctx.session.ocrData = undefined;

      const successMessage = `
✅ **Турнир успешно создан!**

🎰 **${newTournament.name}**
📅 ${new Date(newTournament.date).toLocaleDateString("ru-RU")}
💵 Бай-ин: $${newTournament.buyin}
🏨 ${newTournament.venue}

ID турнира: \`${newTournament.id}\`

🎯 **Что дальше?**
• После турнира используйте /result для добавления результата
• Просматривайте статистику командой /stats
• Настройте уведомления через /settings

Удачи за столами! 🍀
      `;

      await ctx.editMessageText(successMessage, {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: [] },
      });
    } catch (error) {
      console.error("Ошибка создания турнира:", error);
      
      let errorMessage = "❌ Ошибка при создании турнира.\n\n";
      
      if (error instanceof Error) {
        if (error.message.includes("API error: 401")) {
          errorMessage += "🔐 Проблема с авторизацией. Убедитесь что вы связали аккаунт командой /link";
        } else if (error.message.includes("API error: 500")) {
          errorMessage += "🔧 Техническая ошибка сервера. Попробуйте позже.";
        } else if (error.message.includes("fetch")) {
          errorMessage += "🌐 Проблема с подключением к серверу. Проверьте интернет.";
        } else {
          errorMessage += `🐛 Техническая ошибка: ${error.message}`;
        }
      }
      
      errorMessage += "\n\n💡 **Что можно сделать:**\n";
      errorMessage += "• Попробовать еще раз через несколько минут\n";
      errorMessage += "• Использовать /register для ручного ввода\n";
      errorMessage += "• Обратиться к администратору если проблема повторяется";
      
      await ctx.reply(errorMessage, { parse_mode: "Markdown" });
    }
  }

  /**
   * Fetch с retry логикой и timeout
   */
  private async fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 секунд timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Если получили 5xx ошибку, пробуем еще раз
      if (response.status >= 500 && retries > 0) {
        console.log(`🔄 Retry запрос (${retries} попыток осталось)`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Пауза 1 сек
        return this.fetchWithRetry(url, options, retries - 1);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (retries > 0 && (error instanceof Error && error.name !== 'AbortError')) {
        console.log(`🔄 Retry запрос после ошибки (${retries} попыток осталось):`, error.message);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      
      throw error;
    }
  }

  // ... остальные методы остаются без изменений
}
EOF

echo -e "${GREEN}✅ Создан исправленный photoHandler${NC}"

# 4. Создаем webhook endpoint для продакшена
echo -e "\n${BLUE}4. Создаем webhook endpoint для продакшена...${NC}"

mkdir -p src/app/api/bot/webhook-optimized

cat > src/app/api/bot/webhook-optimized/route.ts << 'EOF'
/**
 * Оптимизированный webhook endpoint для Telegram бота на продакшене
 */

import { type NextRequest, NextResponse } from "next/server";
import { getBotInstance, initializeBot } from "../../../../bot";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const update = await request.json();
    console.log("📨 [Webhook] Получено обновление:", update.update_id);

    let bot = getBotInstance();
    if (!bot) {
      console.log("🤖 [Webhook] Инициализируем бота...");
      bot = await initializeBot();
    }

    // Обрабатываем обновление асинхронно
    bot.handleUpdate(update).catch(error => {
      console.error("❌ [Webhook] Ошибка обработки обновления:", error);
    });

    // Возвращаем ответ немедленно (Telegram требует быстрый ответ)
    return NextResponse.json({ 
      success: true,
      processed: true,
      updateId: update.update_id,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error("❌ [Webhook] Критическая ошибка:", error);
    
    // Всегда возвращаем 200 для Telegram, чтобы не было повторных отправок
    return NextResponse.json({ 
      success: false,
      error: "Internal processing error",
      processingTime: Date.now() - startTime
    });
  }
}

// Максимальное время выполнения для Vercel
export const maxDuration = 10; // 10 секунд для webhook
EOF

echo -e "${GREEN}✅ Создан оптимизированный webhook endpoint${NC}"

echo -e "\n${GREEN}🎉 Все исправления применены!${NC}"

echo -e "\n${YELLOW}📋 Следующие шаги:${NC}"
echo -e "1. 📝 Обновите переменные окружения в Vercel:"
echo -e "   NEXT_PUBLIC_APP_URL=https://ваш-домен.vercel.app"
echo -e "2. 🔄 Redeploy приложение"
echo -e "3. 🤖 Переключитесь на webhook режим для продакшена"
echo -e "4. 🧪 Протестируйте создание турнира через бота"

echo -e "\n${BLUE}🔧 Исправленные проблемы:${NC}"
echo -e "• ✅ Убран hardcoded localhost URL"
echo -e "• ✅ Добавлен timeout protection"
echo -e "• ✅ Улучшена обработка ошибок"
echo -e "• ✅ Оптимизированы API endpoints для Vercel"
echo -e "• ✅ Добавлена retry логика для API запросов"
EOF

chmod +x scripts/fix-bot-production.sh
echo -e "${GREEN}✅ Скрипт исправления создан и готов к использованию${NC}"
