import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient, CLAUDE_MODEL, MAX_TOKENS } from '@/lib/claude';
import { supabase } from '@/lib/supabase';
import type { ParsedLog } from '@/lib/types';
import type { Database } from '@/lib/database.types';

export async function POST(request: NextRequest) {
  try {
    const { text, logged_by } = await request.json();

    if (!text || !logged_by) {
      return NextResponse.json(
        { error: 'Missing text or logged_by' },
        { status: 400 }
      );
    }

    // Parse natural language to structured log
    const parsedLog = await parseWithClaude(text);

    // Insert into Supabase
    const logEntry: Database['public']['Tables']['logs']['Insert'] = {
      logged_by,
      log_type: parsedLog.log_type,
      side: parsedLog.side ?? null,
      duration_minutes: parsedLog.duration_minutes ?? null,
      amount_ml: parsedLog.amount_ml ?? null,
      nappy_type: parsedLog.nappy_type ?? null,
      weight_grams: parsedLog.weight_grams ?? null,
      note: parsedLog.note ?? null,
      logged_at: parsedLog.logged_at ?? new Date().toISOString(),
      needs_review: parsedLog.needs_review ?? false,
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

    return NextResponse.json({ success: true, log: data });
  } catch (error) {
    console.error('Parse API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function parseWithClaude(text: string): Promise<ParsedLog> {
  const currentTime = new Date().toISOString();

  const systemPrompt = `You are a baby activity log parser. Extract structured data from natural language.

Output ONLY valid JSON with these fields (no markdown, no explanation):
- log_type: "breastfeed" | "bottle" | "sleep" | "nappy" | "weight" | "note"
- side?: "left" | "right" | "both" (breastfeed only)
- duration_minutes?: number
- amount_ml?: number (bottle only)
- nappy_type?: "wet" | "dirty" | "mixed"
- weight_grams?: number
- note?: string
- logged_at?: ISO8601 string (if time mentioned, calculate relative to current time)
- needs_review: boolean (true if uncertain about any field)

CRITICAL: "for X minutes" = duration. "X minutes ago" = when it started (logged_at). Do NOT confuse them.

Examples:
"breastfed for 20 minutes left side" → {"log_type":"breastfeed","side":"left","duration_minutes":20,"needs_review":false}
"breastfed for 20 minutes left tit" → {"log_type":"breastfeed","side":"left","duration_minutes":20,"needs_review":false}
"she fed on the right for 15 mins" → {"log_type":"breastfeed","side":"right","duration_minutes":15,"needs_review":false}
"fed both sides, about 10 minutes each" → {"log_type":"breastfeed","side":"both","duration_minutes":20,"needs_review":false}
"bottle, 90ml" → {"log_type":"bottle","amount_ml":90,"needs_review":false}
"gave her a bottle of 60ml 30 minutes ago" → {"log_type":"bottle","amount_ml":60,"logged_at":"${calculatePastTime(30)}","needs_review":false}
"she slept for 2 hours" → {"log_type":"sleep","duration_minutes":120,"needs_review":false}
"baby slept 45 minutes, that was at 3am" → {"log_type":"sleep","duration_minutes":45,"logged_at":"${getTodayAt3AM()}","needs_review":false}
"slept for 20 minutes 10 minutes ago" → {"log_type":"sleep","duration_minutes":20,"logged_at":"${calculatePastTime(10)}","needs_review":false}
"she slept for 30 mins starting 15 minutes ago" → {"log_type":"sleep","duration_minutes":30,"logged_at":"${calculatePastTime(15)}","needs_review":false}
"nappy change, wet" → {"log_type":"nappy","nappy_type":"wet","needs_review":false}
"dirty nappy just now" → {"log_type":"nappy","nappy_type":"dirty","needs_review":false}
"mixed nappy" → {"log_type":"nappy","nappy_type":"mixed","needs_review":false}
"she weighs 3.8 kilos" → {"log_type":"weight","weight_grams":3800,"needs_review":false}
"weight check: 4100 grams" → {"log_type":"weight","weight_grams":4100,"needs_review":false}
"note: she seemed gassy after the feed" → {"log_type":"note","note":"she seemed gassy after the feed","needs_review":false}
"fed right tit 8 mins — not sure she latched well" → {"log_type":"breastfeed","side":"right","duration_minutes":8,"note":"not sure she latched well","needs_review":true}
"quick feed left side maybe 5 minutes, around 6am" → {"log_type":"breastfeed","side":"left","duration_minutes":5,"logged_at":"${getTodayAt6AM()}","needs_review":true}

Current time: ${currentTime}

If the user mentions a past time (e.g., "30 minutes ago", "at 6am"), calculate logged_at relative to current time.
If unsure about ANY field, set needs_review to true.`;

  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: text,
        },
      ],
      system: systemPrompt,
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON response
    const parsed = JSON.parse(content.text) as ParsedLog;
    return parsed;
  } catch (error) {
    console.error('Claude API error, falling back to regex:', error);
    // Fallback to regex parser
    return parseWithRegex(text);
  }
}

function parseWithRegex(text: string): ParsedLog {
  const lower = text.toLowerCase();

  // Breastfeed patterns
  if (lower.includes('breastfed') || lower.includes('fed') || lower.includes('tit')) {
    const durationMatch = text.match(/(\d+)\s*(min|minute)/i);
    const duration = durationMatch ? parseInt(durationMatch[1]) : undefined;

    let side: 'left' | 'right' | 'both' | undefined;
    if (lower.includes('left')) side = 'left';
    else if (lower.includes('right')) side = 'right';
    else if (lower.includes('both')) side = 'both';

    return {
      log_type: 'breastfeed',
      side,
      duration_minutes: duration,
      needs_review: true, // Always flag regex-parsed entries
    };
  }

  // Bottle patterns
  if (lower.includes('bottle')) {
    const amountMatch = text.match(/(\d+)\s*ml/i);
    const amount = amountMatch ? parseInt(amountMatch[1]) : undefined;

    return {
      log_type: 'bottle',
      amount_ml: amount,
      needs_review: true,
    };
  }

  // Sleep patterns
  if (lower.includes('slept') || lower.includes('sleep')) {
    const hourMatch = text.match(/(\d+)\s*hour/i);
    const minMatch = text.match(/(\d+)\s*(min|minute)/i);

    let duration = 0;
    if (hourMatch) duration += parseInt(hourMatch[1]) * 60;
    if (minMatch) duration += parseInt(minMatch[1]);

    return {
      log_type: 'sleep',
      duration_minutes: duration || undefined,
      needs_review: true,
    };
  }

  // Nappy patterns
  if (lower.includes('nappy') || lower.includes('diaper')) {
    let nappy_type: 'wet' | 'dirty' | 'mixed' | undefined;
    if (lower.includes('wet')) nappy_type = 'wet';
    else if (lower.includes('dirty') || lower.includes('poo')) nappy_type = 'dirty';
    else if (lower.includes('mixed')) nappy_type = 'mixed';

    return {
      log_type: 'nappy',
      nappy_type,
      needs_review: true,
    };
  }

  // Weight patterns
  if (lower.includes('weight') || lower.includes('weigh') || lower.includes('kg') || lower.includes('kilo') || lower.includes('gram')) {
    const kgMatch = text.match(/(\d+\.?\d*)\s*(kg|kilo)/i);
    const gramsMatch = text.match(/(\d+)\s*(g|gram)/i);

    let weight_grams: number | undefined;
    if (kgMatch) weight_grams = Math.round(parseFloat(kgMatch[1]) * 1000);
    else if (gramsMatch) weight_grams = parseInt(gramsMatch[1]);

    return {
      log_type: 'weight',
      weight_grams,
      needs_review: true,
    };
  }

  // Default to note
  return {
    log_type: 'note',
    note: text,
    needs_review: true,
  };
}

// Helper functions for example timestamps
function calculatePastTime(minutesAgo: number): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
}

function getTodayAt3AM(): string {
  const date = new Date();
  date.setHours(3, 0, 0, 0);
  return date.toISOString();
}

function getTodayAt6AM(): string {
  const date = new Date();
  date.setHours(6, 0, 0, 0);
  return date.toISOString();
}
