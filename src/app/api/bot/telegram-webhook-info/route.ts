/**
 * Endpoint для проверки webhook registration в Telegram API
 */

import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[Telegram Webhook Info ${requestId}] 🔍 Checking Telegram webhook registration`);

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({
        success: false,
        error: "TELEGRAM_BOT_TOKEN not configured",
        requestId
      }, { status: 400 });
    }

    // Проверяем webhook info через Telegram API
    const webhookInfoUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    
    console.log(`[Telegram Webhook Info ${requestId}] 🌐 Fetching webhook info from Telegram API`);
    
    const response = await fetch(webhookInfoUrl);
    const data = await response.json();

    console.log(`[Telegram Webhook Info ${requestId}] 📨 Telegram API response:`, data);

    if (!response.ok || !data.ok) {
      return NextResponse.json({
        success: false,
        error: "Failed to get webhook info from Telegram",
        telegramError: data.description || "Unknown error",
        requestId
      }, { status: 500 });
    }

    const webhookInfo = data.result;
    
    // Анализируем webhook configuration
    const analysis = {
      isConfigured: !!webhookInfo.url,
      url: webhookInfo.url || null,
      hasCustomCertificate: webhookInfo.has_custom_certificate || false,
      pendingUpdateCount: webhookInfo.pending_update_count || 0,
      lastErrorDate: webhookInfo.last_error_date || null,
      lastErrorMessage: webhookInfo.last_error_message || null,
      maxConnections: webhookInfo.max_connections || null,
      allowedUpdates: webhookInfo.allowed_updates || null
    };

    // Проверяем соответствие с нашими настройками
    const expectedUrl = process.env.BOT_WEBHOOK_URL;
    const urlMatches = webhookInfo.url === expectedUrl;

    console.log(`[Telegram Webhook Info ${requestId}] 📊 Analysis:`, {
      analysis,
      expectedUrl,
      urlMatches
    });

    const recommendations = [];
    
    if (!analysis.isConfigured) {
      recommendations.push("Webhook is not configured in Telegram. Use setWebhook API to configure it.");
    } else if (!urlMatches) {
      recommendations.push(`Webhook URL mismatch. Expected: ${expectedUrl}, Actual: ${webhookInfo.url}`);
    }
    
    if (analysis.pendingUpdateCount > 0) {
      recommendations.push(`There are ${analysis.pendingUpdateCount} pending updates. This might indicate webhook processing issues.`);
    }
    
    if (analysis.lastErrorDate) {
      const errorDate = new Date(analysis.lastErrorDate * 1000);
      recommendations.push(`Last error occurred at ${errorDate.toISOString()}: ${analysis.lastErrorMessage}`);
    }

    return NextResponse.json({
      success: true,
      requestId,
      telegram: {
        webhookInfo: analysis,
        rawResponse: webhookInfo
      },
      configuration: {
        expectedUrl,
        urlMatches,
        environment: process.env.NODE_ENV
      },
      recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[Telegram Webhook Info ${requestId}] 💥 Error:`, error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to check Telegram webhook info",
      details: error instanceof Error ? error.message : "Unknown error",
      requestId,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[Telegram Webhook Info ${requestId}] 🔧 Webhook management request`);

    const body = await request.json();
    const { action, webhookUrl } = body;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({
        success: false,
        error: "TELEGRAM_BOT_TOKEN not configured",
        requestId
      }, { status: 400 });
    }

    switch (action) {
      case "set":
        return await setWebhook(requestId, botToken, webhookUrl);
      case "delete":
        return await deleteWebhook(requestId, botToken);
      default:
        return NextResponse.json({
          success: false,
          error: "Unknown action",
          availableActions: ["set", "delete"],
          requestId
        }, { status: 400 });
    }

  } catch (error) {
    console.error(`[Telegram Webhook Info ${requestId}] 💥 Management error:`, error);
    
    return NextResponse.json({
      success: false,
      error: "Webhook management failed",
      details: error instanceof Error ? error.message : "Unknown error",
      requestId
    }, { status: 500 });
  }
}

async function setWebhook(requestId: string, botToken: string, webhookUrl?: string) {
  const url = webhookUrl || process.env.BOT_WEBHOOK_URL;
  
  if (!url) {
    return NextResponse.json({
      success: false,
      error: "No webhook URL provided",
      requestId
    }, { status: 400 });
  }

  console.log(`[Telegram Webhook Info ${requestId}] 🔗 Setting webhook to: ${url}`);

  const setWebhookUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
  const response = await fetch(setWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: url,
      allowed_updates: ["message", "callback_query"]
    })
  });

  const data = await response.json();
  console.log(`[Telegram Webhook Info ${requestId}] 📨 Set webhook response:`, data);

  return NextResponse.json({
    success: data.ok,
    action: "set",
    webhookUrl: url,
    telegramResponse: data,
    requestId,
    timestamp: new Date().toISOString()
  });
}

async function deleteWebhook(requestId: string, botToken: string) {
  console.log(`[Telegram Webhook Info ${requestId}] 🗑️ Deleting webhook`);

  const deleteWebhookUrl = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
  const response = await fetch(deleteWebhookUrl, {
    method: 'POST'
  });

  const data = await response.json();
  console.log(`[Telegram Webhook Info ${requestId}] 📨 Delete webhook response:`, data);

  return NextResponse.json({
    success: data.ok,
    action: "delete",
    telegramResponse: data,
    requestId,
    timestamp: new Date().toISOString()
  });
}

