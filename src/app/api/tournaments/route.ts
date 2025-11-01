/**
 * API роут для управления турнирами с Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import { TournamentService } from '@/services/tournamentService'
import { getUserOrCreate, createAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const supabase = createAdminClient()

    // Проверяем, настроен ли Supabase
    if (!supabase) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Supabase не настроен. Проверьте переменные окружения'
        }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      )
    }

    let actualUserId = userId
    
    // Если userId - это Telegram ID (число), найдем пользователя в БД
    if (userId && /^\d+$/.test(userId)) {
      const user = await getUserOrCreate(parseInt(userId))
      actualUserId = user?.id || null
    }
    
    // Если нет userId, используем тестового пользователя для демо
    if (!actualUserId) {
      try {
        const testUser = await getUserOrCreate(49767276, 'test_user')
        actualUserId = testUser.id
      } catch (userError) {
        console.log('⚠️  Не удалось получить тестового пользователя')
        actualUserId = '00000000-0000-0000-0000-000000000001'
      }
    }

    // Получаем турниры напрямую через admin client
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        tournament_results (*),
        tournament_photos (*)
      `)
      .eq('user_id', actualUserId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Ошибка получения турниров:', error)
      throw error
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        tournaments: tournaments || []
      }),
      { 
        status: 200, 
        headers: { 'content-type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Ошибка получения турниров из Supabase:', error)
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: 'Ошибка при получении турниров из базы данных',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  try {
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!isSupabaseConfigured) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Supabase не настроен. Проверьте переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY'
        }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      )
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
    
    return new NextResponse(
      JSON.stringify({
        success: true,
        tournament: newTournament
      }),
      { 
        status: 201, 
        headers: { 'content-type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Ошибка создания турнира в Supabase:', error)
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: 'Ошибка при создании турнира в базе данных',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('id')
    
    if (!tournamentId) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Tournament ID is required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      )
    }
    
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!isSupabaseConfigured) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Supabase не настроен. Проверьте переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY'
        }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      )
    }

    // Используем только Supabase
    const success = await TournamentService.deleteTournament(tournamentId)
    
    if (success) {
      return new NextResponse(
        JSON.stringify({
          success: true,
          message: 'Tournament deleted successfully'
        }),
        { 
          status: 200, 
          headers: { 'content-type': 'application/json' } 
        }
      )
    } else {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Tournament not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Ошибка удаления турнира из Supabase:', error)
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: 'Ошибка при удалении турнира из базы данных',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}