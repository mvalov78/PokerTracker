import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const packageJson = require('../../../../../package.json')
  
  // Проверяем, какой URL будет использоваться в bot командах
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pokertracker-pro.vercel.app'
  const apiUrl = `${appUrl}/api/tournaments`
  
  const debugInfo = {
    version: packageJson.version,
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      VERCEL_URL: process.env.VERCEL_URL,
    },
    computedUrls: {
      appUrl,
      apiUrl,
      webhookUrl: process.env.BOT_WEBHOOK_URL
    },
    deployment: {
      vercelUrl: process.env.VERCEL_URL,
      vercelEnv: process.env.VERCEL_ENV,
      vercelGitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7)
    }
  }
  
  return NextResponse.json({
    success: true,
    debug: debugInfo
  })
}