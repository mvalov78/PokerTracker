/**
 * API роут для управления турнирами с Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import { TournamentService } from '@/services/tournamentService'
import { getUserOrCreate } from '@/lib/supabase'
import { getAllTournaments, addTournament, getTournamentsByUser, deleteTournament } from '../../../data/mockData'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Проверяем, настроен ли Supabase
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    let tournaments
    if (isSupabaseConfigured) {
      try {
        // Используем Supabase
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
      } catch (supabaseError) {
        console.log('📦 Ошибка Supabase, используем fallback к mockData:', supabaseError.message)
        tournaments = userId ? getTournamentsByUser(userId) : getAllTournaments()
      }
    } else {
      // Fallback к mockData
      console.log('📦 Используем mockData (Supabase не настроен)')
      tournaments = userId ? getTournamentsByUser(userId) : getAllTournaments()
    }

    return NextResponse.json({
      success: true,
      tournaments: tournaments || []
    })
  } catch (error) {
    console.error('Ошибка получения турниров:', error)
    // Fallback к mockData при ошибке
    try {
      const tournaments = userId ? getTournamentsByUser(userId) : getAllTournaments()
      return NextResponse.json({
        success: true,
        tournaments: tournaments || []
      })
    } catch (fallbackError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tournaments' },
        { status: 500 }
      )
    }
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  try {
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (isSupabaseConfigured) {
      try {
        // Используем Supabase
        let userId = body.userId || 'user-1'
        
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
      } catch (supabaseError) {
        console.log('📦 Ошибка Supabase при создании, используем fallback к mockData:', supabaseError.message)
        const userId = body.userId || 'user-1'
        const newTournament = addTournament(body, userId)
        
        return NextResponse.json({
          success: true,
          tournament: newTournament
        })
      }
    } else {
      // Fallback к mockData
      console.log('📦 Используем mockData для создания турнира (Supabase не настроен)')
      const userId = body.userId || 'user-1'
      const newTournament = addTournament(body, userId)
      
      return NextResponse.json({
        success: true,
        tournament: newTournament
      })
    }
  } catch (error) {
    console.error('Ошибка добавления турнира:', error)
    // Fallback к mockData при ошибке
    try {
      const userId = body.userId || 'user-1'
      const newTournament = addTournament(body, userId)
      return NextResponse.json({
        success: true,
        tournament: newTournament
      })
    } catch (fallbackError) {
      return NextResponse.json(
        { success: false, error: 'Failed to create tournament' },
        { status: 500 }
      )
    }
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
    
    let success
    if (isSupabaseConfigured) {
      try {
        // Используем Supabase
        success = await TournamentService.deleteTournament(tournamentId)
      } catch (supabaseError) {
        console.log('📦 Ошибка Supabase при удалении, используем fallback к mockData:', supabaseError.message)
        success = deleteTournament(tournamentId)
      }
    } else {
      // Fallback к mockData
      console.log('📦 Используем mockData для удаления турнира (Supabase не настроен)')
      success = deleteTournament(tournamentId)
    }
    
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
  } catch (error) {
    console.error('Ошибка удаления турнира:', error)
    // Fallback к mockData при ошибке
    try {
      const success = deleteTournament(tournamentId!)
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
    } catch (fallbackError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete tournament' },
        { status: 500 }
      )
    }
  }
}