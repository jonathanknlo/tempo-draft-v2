import type { PageServerLoad } from './$types';
import { supabaseServer } from '$lib/supabase/server';
import { error } from '@sveltejs/kit';

// Disable prerendering and edge caching
export const prerender = false;

export const load: PageServerLoad = async ({ params, setHeaders }) => {
  // Prevent all caching
  setHeaders({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  
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
  
  // Check if room expired
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
  
  // Return data WITHOUT myPlayer - will be determined client-side
  return {
    room,
    players: players || [],
    games: games || [],
    picks: picks || [],
    // Don't determine myPlayer server-side - do it client-side to avoid caching issues
    myPlayer: null,
    isHost: false
  };
};