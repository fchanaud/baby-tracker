import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

export async function DELETE() {
  const { error } = await supabase
    .from('logs')
    .delete()
    .eq('environment' as any, 'test');

  if (error) {
    console.error('Delete test data error:', error);
    return NextResponse.json({ error: 'Failed to delete test data' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { logged_by, log_type, side, duration_minutes, amount_ml, nappy_type, poo_consistency, poo_color, note, logged_at, environment, check_merge } = body;

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
      note: note ?? null,
      logged_at: logged_at ?? new Date().toISOString(),
      needs_review: false,
    };

    // Add poo_consistency if column exists (after migration)
    if (poo_consistency) {
      (logEntry as any).poo_consistency = poo_consistency;
    }

    // Add poo_color if provided
    if (poo_color) {
      (logEntry as any).poo_color = poo_color;
    }

    // Add environment (defaults to production)
    (logEntry as any).environment = environment ?? 'production';

    // Check for auto-merge: if breastfeed, look for recent opposite-side feed within 5 min
    if (check_merge && log_type === 'breastfeed' && side && side !== 'both') {
      const logTime = new Date(logged_at ?? new Date()).getTime();
      const fiveMinAgo = new Date(logTime - 5 * 60 * 1000).toISOString();

      // Find recent breastfeeds in same environment
      const { data: recentFeeds, error: fetchError } = await supabase
        .from('logs')
        .select('*')
        .eq('log_type', 'breastfeed')
        .eq('environment' as any, environment ?? 'production')
        .gte('logged_at', fiveMinAgo)
        .lte('logged_at', logged_at ?? new Date().toISOString())
        .order('logged_at', { ascending: false });

      if (!fetchError && recentFeeds && recentFeeds.length > 0) {
        // Find opposite-side feed
        const oppositeSide = side === 'left' ? 'right' : 'left';
        const matchingFeed = recentFeeds.find(f => (f as any).side === oppositeSide);

        if (matchingFeed) {
          // Merge: update existing feed to "both" and sum durations
          const mergedDuration = ((matchingFeed as any).duration_minutes ?? 0) + (duration_minutes ?? 0);
          const mergedNote = note ? `${(matchingFeed as any).note || ''} ${note}`.trim() : (matchingFeed as any).note;

          const { data: updatedFeed, error: updateError } = await (supabase as any)
            .from('logs')
            .update({
              side: 'both',
              duration_minutes: mergedDuration,
              note: mergedNote,
            })
            .eq('id', (matchingFeed as any).id)
            .select()
            .single();

          if (!updateError && updatedFeed) {
            return NextResponse.json({
              success: true,
              log: updatedFeed,
              merged: true,
            });
          }
        }
      }
    }

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
