import type { Actions } from './$types';
import { supabaseServer } from '$lib/supabase/server';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
  createRoom: async ({ request }) => {
    console.log('[TEST] Starting simple test...');
    
    try {
      const formData = await request.formData();
      const playerName = formData.get('playerName') as string;
      console.log('[TEST] Player name:', playerName);
      
      if (!playerName || !playerName.trim()) {
        return fail(400, { error: 'Name is required', playerName });
      }
      
      // Simple test insert
      console.log('[TEST] Attempting Supabase insert...');
      const { data: room, error } = await supabaseServer
        .from('rooms')
        .insert({
          code: 'TEST' + Math.floor(Math.random() * 10000),
          status: 'waiting',
          player1_name: playerName.trim(),
          current_pick: 0,
          total_picks: 18,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('[TEST] Supabase error:', error);
        return fail(500, { error: `DB Error: ${error.message}`, playerName });
      }
      
      console.log('[TEST] Success! Room:', room.id);
      return { success: true, roomCode: room.code, roomId: room.id };
      
    } catch (e) {
      console.error('[TEST] Exception:', e);
      return fail(500, { error: `Exception: ${e instanceof Error ? e.message : 'Unknown'}`, playerName: '' });
    }
  }
};