import type { Actions } from './$types';
import { supabaseServer } from '$lib/supabase/server';
import { generateRoomCode, generateSessionId } from '$lib/utils/draft-logic';
import { validatePlayerName } from '$lib/utils/validation';
import { redirect, fail } from '@sveltejs/kit';

export const actions: Actions = {
  createRoom: async ({ request }) => {
    console.log('STEP 1: Starting');
    try {
      console.log('STEP 2: Getting form data');
      const formData = await request.formData();
      const playerName = formData.get('playerName') as string;
      console.log('STEP 3: Player name:', playerName);
      
      console.log('STEP 4: Validating');
      const validation = validatePlayerName(playerName);
      if (!validation.valid) {
        console.log('STEP 5: Validation failed');
        return fail(400, { error: validation.error, playerName });
      }
      console.log('STEP 6: Validation passed');
      
      console.log('STEP 7: Generating code');
      let code = generateRoomCode();
      console.log('STEP 8: Generated:', code);
      
      console.log('STEP 9: Checking collision');
      let attempts = 0;
      let existingRoom = null;
      
      do {
        const { data } = await supabaseServer
          .from('rooms')
          .select('id')
          .eq('code', code)
          .single();
        
        existingRoom = data;
        if (existingRoom) code = generateRoomCode();
        attempts++;
      } while (existingRoom && attempts < 3);
      console.log('STEP 10: Code unique:', code);
      
      if (existingRoom) {
        console.log('STEP 11: Too many attempts');
        return fail(500, { error: 'Failed to create room.', playerName });
      }
      
      console.log('STEP 12: Creating room');
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
        console.log('STEP 13: Room creation failed:', roomError);
        return fail(500, { error: 'Failed to create room.', playerName });
      }
      console.log('STEP 14: Room created:', room.id);
      
      console.log('STEP 15: About to redirect to:', `/draft/${code}`);
      throw redirect(303, `/draft/${code}`);
      
    } catch (error) {
      console.log('STEP ERROR:', error);
      if (error instanceof Response && error.status === 303) {
        console.log('STEP 16: Re-throwing redirect');
        throw error;
      }
      console.log('STEP 17: Returning 500');
      return fail(500, { error: 'An unexpected error occurred. Please try again.', playerName: '' });
    }
  }
};