import type { Actions } from './$types';
import { supabaseServer } from '$lib/supabase/server';
import { generateRoomCode, generateSessionId } from '$lib/utils/draft-logic';
import { validatePlayerName } from '$lib/utils/validation';
import { seasonGames } from '$lib/data/games';
import { redirect, fail } from '@sveltejs/kit';

export const actions: Actions = {
  createRoom: async ({ request, cookies }) => {
    try {
      const formData = await request.formData();
      const playerName = formData.get('playerName') as string;
      
      // Validate player name
      const validation = validatePlayerName(playerName);
      if (!validation.valid) {
        return fail(400, { error: validation.error, playerName });
      }
      
      // Generate unique room code
      let code = generateRoomCode();
      let attempts = 0;
      let existingRoom = null;
      
      do {
        const { data } = await supabaseServer
          .from('rooms')
          .select('id')
          .eq('code', code)
          .single();
        
        existingRoom = data;
        if (existingRoom) {
          code = generateRoomCode();
        }
        attempts++;
      } while (existingRoom && attempts < 3);
      
      if (existingRoom) {
        return fail(500, { error: 'Failed to create room. Please try again.', playerName });
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
        return fail(500, { error: 'Failed to create room. Please try again.', playerName });
      }
      
      // Generate session ID
      const sessionId = generateSessionId();
      
      // Create player (host)
      const { data: player, error: playerError } = await supabaseServer
        .from('players')
        .insert({
          room_id: room.id,
          name: playerName.trim(),
          session_id: sessionId
        })
        .select()
        .single();
      
      if (playerError || !player) {
        await supabaseServer.from('rooms').delete().eq('id', room.id);
        return fail(500, { error: 'Failed to create player. Please try again.', playerName });
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
      
      await supabaseServer.from('games').insert(gamesToInsert);
      
      // Set session cookie
      cookies.set(`tempo-${room.id}`, sessionId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      });
      
      // Redirect to draft room
      throw redirect(303, `/draft/${code}`);
      
    } catch (error) {
      if (error instanceof Response && error.status === 303) {
        throw error;
      }
      return fail(500, { error: 'An unexpected error occurred. Please try again.', playerName: '' });
    }
  }
};