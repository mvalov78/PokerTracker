/**
 * API роут для работы с конкретным турниром через Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import { TournamentService } from '@/services/tournamentService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    
    const tournament = await TournamentService.getTournamentById(tournamentId)
    
    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      tournament
    })
  } catch (error) {
    console.error('Ошибка получения турнира:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tournament' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const body = await request.json()
    
    // Если есть результат в теле запроса, обрабатываем его отдельно
    if (body.result) {
      const resultData = body.result
      
      // Вычисляем profit и ROI
      const tournament = await TournamentService.getTournamentById(tournamentId)
      if (!tournament) {
        return NextResponse.json(
          { success: false, error: 'Tournament not found' },
          { status: 404 }
        )
      }
      
      const profit = resultData.payout - tournament.buyin
      const roi = tournament.buyin > 0 ? (profit / tournament.buyin) * 100 : 0
      
      const finalResultData = {
        position: parseInt(resultData.position),
        payout: parseFloat(resultData.payout),
        profit: profit,
        roi: parseFloat(roi.toFixed(2)),
        notes: resultData.notes || null,
        knockouts: resultData.knockouts ? parseInt(resultData.knockouts) : 0,
        rebuyCount: resultData.rebuyCount ? parseInt(resultData.rebuyCount) : 0,
        addonCount: resultData.addonCount ? parseInt(resultData.addonCount) : 0,
        timeEliminated: resultData.timeEliminated || null,
        finalTableReached: resultData.finalTableReached || false
      }
      
      // Добавляем или обновляем результат
      if (tournament.result) {
        await TournamentService.updateTournamentResult(tournamentId, finalResultData)
      } else {
        await TournamentService.addTournamentResult(tournamentId, finalResultData)
      }
    }
    
    // Обновляем основные данные турнира (исключаем result из body)
    const { result, ...tournamentUpdates } = body
    
    if (Object.keys(tournamentUpdates).length > 0) {
      // Преобразуем данные для обновления
      const updateData: any = {}
      
      if (tournamentUpdates.name !== undefined) updateData.name = tournamentUpdates.name
      if (tournamentUpdates.date !== undefined) updateData.date = tournamentUpdates.date
      if (tournamentUpdates.venue !== undefined) updateData.venue = tournamentUpdates.venue
      if (tournamentUpdates.buyin !== undefined) updateData.buyin = parseFloat(tournamentUpdates.buyin)
      if (tournamentUpdates.tournamentType !== undefined) updateData.tournamentType = tournamentUpdates.tournamentType
      if (tournamentUpdates.structure !== undefined) updateData.structure = tournamentUpdates.structure
      if (tournamentUpdates.participants !== undefined) updateData.participants = tournamentUpdates.participants ? parseInt(tournamentUpdates.participants) : null
      if (tournamentUpdates.prizePool !== undefined) updateData.prizePool = tournamentUpdates.prizePool ? parseFloat(tournamentUpdates.prizePool) : null
      if (tournamentUpdates.blindLevels !== undefined) updateData.blindLevels = tournamentUpdates.blindLevels
      if (tournamentUpdates.startingStack !== undefined) updateData.startingStack = tournamentUpdates.startingStack ? parseInt(tournamentUpdates.startingStack) : null
      if (tournamentUpdates.ticketImageUrl !== undefined) updateData.ticketImageUrl = tournamentUpdates.ticketImageUrl
      if (tournamentUpdates.notes !== undefined) updateData.notes = tournamentUpdates.notes
      
      await TournamentService.updateTournament(tournamentId, updateData)
    }
    
    // Возвращаем обновленный турнир
    const updatedTournament = await TournamentService.getTournamentById(tournamentId)
    
    return NextResponse.json({
      success: true,
      tournament: updatedTournament
    })
  } catch (error) {
    console.error('Ошибка обновления турнира:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update tournament' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    
    const success = await TournamentService.deleteTournament(tournamentId)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Tournament deleted successfully'
    })
  } catch (error) {
    console.error('Ошибка удаления турнира:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete tournament' },
      { status: 500 }
    )
  }
}