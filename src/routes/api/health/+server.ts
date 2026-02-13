import { json } from '@sveltejs/kit';
import { supabaseServer } from '$lib/supabase/server';

export async function GET() {
  try {
    // Test basic connectivity
    const { data, error } = await supabaseServer
      .from('rooms')
      .select('id')
      .limit(1);
    
    if (error) {
      return json({ 
        status: 'error', 
        message: error.message,
        code: error.code 
      }, { status: 500 });
    }
    
    return json({ 
      status: 'ok', 
      message: 'Supabase connection working',
      data 
    });
  } catch (e) {
    return json({ 
      status: 'error', 
      message: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 500 });
  }
}