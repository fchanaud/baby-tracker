import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Production credentials
const productionUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const productionKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Test credentials (set these after creating test project)
const testUrl = process.env.NEXT_PUBLIC_SUPABASE_TEST_URL || '';
const testKey = process.env.NEXT_PUBLIC_SUPABASE_TEST_ANON_KEY || '';

// Get environment from localStorage (client-side only)
function getEnvironment(): 'production' | 'test' {
  if (typeof window === 'undefined') {
    return 'production'; // Server-side always uses production
  }
  const stored = localStorage.getItem('baby-tracker-environment');
  return (stored === 'test' ? 'test' : 'production');
}

// Select credentials based on environment
function getSupabaseCredentials() {
  const env = getEnvironment();

  if (env === 'test' && testUrl && testKey) {
    return { url: testUrl, key: testKey };
  }

  return { url: productionUrl, key: productionKey };
}

const { url, key } = getSupabaseCredentials();

if (!url || !key) {
  console.warn('Missing Supabase environment variables');
}

// Singleton Supabase client (switches based on environment)
export const supabase = createClient<Database>(url, key);

// Helper to get current environment
export function getCurrentEnvironment(): 'production' | 'test' {
  return getEnvironment();
}
