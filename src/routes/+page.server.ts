import type { Actions } from './$types';
import { supabaseServer } from '$lib/supabase/server';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
  createRoom: async ({ request }) => {
    try {
      const formData = await request.formData();
      const playerName = formData.get('playerName') as string;
      
      if (!playerName || !playerName.trim()) {
        return fail(400, { error: 'Name is required', playerName });
      }
      
      // Simple room creation
      const code = 'TEST' + Math.floor(Math.random() * 10000);
      const { error } = await supabaseServer
        .from('rooms')
        .insert({
          code,
          status: 'waiting',
          player1_name: playerName.trim(),
          current_pick: 0,
          total_picks: 18,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        });
      
      if (error) {
        return fail(500, { error: error.message, playerName });
      }
      
      return { success: true, roomCode: code };
      
    } catch (e) {
      return fail(500, { error: String(e), playerName: '' });
    }
  }
};