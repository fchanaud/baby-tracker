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
    const { parsedLog, usedFallback, parseError } = await parseWithClaude(text);

    // Validate breastfeed logs must have a side
    if (parsedLog.log_type === 'breastfeed' && !parsedLog.side) {
      console.error('❌ VALIDATION FAILED: Breastfeed log without side');
      console.error('Original text:', text);
      console.error('Parsed log:', parsedLog);

      return NextResponse.json({
        success: false,
        validationError: 'Missing side information',
        message: 'Please specify which side (left or right tit)',
        log: parsedLog
      }, { status: 400 });
    }

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

    // Alert if regex fallback was used
    const warning = usedFallback
      ? `⚠️ FALLBACK USED: Claude API failed (${parseError}). Regex parser used instead.`
      : null;

    if (warning) {
      console.warn(warning);
      console.warn('Original text:', text);
      console.warn('Parsed result:', parsedLog);
    }

    return NextResponse.json({
      success: true,
      log: data,
      warning: usedFallback,
      parseError: usedFallback ? parseError : undefined
    });
  } catch (error) {
    console.error('Parse API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface ParseResult {
  parsedLog: ParsedLog;
  usedFallback: boolean;
  parseError?: string;
}

async function parseWithClaude(text: string): Promise<ParseResult> {
  const currentTime = new Date().toISOString();

  // Compressed prompt to minimize tokens while maintaining accuracy
  const systemPrompt = `Parse baby activity to JSON. Output ONLY JSON, no markdown.

Fields: log_type, side?, duration_minutes?, amount_ml?, nappy_type?, weight_grams?, note?, logged_at?, needs_review

Types: "breastfeed"|"bottle"|"sleep"|"nappy"|"weight"|"note"
Side: "left"|"right"|"both" (breastfeed only, REQUIRED)
Nappy: "wet"|"dirty"|"mixed"

CRITICAL: "for X min" = duration, "X min ago" = logged_at timestamp

Current: ${currentTime}

Examples:
"breastfed 20min left" → {"log_type":"breastfeed","side":"left","duration_minutes":20,"needs_review":false}
"bottle 90ml" → {"log_type":"bottle","amount_ml":90,"needs_review":false}
"slept 2 hours" → {"log_type":"sleep","duration_minutes":120,"needs_review":false}
"slept 20min 10min ago" → {"log_type":"sleep","duration_minutes":20,"logged_at":"${calculatePastTime(10)}","needs_review":false}
"wet nappy" → {"log_type":"nappy","nappy_type":"wet","needs_review":false}
"weighs 3.8kg" → {"log_type":"weight","weight_grams":3800,"needs_review":false}

Set needs_review:true if uncertain.`;

  try {
    const anthropic = getAnthropicClient();
    console.log('[Parse] Input text:', text);

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

    console.log('[Parse] Claude response:', content.text);

    // Strip markdown code blocks if present (Haiku sometimes adds them)
    let jsonText = content.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    // Parse JSON response
    const parsed = JSON.parse(jsonText) as ParsedLog;
    console.log('[Parse] Parsed result:', parsed);
    return { parsedLog: parsed, usedFallback: false };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Parse] Claude API error, falling back to regex:', error);

    // Fallback to regex parser
    const regexResult = parseWithRegex(text);

    return {
      parsedLog: regexResult,
      usedFallback: true,
      parseError: errorMessage
    };
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
