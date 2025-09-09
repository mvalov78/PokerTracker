import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { Tournament, TournamentResult } from '@/types'

export class TournamentService {
  // Получить все турниры пользователя
  static async getTournamentsByUserId(userId: string): Promise<Tournament[]> {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }
    
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        tournament_results (*),
        tournament_photos (*)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch tournaments: ${error.message}`)
    }

    return data.map(this.mapDbTournamentToType)
  }

  // Получить турнир по ID
  static async getTournamentById(tournamentId: string): Promise<Tournament | null> {
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        tournament_results (*),
        tournament_photos (*)
      `)
      .eq('id', tournamentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch tournament: ${error.message}`)
    }

    return this.mapDbTournamentToType(data)
  }

  // Создать новый турнир
  static async createTournament(tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tournament> {
    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        user_id: tournament.userId,
        name: tournament.name,
        date: tournament.date,
        venue: tournament.venue,
        buyin: tournament.buyin,
        tournament_type: tournament.tournamentType,
        structure: tournament.structure,
        participants: tournament.participants,
        prize_pool: tournament.prizePool,
        blind_levels: tournament.blindLevels,
        starting_stack: tournament.startingStack,
        ticket_image_url: tournament.ticketImageUrl,
        notes: tournament.notes
      })
      .select(`
        *,
        tournament_results (*),
        tournament_photos (*)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to create tournament: ${error.message}`)
    }

    return this.mapDbTournamentToType(data)
  }

  // Создать турнир через админский клиент (для бота)
  static async createTournamentAsAdmin(tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tournament> {
    if (!supabaseAdmin) {
      throw new Error('Supabase not configured')
    }
    
    const { data, error } = await supabaseAdmin
      .from('tournaments')
      .insert({
        user_id: tournament.userId,
        name: tournament.name,
        date: tournament.date,
        venue: tournament.venue,
        buyin: tournament.buyin,
        tournament_type: tournament.tournamentType,
        structure: tournament.structure,
        participants: tournament.participants,
        prize_pool: tournament.prizePool,
        blind_levels: tournament.blindLevels,
        starting_stack: tournament.startingStack,
        ticket_image_url: tournament.ticketImageUrl,
        notes: tournament.notes
      })
      .select(`
        *,
        tournament_results (*),
        tournament_photos (*)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to create tournament: ${error.message}`)
    }

    return this.mapDbTournamentToType(data)
  }

  // Обновить турнир
  static async updateTournament(tournamentId: string, updates: Partial<Tournament>): Promise<Tournament> {
    const updateData: any = {}
    
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.date !== undefined) updateData.date = updates.date
    if (updates.venue !== undefined) updateData.venue = updates.venue
    if (updates.buyin !== undefined) updateData.buyin = updates.buyin
    if (updates.tournamentType !== undefined) updateData.tournament_type = updates.tournamentType
    if (updates.structure !== undefined) updateData.structure = updates.structure
    if (updates.participants !== undefined) updateData.participants = updates.participants
    if (updates.prizePool !== undefined) updateData.prize_pool = updates.prizePool
    if (updates.blindLevels !== undefined) updateData.blind_levels = updates.blindLevels
    if (updates.startingStack !== undefined) updateData.starting_stack = updates.startingStack
    if (updates.ticketImageUrl !== undefined) updateData.ticket_image_url = updates.ticketImageUrl
    if (updates.notes !== undefined) updateData.notes = updates.notes

    const { data, error } = await supabase
      .from('tournaments')
      .update(updateData)
      .eq('id', tournamentId)
      .select(`
        *,
        tournament_results (*),
        tournament_photos (*)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to update tournament: ${error.message}`)
    }

    return this.mapDbTournamentToType(data)
  }

  // Удалить турнир
  static async deleteTournament(tournamentId: string): Promise<boolean> {
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournamentId)

    if (error) {
      throw new Error(`Failed to delete tournament: ${error.message}`)
    }

    return true
  }

  // Добавить результат турнира (UPSERT - INSERT или UPDATE)
  static async addTournamentResult(tournamentId: string, result: Omit<TournamentResult, 'id' | 'tournamentId' | 'createdAt'>): Promise<TournamentResult> {
    const { data, error } = await supabase
      .from('tournament_results')
      .upsert({
        tournament_id: tournamentId,
        position: result.position,
        payout: result.payout,
        profit: result.profit,
        roi: result.roi,
        notes: result.notes,
        knockouts: result.knockouts,
        rebuy_count: result.rebuyCount,
        addon_count: result.addonCount,
        time_eliminated: result.timeEliminated,
        final_table_reached: result.finalTableReached
      }, {
        onConflict: 'tournament_id'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add tournament result: ${error.message}`)
    }

    return this.mapDbResultToType(data)
  }

  // Обновить результат турнира
  static async updateTournamentResult(tournamentId: string, result: Partial<TournamentResult>): Promise<TournamentResult> {
    const updateData: any = {}
    
    if (result.position !== undefined) updateData.position = result.position
    if (result.payout !== undefined) updateData.payout = result.payout
    if (result.profit !== undefined) updateData.profit = result.profit
    if (result.roi !== undefined) updateData.roi = result.roi
    if (result.notes !== undefined) updateData.notes = result.notes
    if (result.knockouts !== undefined) updateData.knockouts = result.knockouts
    if (result.rebuyCount !== undefined) updateData.rebuy_count = result.rebuyCount
    if (result.addonCount !== undefined) updateData.addon_count = result.addonCount
    if (result.timeEliminated !== undefined) updateData.time_eliminated = result.timeEliminated
    if (result.finalTableReached !== undefined) updateData.final_table_reached = result.finalTableReached

    const { data, error } = await supabase
      .from('tournament_results')
      .update(updateData)
      .eq('tournament_id', tournamentId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update tournament result: ${error.message}`)
    }

    return this.mapDbResultToType(data)
  }

  // Получить турниры без результатов для пользователя (для бота)
  static async getTournamentsWithoutResults(userId: string): Promise<Tournament[]> {
    const { data, error } = await supabaseAdmin
      .from('tournaments')
      .select(`
        *,
        tournament_results (*),
        tournament_photos (*)
      `)
      .eq('user_id', userId)
      .is('tournament_results.tournament_id', null)
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch tournaments without results: ${error.message}`)
    }

    return data.map(this.mapDbTournamentToType)
  }

  // Маппинг данных из БД в тип приложения
  private static mapDbTournamentToType(dbTournament: any): Tournament {
    return {
      id: dbTournament.id,
      userId: dbTournament.user_id,
      name: dbTournament.name,
      date: dbTournament.date,
      venue: dbTournament.venue,
      buyin: dbTournament.buyin,
      tournamentType: dbTournament.tournament_type,
      structure: dbTournament.structure,
      participants: dbTournament.participants,
      prizePool: dbTournament.prize_pool,
      blindLevels: dbTournament.blind_levels,
      startingStack: dbTournament.starting_stack,
      ticketImageUrl: dbTournament.ticket_image_url,
      notes: dbTournament.notes,
      createdAt: dbTournament.created_at,
      updatedAt: dbTournament.updated_at,
      result: dbTournament.tournament_results ? 
        (Array.isArray(dbTournament.tournament_results) 
          ? (dbTournament.tournament_results[0] ? TournamentService.mapDbResultToType(dbTournament.tournament_results[0]) : undefined)
          : TournamentService.mapDbResultToType(dbTournament.tournament_results)
        ) : undefined,
      photos: dbTournament.tournament_photos?.map((photo: any) => ({
        id: photo.id,
        tournamentId: photo.tournament_id,
        url: photo.url,
        caption: photo.caption,
        uploadedAt: photo.uploaded_at
      })) || []
    }
  }

  private static mapDbResultToType(dbResult: any): TournamentResult {
    return {
      id: dbResult.id,
      tournamentId: dbResult.tournament_id,
      position: dbResult.position,
      payout: dbResult.payout,
      profit: dbResult.profit,
      roi: dbResult.roi,
      notes: dbResult.notes,
      knockouts: dbResult.knockouts,
      rebuyCount: dbResult.rebuy_count,
      addonCount: dbResult.addon_count,
      timeEliminated: dbResult.time_eliminated,
      finalTableReached: dbResult.final_table_reached,
      createdAt: dbResult.created_at
    }
  }
}
