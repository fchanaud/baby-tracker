import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables');
}

// Get environment from localStorage (client-side only)
export function getEnvironment(): 'production' | 'test' {
  if (typeof window === 'undefined') {
    return 'production'; // Server-side always uses production
  }
  const stored = localStorage.getItem('baby-tracker-environment');
  return (stored === 'test' ? 'test' : 'production');
}

// Singleton Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
