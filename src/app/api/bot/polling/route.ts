/**
 * API роут для управления polling режимом бота
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBotInstance, initializeBot } from '../../../../bot'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { command, data } = body
    
    console.warn(`[Bot Polling API] Команда: ${command}`)

    let bot = getBotInstance()
    if (!bot) {
      bot = await initializeBot()
    }

    switch (command) {
      case 'start':
        if (!bot.getStatus().isRunning) {
          await bot.start()
          return NextResponse.json({ 
            success: true, 
            message: 'Polling запущен',
            status: bot.getStatus()
          })
        } else {
          return NextResponse.json({ 
            success: true, 
            message: 'Polling уже запущен',
            status: bot.getStatus()
          })
        }
        
      case 'stop':
        if (bot.getStatus().isRunning) {
          await bot.stop()
          return NextResponse.json({ 
            success: true, 
            message: 'Polling остановлен',
            status: bot.getStatus()
          })
        } else {
          return NextResponse.json({ 
            success: true, 
            message: 'Polling уже остановлен',
            status: bot.getStatus()
          })
        }
        
      case 'restart':
        await bot.stop()
        await new Promise(resolve => setTimeout(resolve, 1000)) // Пауза 1 сек
        await bot.start()
        return NextResponse.json({ 
          success: true, 
          message: 'Polling перезапущен',
          status: bot.getStatus()
        })
        
      case 'simulate': {
        // Симуляция команды для тестирования
        const mockUpdate = {
          update_id: Date.now(),
          message: {
            message_id: Math.floor(Math.random() * 1000),
            from: {
              id: 123456789,
              first_name: 'Test User',
              username: 'testuser'
            },
            chat: {
              id: 123456789,
              type: 'private'
            },
            date: Math.floor(Date.now() / 1000),
            text: data?.command || '/stats'
          }
        }
        
        await bot.handleUpdate(mockUpdate)
        return NextResponse.json({ 
          success: true, 
          message: `Симуляция команды ${data?.command || '/stats'} выполнена`
        })
      }
        
      default:
        return NextResponse.json({ 
          error: 'Неизвестная команда' 
        }, { status: 400 })
    }

  } catch {
    console.error('Ошибка управления polling:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    let bot = getBotInstance()
    if (!bot) {
      bot = await initializeBot()
    }
    
    const status = bot.getStatus()
    
    return NextResponse.json({
      success: true,
      polling: {
        ...status,
        uptime: 'N/A', // В реальном приложении можно добавить отслеживание времени работы
        lastUpdate: new Date().toISOString(),
        mode: 'development'
      }
    })

  } catch {
    console.error('Ошибка получения статуса polling:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
