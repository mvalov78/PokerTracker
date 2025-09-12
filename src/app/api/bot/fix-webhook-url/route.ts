/**
 * Emergency endpoint to fix webhook URL mismatch
 */

import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[Fix Webhook URL ${requestId}] 🔧 Emergency webhook URL fix started`);

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({
        success: false,
        error: "TELEGRAM_BOT_TOKEN not configured",
        requestId
      }, { status: 400 });
    }

    // Determine correct webhook URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
    if (!appUrl) {
      return NextResponse.json({
        success: false,
        error: "No app URL configured (NEXT_PUBLIC_APP_URL or VERCEL_URL)",
        requestId
      }, { status: 400 });
    }

    const correctWebhookUrl = `${appUrl.startsWith('http') ? appUrl : `https://${appUrl}`}/api/bot/webhook`;
    
    console.log(`[Fix Webhook URL ${requestId}] 🎯 Setting correct webhook URL: ${correctWebhookUrl}`);

    // Get current webhook info first
    const getWebhookUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    const currentResponse = await fetch(getWebhookUrl);
    const currentData = await currentResponse.json();

    console.log(`[Fix Webhook URL ${requestId}] 📊 Current webhook info:`, currentData);

    // Set correct webhook URL
    const setWebhookUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
    const setResponse = await fetch(setWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: correctWebhookUrl,
        allowed_updates: ["message", "callback_query", "inline_query"]
      })
    });

    const setData = await setResponse.json();
    console.log(`[Fix Webhook URL ${requestId}] 📨 Set webhook response:`, setData);

    // Verify the change
    const verifyResponse = await fetch(getWebhookUrl);
    const verifyData = await verifyResponse.json();

    console.log(`[Fix Webhook URL ${requestId}] ✅ Verification response:`, verifyData);

    return NextResponse.json({
      success: setData.ok,
      requestId,
      fix: {
        previousUrl: currentData.result?.url || null,
        newUrl: correctWebhookUrl,
        urlFixed: setData.ok
      },
      telegram: {
        setWebhookResponse: setData,
        verificationResponse: verifyData
      },
      environment: {
        appUrl,
        vercelUrl: process.env.VERCEL_URL,
        nodeEnv: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[Fix Webhook URL ${requestId}] 💥 Error:`, error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to fix webhook URL",
      details: error instanceof Error ? error.message : "Unknown error",
      requestId,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[Fix Webhook URL GET ${requestId}] 🔍 Checking webhook URL status`);

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({
        success: false,
        error: "TELEGRAM_BOT_TOKEN not configured",
        requestId
      }, { status: 400 });
    }

    // Get current webhook info
    const getWebhookUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    const response = await fetch(getWebhookUrl);
    const data = await response.json();

    // Determine what the correct URL should be
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
    const correctWebhookUrl = appUrl ? `${appUrl.startsWith('http') ? appUrl : `https://${appUrl}`}/api/bot/webhook` : null;

    const currentUrl = data.result?.url || null;
    const urlMatches = currentUrl === correctWebhookUrl;

    console.log(`[Fix Webhook URL GET ${requestId}] 📊 URL Analysis:`, {
      currentUrl,
      correctWebhookUrl,
      urlMatches,
      appUrl,
      vercelUrl: process.env.VERCEL_URL
    });

    return NextResponse.json({
      success: true,
      requestId,
      analysis: {
        currentWebhookUrl: currentUrl,
        expectedWebhookUrl: correctWebhookUrl,
        urlMatches,
        needsFix: !urlMatches
      },
      telegram: {
        webhookInfo: data.result
      },
      environment: {
        appUrl,
        vercelUrl: process.env.VERCEL_URL,
        nodeEnv: process.env.NODE_ENV
      },
      recommendations: !urlMatches ? [
        "URL mismatch detected",
        "Use POST request to this endpoint to fix the webhook URL",
        `curl -X POST ${appUrl || 'https://your-app.vercel.app'}/api/bot/fix-webhook-url`
      ] : [
        "Webhook URL is correctly configured"
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[Fix Webhook URL GET ${requestId}] 💥 Error:`, error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to check webhook URL",
      details: error instanceof Error ? error.message : "Unknown error",
      requestId
    }, { status: 500 });
  }
}

