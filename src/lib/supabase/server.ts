import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Hardcoded for demo - in production use environment variables
const supabaseUrl = 'https://ovudfkhhzosgsmimhrdc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92dWRma2hoem9zZ3NtaW1ocmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTg0MzgsImV4cCI6MjA4NjM5NDQzOH0.D2ZadxbFDTB3Sr0dl1NF5lmS8UBgou77E7VQawfJdbg';

export const supabaseServer = createClient<Database>(supabaseUrl, supabaseKey);
