import type { Actions } from './$types';
import { supabaseServer } from '$lib/supabase/server';
import { generateRoomCode } from '$lib/utils/draft-logic';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
  createRoom: async ({ request }) => {
    try {
      const formData = await request.formData();
      const playerName = formData.get('playerName') as string;
      
      if (!playerName || !playerName.trim()) {
        return fail(400, { error: 'Name is required', playerName });
      }
      
      // Simple test: just create a room
      const code = 'TEST' + Math.floor(Math.random() * 10000);
      const { data: room, error } = await supabaseServer
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
      
      if (error || !room) {
        return fail(500, { error: error?.message || 'Failed to create room', playerName });
      }
      
      // Return success instead of redirect for now
      return { success: true, roomCode: room.code, roomId: room.id };
      
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return fail(500, { error: `Exception: ${msg}`, playerName: '' });
    }
  }
};