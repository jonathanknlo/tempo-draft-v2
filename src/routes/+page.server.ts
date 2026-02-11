import type { Actions } from './$types';
import { supabaseServer } from '$lib/supabase/server';
import { generateRoomCode, generateSessionId } from '$lib/utils/draft-logic';
import { validatePlayerName } from '$lib/utils/validation';
import { seasonGames } from '$lib/data/games';
import { redirect, fail } from '@sveltejs/kit';

export const actions: Actions = {
  createRoom: async ({ request, cookies }) => {
    console.log('[CREATE ROOM] Starting room creation...');
    
    try {
      const formData = await request.formData();
      const playerName = formData.get('playerName') as string;
      console.log('[CREATE ROOM] Player name:', playerName);
      
      // Validate player name
      const validation = validatePlayerName(playerName);
      if (!validation.valid) {
        console.log('[CREATE ROOM] Validation failed:', validation.error);
        return fail(400, { error: validation.error, playerName });
      }
      console.log('[CREATE ROOM] Validation passed');
      
      // Generate room code (with collision handling)
      let code = generateRoomCode();
      let attempts = 0;
      let existingRoom = null;
      
      console.log('[CREATE ROOM] Generated initial code:', code);
      
      do {
        console.log(`[CREATE ROOM] Checking code collision, attempt ${attempts + 1}...`);
        const { data, error } = await supabaseServer
          .from('rooms')
          .select('id')
          .eq('code', code)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('[CREATE ROOM] Error checking room code:', error);
        }
        
        existingRoom = data;
        if (existingRoom) {
          console.log('[CREATE ROOM] Code collision detected, regenerating...');
          code = generateRoomCode();
        }
        attempts++;
      } while (existingRoom && attempts < 3);
      
      if (existingRoom) {
        console.error('[CREATE ROOM] Failed to generate unique code after 3 attempts');
        return fail(500, { error: 'Failed to create room. Please try again.', playerName });
      }
      
      console.log('[CREATE ROOM] Final room code:', code);
      
      // Create room with CORRECT schema (expires in 1 hour)
      console.log('[CREATE ROOM] Inserting room with data:', {
        code,
        status: 'waiting',
        player1_name: playerName.trim(),
        current_pick: 0,
        total_picks: 18,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      });
      
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
        console.error('[CREATE ROOM] Room creation error:', roomError);
        const errorMsg = roomError?.message || 'Failed to create room. Please try again.';
        return fail(500, { error: `Room error: ${errorMsg}`, playerName });
      }
      
      console.log('[CREATE ROOM] Room created successfully:', room.id);
      
      // Generate session ID
      const sessionId = generateSessionId();
      console.log('[CREATE ROOM] Generated session ID:', sessionId);
      
      // Create player (host)
      console.log('[CREATE ROOM] Inserting player with data:', {
        room_id: room.id,
        name: playerName.trim(),
        session_id: sessionId
      });
      
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
        console.error('[CREATE ROOM] Player creation error:', playerError);
        // Clean up the room since player creation failed
        await supabaseServer.from('rooms').delete().eq('id', room.id);
        console.log('[CREATE ROOM] Cleaned up room after player creation failure');
        const errorMsg = playerError?.message || 'Failed to create player. Please try again.';
        return fail(500, { error: `Player error: ${errorMsg}`, playerName });
      }
      
      console.log('[CREATE ROOM] Player created successfully:', player.id);
      
      // Create games for this room
      const gamesToInsert = seasonGames.map((game, index) => ({
        room_id: room.id,
        opponent: game.opponent,
        venue: game.venue,
        game_date: game.gameDate,
        game_time: game.gameTime,
        is_marquee: game.isMarquee,
        is_family: game.gameTime < '18:00'
      }));
      
      console.log('[CREATE ROOM] Inserting', gamesToInsert.length, 'games...');
      
      const { error: gamesError } = await supabaseServer
        .from('games')
        .insert(gamesToInsert);
      
      if (gamesError) {
        console.error('[CREATE ROOM] Games creation error:', gamesError);
        // Continue anyway - games can be recreated
      } else {
        console.log('[CREATE ROOM] Games created successfully');
      }
      
      // Set session cookie
      cookies.set(`tempo-${room.id}`, sessionId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      console.log('[CREATE ROOM] Session cookie set for room:', room.id);
      
      // Redirect to draft room
      console.log('[CREATE ROOM] Redirecting to /draft/', code);
      throw redirect(303, `/draft/${code}`);
      
    } catch (error) {
      console.error('[CREATE ROOM] Unexpected error:', error);
      if (error instanceof Response && error.status === 303) {
        // This is the redirect, re-throw it
        throw error;
      }
      return fail(500, { error: 'An unexpected error occurred. Please try again.', playerName: '' });
    }
  }
};
