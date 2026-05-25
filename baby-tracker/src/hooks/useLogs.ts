'use client';

import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import type { Log } from '@/lib/types';

export function useLogs() {
  const { data, error, mutate } = useSWR<Log[]>('/api/logs', fetchLogs, {
    refreshInterval: 60000, // Refresh every 60 seconds
    revalidateOnFocus: true,
  });

  return {
    logs: data || [],
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

async function fetchLogs(): Promise<Log[]> {
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .order('logged_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Failed to fetch logs:', error);
    throw error;
  }

  return data as Log[];
}
