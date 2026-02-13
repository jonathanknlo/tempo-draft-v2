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
      
      // Generate unique room code (with collision handling)
      let code = generateRoomCode();
      let attempts = 0;
      let existingRoom = null;
      
      do {
        const { data, error } = await supabaseServer
          .from('rooms')
          .select('id')
          .eq('code', code)
          .single();
        
        // PGRST116 = no rows returned (good - code is unique)
        if (error && error.code === 'PGRST116') {
          existingRoom = null;
        } else {
          existingRoom = data;
        }
        
        if (existingRoom) {
          code = generateRoomCode();
        }
        attempts++;
      } while (existingRoom && attempts < 3);
      
      if (existingRoom) {
        return fail(500, { error: 'Failed to generate unique code', playerName });
      }
      
      // Create room
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