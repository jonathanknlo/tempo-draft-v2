import type { Actions } from './$types';
import { supabaseServer } from '$lib/supabase/server';
import { generateRoomCode, generateSessionId } from '$lib/utils/draft-logic';
import { seasonGames } from '$lib/data/games';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
  createRoom: async ({ request }) => {
    try {
      const formData = await request.formData();
      const playerName = formData.get('playerName') as string;
      
      if (!playerName || !playerName.trim()) {
        return fail(400, { error: 'Name is required', playerName });
      }
      
      // Generate unique room code
      let code = generateRoomCode();
      let attempts = 0;
      let existingRoom = null;
      
      do {
        const { data, error } = await supabaseServer
          .from('rooms')
          .select('id')
          .eq('code', code)
          .single();
        
        if (error && error.code === 'PGRST116') {
          existingRoom = null;
        } else {
          existingRoom = data;
        }
        
        if (existingRoom) code = generateRoomCode();
        attempts++;
      } while (existingRoom && attempts < 3);
      
      if (existingRoom) {
        return fail(500, { error: 'Failed to generate unique code', playerName });
      }
      
      // Create room
      const { data: room, error: roomError } = await supabaseServer
        .from('rooms')
        .insert({
          code,
          status: 'waiting',
          player1_name: playerName.trim(),
          current_pick: 0,
          total_picks: 18,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();
      
      if (roomError || !room) {
        return fail(500, { error: roomError?.message || 'Room creation failed', playerName });
      }
      
      // Create player
      const sessionId = generateSessionId();
      const { error: playerError } = await supabaseServer
        .from('players')
        .insert({
          room_id: room.id,
          name: playerName.trim(),
          session_id: sessionId
        });
      
      if (playerError) {
        await supabaseServer.from('rooms').delete().eq('id', room.id);
        return fail(500, { error: playerError.message, playerName });
      }
      
      // Create games
      const gamesToInsert = seasonGames.map((game) => ({
        room_id: room.id,
        opponent: game.opponent,
        venue: game.venue,
        game_date: game.gameDate,
        game_time: game.gameTime,
        is_marquee: game.isMarquee,
        is_family: game.gameTime < '18:00'
      }));
      
      const { error: gamesError } = await supabaseServer
        .from('games')
        .insert(gamesToInsert);
      
      if (gamesError) {
        console.log('Games creation error (non-fatal):', gamesError);
      }
      
      return { success: true, roomCode: code };
      
    } catch (e) {
      return fail(500, { error: String(e), playerName: '' });
    }
  }
};