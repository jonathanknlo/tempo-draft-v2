import type { PageServerLoad } from './$types';
import { supabaseServer } from '$lib/supabase/server';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, cookies }) => {
  const { code } = params;
  
  // Get room
  const { data: room, error: roomError } = await supabaseServer
    .from('rooms')
    .select('*')
    .eq('code', code)
    .single();
  
  if (roomError || !room) {
    throw error(404, 'Room not found');
  }
  
  // Check if room expired (1 hour - CRITICAL FIX #1)
  const expiresAt = new Date(room.expires_at);
  if (expiresAt < new Date()) {
    throw error(410, 'This draft room has expired');
  }
  
  // Get players
  const { data: players } = await supabaseServer
    .from('players')
    .select('*')
    .eq('room_id', room.id);
  
  // Get games
  const { data: games } = await supabaseServer
    .from('games')
    .select('*')
    .eq('room_id', room.id)
    .order('game_date', { ascending: true });
  
  // Get picks
  const { data: picks } = await supabaseServer
    .from('picks')
    .select('*')
    .eq('room_id', room.id)
    .order('pick_number', { ascending: true });
  
  // Check if user has existing session
  const sessionId = cookies.get(`tempo-${room.id}`);
  const myPlayer = players?.find(p => p.session_id === sessionId) || null;
  
  return {
    room,
    players: players || [],
    games: games || [],
    picks: picks || [],
    myPlayer,
    isHost: myPlayer !== null && players !== null && players[0]?.id === myPlayer.id
  };
};
