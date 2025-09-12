import { NextRequest, NextResponse } from 'next/server'
import { BotSessionService } from '@/services/botSessionService'

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 [Cleanup] Starting bot sessions cleanup...')
    const cleanedCount = await BotSessionService.cleanupExpiredSessions()
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired bot sessions`,
      cleanedCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error cleaning up bot sessions:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup sessions',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Bot sessions cleanup endpoint',
      endpoints: {
        POST: 'Clean up expired sessions',
        GET: 'This info'
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get session info',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
