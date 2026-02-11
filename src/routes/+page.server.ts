import type { Actions } from './$types';
import { supabaseServer } from '$lib/supabase/server';
import { generateRoomCode, generateSessionId } from '$lib/utils/draft-logic';
import { validatePlayerName } from '$lib/utils/validation';
import { seasonGames } from '$lib/data/games';
import { redirect, fail } from '@sveltejs/kit';

export const actions: Actions = {
  createRoom: async ({ request, cookies }) => {
    const formData = await request.formData();
    const playerName = formData.get('playerName') as string;
    
    // Validate player name
    const validation = validatePlayerName(playerName);
    if (!validation.valid) {
      return fail(400, { error: validation.error, playerName });
    }
    
    // Generate room code (with collision handling)
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
    
    // Create room (expires in 1 hour - CRITICAL FIX #1)
    const { data: room, error: roomError } = await supabaseServer
      .from('rooms')
      .insert({
        code,
        status: 'waiting',
        turn_number: 0,
        total_turns: 18,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
      })
      .select()
      .single();
    
    if (roomError || !room) {
      console.error('Room creation error:', roomError);
      const errorMsg = roomError?.message || 'Failed to create room. Please try again.';
      return fail(500, { error: `Room error: ${errorMsg}`, playerName });
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
      console.error('Player creation error:', playerError);
      const errorMsg = playerError?.message || 'Failed to create player. Please try again.';
      return fail(500, { error: `Player error: ${errorMsg}`, playerName });
    }
    
    // Create games for this room
    const gamesToInsert = seasonGames.map((game, index) => ({
      room_id: room.id,
      opponent: game.opponent,
      venue: game.venue,
      game_date: game.gameDate,
      game_time: game.gameTime,
      is_marquee: game.isMarquee,
      is_family: game.gameTime < '18:00' // CRITICAL FIX #4: Use game local time
    }));
    
    const { error: gamesError } = await supabaseServer
      .from('games')
      .insert(gamesToInsert);
    
    if (gamesError) {
      console.error('Games creation error:', gamesError);
      // Continue anyway - games can be recreated
    }
    
    // Set session cookie
    cookies.set(`tempo-${room.id}`, sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    // Redirect to draft room
    throw redirect(303, `/draft/${code}`);
  }
};
