import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { logged_by, log_type, side, duration_minutes, amount_ml, nappy_type, poo_consistency, note, logged_at } = body;

    if (!logged_by || !log_type) {
      return NextResponse.json(
        { error: 'Missing logged_by or log_type' },
        { status: 400 }
      );
    }

    const logEntry: Database['public']['Tables']['logs']['Insert'] = {
      logged_by,
      log_type,
      side: side ?? null,
      duration_minutes: duration_minutes ?? null,
      amount_ml: amount_ml ?? null,
      nappy_type: nappy_type ?? null,
      poo_consistency: poo_consistency ?? null,
      note: note ?? null,
      logged_at: logged_at ?? new Date().toISOString(),
      needs_review: false,
    };

    const { data, error } = await supabase
      .from('logs')
      .insert(logEntry as any)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save log' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      log: data,
    });
  } catch (error) {
    console.error('Logs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
