import type { RequestHandler } from './$types';
import { supabaseServer } from '$lib/supabase/server';

export const prerender = false;

export const GET: RequestHandler = async ({ params, cookies, setHeaders }) => {
  // Prevent caching
  setHeaders({
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache'
  });
  
  const { code } = params;
  
  // Get room
  const { data: room } = await supabaseServer
    .from('rooms')
    .select('id')
    .eq('code', code)
    .single();
  
  if (!room) {
    return new Response(JSON.stringify({ myPlayer: null }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Check session
  const sessionId = cookies.get(`tempo-${room.id}`);
  
  if (!sessionId) {
    return new Response(JSON.stringify({ myPlayer: null }), { 
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Get player
  const { data: player } = await supabaseServer
    .from('players')
    .select('*')
    .eq('room_id', room.id)
    .eq('session_id', sessionId)
    .single();
  
  return new Response(JSON.stringify({ myPlayer: player }), { 
    headers: { 'Content-Type': 'application/json' }
  });
};