/**
 * API роут для управления турнирами с Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import { TournamentService } from '@/services/tournamentService'
import { getUserOrCreate } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Проверяем, настроен ли Supabase
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Supabase не настроен. Проверьте переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY'
      }, { status: 500 })
    }

    let tournaments
    
    // Используем только Supabase
    if (userId) {
      // Если userId - это Telegram ID (число), найдем пользователя в БД
      if (/^\d+$/.test(userId)) {
        const user = await getUserOrCreate(parseInt(userId))
        if (user) {
          tournaments = await TournamentService.getTournamentsByUserId(user.id)
        } else {
          tournaments = []
        }
      } else {
        // UUID пользователя
        tournaments = await TournamentService.getTournamentsByUserId(userId)
      }
    } else {
      // Для демо - показываем турниры тестового пользователя
      try {
        const testUser = await getUserOrCreate(49767276, 'test_user')
        tournaments = await TournamentService.getTournamentsByUserId(testUser.id)
      } catch (userError) {
        console.log('⚠️  Не удалось получить тестового пользователя, используем фиксированный UUID')
        // Используем фиксированный UUID для тестового пользователя
        tournaments = await TournamentService.getTournamentsByUserId('00000000-0000-0000-0000-000000000001')
      }
    }

    return NextResponse.json({
      success: true,
      tournaments: tournaments || []
    })
  } catch (error) {
    console.error('Ошибка получения турниров из Supabase:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка при получении турниров из базы данных',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  try {
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Supabase не настроен. Проверьте переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY'
      }, { status: 500 })
    }

    // Используем только Supabase
    let userId = body.userId || '00000000-0000-0000-0000-000000000001'
    
    // Если userId - это Telegram ID (число), найдем или создадим пользователя в БД
    if (/^\d+$/.test(userId)) {
      const user = await getUserOrCreate(parseInt(userId))
      userId = user.id
    }
    
    // Создаем турнир через сервис
    const tournamentData = {
      userId: userId,
      name: body.name || '',
      date: body.date || new Date().toISOString(),
      venue: body.venue || null,
      buyin: parseFloat(body.buyin) || 0,
      tournamentType: body.tournamentType || 'freezeout',
      structure: body.structure || null,
      participants: body.participants ? parseInt(body.participants) : null,
      prizePool: body.prizePool ? parseFloat(body.prizePool) : null,
      blindLevels: body.blindLevels || null,
      startingStack: body.startingStack ? parseInt(body.startingStack) : null,
      ticketImageUrl: body.ticketImageUrl || null,
      notes: body.notes || null
    }
    
    const newTournament = await TournamentService.createTournamentAsAdmin(tournamentData)
    
    return NextResponse.json({
      success: true,
      tournament: newTournament
    })
  } catch {
    console.error('Ошибка создания турнира в Supabase:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка при создании турнира в базе данных',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('id')
    
    if (!tournamentId) {
      return NextResponse.json(
        { success: false, error: 'Tournament ID is required' },
        { status: 400 }
      )
    }
    
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Supabase не настроен. Проверьте переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY'
      }, { status: 500 })
    }

    // Используем только Supabase
    const success = await TournamentService.deleteTournament(tournamentId)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Tournament deleted successfully'
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      )
    }
  } catch {
    console.error('Ошибка удаления турнира из Supabase:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка при удалении турнира из базы данных',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}