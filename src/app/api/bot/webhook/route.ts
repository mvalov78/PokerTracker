/**
 * Webhook endpoint для Telegram бота (для продакшена)
 */

import { type NextRequest, NextResponse } from "next/server";
import { getBotInstance, initializeBot } from "../../../../bot";
import { BotSettingsService } from "@/services/botSettingsService";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[Webhook ${requestId}] 🚀 Incoming request`, {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      headers: {
        'content-type': request.headers.get('content-type'),
        'user-agent': request.headers.get('user-agent'),
        'x-telegram-bot-api-secret-token': request.headers.get('x-telegram-bot-api-secret-token') ? 'SET' : 'NOT_SET'
      },
      environment: process.env.NODE_ENV,
      botToken: process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT_SET',
      webhookUrl: process.env.BOT_WEBHOOK_URL || 'NOT_SET'
    });

    // Получаем update от Telegram
    const update = await request.json();

    console.log(`[Webhook ${requestId}] 📨 Update received:`, {
      updateId: update.update_id,
      updateType: Object.keys(update).filter(key => key !== 'update_id')[0],
      hasMessage: !!update.message,
      hasCallbackQuery: !!update.callback_query,
      hasInlineQuery: !!update.inline_query,
      fullUpdate: JSON.stringify(update, null, 2)
    });

    // Детальное логирование сообщения
    if (update.message) {
      console.log(`[Webhook ${requestId}] 💬 Message details:`, {
        messageId: update.message.message_id,
        from: {
          id: update.message.from?.id,
          username: update.message.from?.username,
          firstName: update.message.from?.first_name,
          isBot: update.message.from?.is_bot
        },
        chat: {
          id: update.message.chat?.id,
          type: update.message.chat?.type,
          title: update.message.chat?.title
        },
        text: update.message.text,
        hasPhoto: !!update.message.photo,
        hasDocument: !!update.message.document,
        date: update.message.date,
        timestamp: new Date(update.message.date * 1000).toISOString()
      });
    }

    // Получаем или создаем экземпляр бота
    console.log(`[Webhook ${requestId}] 🤖 Getting bot instance...`);
    let bot = getBotInstance();
    if (!bot) {
      console.log(`[Webhook ${requestId}] 🔧 Bot not found, initializing...`);
      const initStartTime = Date.now();
      
      // Add timeout protection for bot initialization
      const initPromise = initializeBot();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Bot initialization timeout (15s)')), 15000)
      );
      
      try {
        bot = await Promise.race([initPromise, timeoutPromise]);
        console.log(`[Webhook ${requestId}] ✅ Bot initialized in ${Date.now() - initStartTime}ms`);
        
        // Verify bot status after initialization
        const botStatus = bot.getStatus();
        console.log(`[Webhook ${requestId}] 📊 Bot status after init:`, botStatus);
        
      } catch (initError) {
        console.error(`[Webhook ${requestId}] 💥 Bot initialization failed:`, {
          error: initError instanceof Error ? initError.message : 'Unknown error',
          stack: initError instanceof Error ? initError.stack : undefined,
          environment: process.env.NODE_ENV,
          botToken: process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT_SET'
        });
        throw new Error(`Bot initialization failed: ${initError instanceof Error ? initError.message : 'Unknown error'}`);
      }
    } else {
      console.log(`[Webhook ${requestId}] ✅ Using existing bot instance`);
    }

    // Проверяем статус бота
    const botStatus = bot.getStatus();
    console.log(`[Webhook ${requestId}] 📊 Bot status:`, botStatus);

    // Обрабатываем обновление
    console.log(`[Webhook ${requestId}] ⚙️ Processing update...`);
    const processStartTime = Date.now();
    
    await bot.handleUpdate(update);
    
    const processingTime = Date.now() - processStartTime;
    console.log(`[Webhook ${requestId}] ✅ Update processed successfully in ${processingTime}ms`);

    // Обновляем время последнего обновления
    try {
      await BotSettingsService.updateLastUpdateTime();
      console.log(`[Webhook ${requestId}] 📝 Last update time recorded`);
    } catch (dbError) {
      console.error(`[Webhook ${requestId}] ⚠️ Failed to update last update time:`, dbError);
    }

    const totalTime = Date.now() - startTime;
    console.log(`[Webhook ${requestId}] 🏁 Request completed successfully in ${totalTime}ms`);

    return NextResponse.json({ 
      ok: true, 
      processed: true,
      requestId,
      processingTime: totalTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[Webhook ${requestId}] 💥 Error processing webhook:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: totalTime,
      timestamp: new Date().toISOString()
    });

    // Увеличиваем счетчик ошибок
    try {
      await BotSettingsService.incrementErrorCount();
      console.log(`[Webhook ${requestId}] 📈 Error count incremented`);
    } catch (dbError) {
      console.error(`[Webhook ${requestId}] ⚠️ Failed to increment error count:`, dbError);
    }

    return NextResponse.json(
      { 
        error: "Internal server error",
        requestId,
        processingTime: totalTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Для проверки здоровья webhook
export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[Webhook GET ${requestId}] 🔍 Health check request`, {
    timestamp: new Date().toISOString(),
    url: request.url,
    headers: {
      'user-agent': request.headers.get('user-agent'),
      'origin': request.headers.get('origin')
    },
    environment: process.env.NODE_ENV,
    botToken: process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT_SET',
    webhookUrl: process.env.BOT_WEBHOOK_URL || 'NOT_SET'
  });

  try {
    // Проверяем статус бота
    let bot = getBotInstance();
    let botStatus = null;
    let botInitialized = false;
    
    if (bot) {
      botStatus = bot.getStatus();
      console.log(`[Webhook GET ${requestId}] 🤖 Bot status:`, botStatus);
    } else {
      console.log(`[Webhook GET ${requestId}] ⚠️ No bot instance found, attempting initialization...`);
      
      try {
        const initStartTime = Date.now();
        bot = await initializeBot();
        botInitialized = true;
        botStatus = bot.getStatus();
        
        console.log(`[Webhook GET ${requestId}] ✅ Bot initialized successfully in ${Date.now() - initStartTime}ms:`, botStatus);
      } catch (initError) {
        console.error(`[Webhook GET ${requestId}] 💥 Bot initialization failed:`, {
          error: initError instanceof Error ? initError.message : 'Unknown error',
          stack: initError instanceof Error ? initError.stack : undefined
        });
        // Don't throw error in GET request, just log it
      }
    }

    // Проверяем настройки из БД
    let dbSettings = null;
    try {
      // Здесь можно добавить проверку настроек из БД
      console.log(`[Webhook GET ${requestId}] 📊 Checking database settings...`);
    } catch (dbError) {
      console.error(`[Webhook GET ${requestId}] ❌ Database check failed:`, dbError);
    }

    const response = {
      status: "ok",
      timestamp: new Date().toISOString(),
      message: "Telegram webhook endpoint is running",
      requestId,
      environment: process.env.NODE_ENV,
      config: {
        botToken: process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT_SET',
        webhookUrl: process.env.BOT_WEBHOOK_URL || 'NOT_SET',
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET'
      },
      bot: {
        hasInstance: !!bot,
        status: botStatus,
        justInitialized: botInitialized
      },
      database: {
        settings: dbSettings
      }
    };

    console.log(`[Webhook GET ${requestId}] ✅ Health check completed:`, response);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error(`[Webhook GET ${requestId}] 💥 Health check error:`, error);
    
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      message: "Webhook health check failed",
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
