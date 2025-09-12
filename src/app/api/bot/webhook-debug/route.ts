/**
 * Debug endpoint для диагностики webhook проблем
 */

import { type NextRequest, NextResponse } from "next/server";
import { getBotInstance, initializeBot } from "../../../../bot";

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  try {
    console.log(`[Webhook Debug ${requestId}] 🔍 Debug request started`, {
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method,
      environment: process.env.NODE_ENV
    });

    const body = await request.json();
    const { action = "test", testData } = body;

    switch (action) {
      case "test":
        return await handleTestAction(requestId, testData);
      
      case "simulate":
        return await handleSimulateAction(requestId, testData);
      
      case "webhook-info":
        return await handleWebhookInfoAction(requestId);
      
      case "bot-status":
        return await handleBotStatusAction(requestId);
      
      default:
        return NextResponse.json({
          success: false,
          error: "Unknown action",
          availableActions: ["test", "simulate", "webhook-info", "bot-status"],
          requestId
        }, { status: 400 });
    }

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[Webhook Debug ${requestId}] 💥 Debug error:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: totalTime
    });

    return NextResponse.json({
      success: false,
      error: "Debug request failed",
      details: error instanceof Error ? error.message : 'Unknown error',
      requestId,
      processingTime: totalTime
    }, { status: 500 });
  }
}

async function handleTestAction(requestId: string, testData?: any) {
  console.log(`[Webhook Debug ${requestId}] 🧪 Running test action`);
  
  try {
    // Проверяем environment variables
    const envCheck = {
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT_SET',
      BOT_WEBHOOK_URL: process.env.BOT_WEBHOOK_URL || 'NOT_SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV || 'unknown'
    };

    console.log(`[Webhook Debug ${requestId}] 🔧 Environment check:`, envCheck);

    // Проверяем бота
    let bot = getBotInstance();
    let botInitialized = false;
    
    if (!bot) {
      console.log(`[Webhook Debug ${requestId}] 🤖 Initializing bot...`);
      bot = await initializeBot();
      botInitialized = true;
    }

    const botStatus = bot.getStatus();
    console.log(`[Webhook Debug ${requestId}] 📊 Bot status:`, botStatus);

    return NextResponse.json({
      success: true,
      action: "test",
      requestId,
      results: {
        environment: envCheck,
        bot: {
          initialized: botInitialized,
          status: botStatus,
          hasInstance: !!bot
        },
        webhook: {
          endpoint: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/bot/webhook`,
          configured: !!(process.env.BOT_WEBHOOK_URL && process.env.TELEGRAM_BOT_TOKEN)
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[Webhook Debug ${requestId}] ❌ Test action failed:`, error);
    throw error;
  }
}

async function handleSimulateAction(requestId: string, testData?: any) {
  console.log(`[Webhook Debug ${requestId}] 🎭 Running simulate action`);
  
  try {
    // Создаем тестовое обновление
    const mockUpdate = testData || {
      update_id: Date.now(),
      message: {
        message_id: Math.floor(Math.random() * 1000),
        from: {
          id: 123456789,
          first_name: "Test User",
          username: "testuser",
          is_bot: false
        },
        chat: {
          id: 123456789,
          type: "private"
        },
        date: Math.floor(Date.now() / 1000),
        text: "/start"
      }
    };

    console.log(`[Webhook Debug ${requestId}] 📨 Simulating update:`, mockUpdate);

    // Получаем бота
    let bot = getBotInstance();
    if (!bot) {
      bot = await initializeBot();
    }

    // Обрабатываем тестовое обновление
    const processStartTime = Date.now();
    await bot.handleUpdate(mockUpdate);
    const processTime = Date.now() - processStartTime;

    console.log(`[Webhook Debug ${requestId}] ✅ Simulation completed in ${processTime}ms`);

    return NextResponse.json({
      success: true,
      action: "simulate",
      requestId,
      results: {
        mockUpdate,
        processingTime: processTime,
        botResponse: "Update processed successfully"
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[Webhook Debug ${requestId}] ❌ Simulate action failed:`, error);
    throw error;
  }
}

async function handleWebhookInfoAction(requestId: string) {
  console.log(`[Webhook Debug ${requestId}] 🔗 Getting webhook info`);
  
  try {
    const webhookInfo = {
      configured: {
        botToken: !!process.env.TELEGRAM_BOT_TOKEN,
        webhookUrl: !!process.env.BOT_WEBHOOK_URL,
        appUrl: !!process.env.NEXT_PUBLIC_APP_URL
      },
      urls: {
        webhook: process.env.BOT_WEBHOOK_URL || 'NOT_SET',
        app: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET',
        endpoint: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/bot/webhook`
      },
      environment: process.env.NODE_ENV || 'unknown',
      recommendations: []
    };

    // Добавляем рекомендации
    if (!webhookInfo.configured.botToken) {
      webhookInfo.recommendations.push("Set TELEGRAM_BOT_TOKEN environment variable");
    }
    if (!webhookInfo.configured.webhookUrl) {
      webhookInfo.recommendations.push("Set BOT_WEBHOOK_URL environment variable");
    }
    if (!webhookInfo.configured.appUrl) {
      webhookInfo.recommendations.push("Set NEXT_PUBLIC_APP_URL environment variable");
    }

    console.log(`[Webhook Debug ${requestId}] 📋 Webhook info:`, webhookInfo);

    return NextResponse.json({
      success: true,
      action: "webhook-info",
      requestId,
      results: webhookInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[Webhook Debug ${requestId}] ❌ Webhook info action failed:`, error);
    throw error;
  }
}

async function handleBotStatusAction(requestId: string) {
  console.log(`[Webhook Debug ${requestId}] 🤖 Getting bot status`);
  
  try {
    let bot = getBotInstance();
    let botStatus = null;
    let initializationRequired = false;

    if (!bot) {
      console.log(`[Webhook Debug ${requestId}] 🔧 No bot instance, initializing...`);
      bot = await initializeBot();
      initializationRequired = true;
    }

    if (bot) {
      botStatus = bot.getStatus();
    }

    const status = {
      hasInstance: !!bot,
      initializationRequired,
      status: botStatus,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        botToken: process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT_SET',
        webhookUrl: process.env.BOT_WEBHOOK_URL || 'NOT_SET'
      }
    };

    console.log(`[Webhook Debug ${requestId}] 📊 Bot status:`, status);

    return NextResponse.json({
      success: true,
      action: "bot-status",
      requestId,
      results: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[Webhook Debug ${requestId}] ❌ Bot status action failed:`, error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[Webhook Debug GET ${requestId}] 🔍 Debug info request`);

  return NextResponse.json({
    success: true,
    message: "Webhook Debug Endpoint",
    requestId,
    availableActions: [
      {
        action: "test",
        method: "POST",
        description: "Run comprehensive webhook test"
      },
      {
        action: "simulate",
        method: "POST",
        description: "Simulate webhook update processing"
      },
      {
        action: "webhook-info",
        method: "POST",
        description: "Get webhook configuration info"
      },
      {
        action: "bot-status",
        method: "POST",
        description: "Get bot status and initialization info"
      }
    ],
    examples: {
      test: {
        url: "/api/bot/webhook-debug",
        method: "POST",
        body: { action: "test" }
      },
      simulate: {
        url: "/api/bot/webhook-debug",
        method: "POST",
        body: { 
          action: "simulate",
          testData: {
            update_id: 123,
            message: {
              message_id: 1,
              from: { id: 123, first_name: "Test" },
              chat: { id: 123, type: "private" },
              date: Math.floor(Date.now() / 1000),
              text: "/start"
            }
          }
        }
      }
    },
    timestamp: new Date().toISOString()
  });
}

