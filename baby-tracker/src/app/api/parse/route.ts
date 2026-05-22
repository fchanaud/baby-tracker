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

    // Reject invalid/unrelated input
    if (parsedLog.log_type === 'invalid') {
      console.error('❌ VALIDATION FAILED: Input not related to baby care');
      console.error('Original text:', text);

      return NextResponse.json({
        success: false,
        validationError: 'Not related to baby activities',
        message: 'Please say something about feeding, sleep, or nappy',
        log: parsedLog
      }, { status: 400 });
    }

    // If breastfeed without side, flag for review but allow it
    if (parsedLog.log_type === 'breastfeed' && !parsedLog.side) {
      parsedLog.needs_review = true;
      console.warn('⚠️  Breastfeed log without side - flagged for review');
    }

    // Validate reasonable ranges for values
    const validationError = validateLogValues(parsedLog);
    if (validationError) {
      console.error('❌ VALIDATION FAILED:', validationError);
      console.error('Original text:', text);
      console.error('Parsed log:', parsedLog);

      return NextResponse.json({
        success: false,
        validationError,
        message: 'Value outside reasonable range',
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

  // Preprocess common speech recognition errors
  let correctedText = text;
  const speechErrors = [
    { wrong: /wet\s+net/gi, correct: 'wet nappy' },
    { wrong: /dirty\s+net/gi, correct: 'dirty nappy' },
    { wrong: /mixed\s+net/gi, correct: 'mixed nappy' },
    { wrong: /\bnet\b/gi, correct: 'nappy' }, // standalone "net"
    { wrong: /\bnappy's?\b/gi, correct: 'nappy' }, // "nappies" or possessive
  ];

  for (const error of speechErrors) {
    correctedText = correctedText.replace(error.wrong, error.correct);
  }

  if (correctedText !== text) {
    console.log(`[Parse] Speech correction: "${text}" → "${correctedText}"`);
  }

  // Compressed prompt to minimize tokens while maintaining accuracy
  const systemPrompt = `Parse baby activity to JSON. Output ONLY JSON, no markdown.

FIRST: Check if input is baby-related (feed, sleep, nappy). If NOT related to baby care, output: {"log_type":"invalid","needs_review":false}

Fields: log_type, side?, duration_minutes?, amount_ml?, nappy_type?, note?, logged_at?, needs_review

Types: "breastfeed"|"bottle"|"sleep"|"nappy"|"note"|"invalid"
Side: "left"|"right"|"both" (breastfeed only - if mentioned use it, if not mentioned set needs_review:true)
Nappy: "wet"|"dirty"|"mixed"

CRITICAL:
- "fed" without ml/bottle = breastfeed (even if side not specified, set needs_review:true)
- "for X min" = duration, "X min ago" = logged_at timestamp
- No time specified = use current time (logged_at omitted)
- Random/unrelated text = {"log_type":"invalid"}
- "net" likely means "nappy" (speech recognition error)
- Bottle feeds can have BOTH amount_ml AND duration_minutes

Current: ${currentTime}

Examples:
"breastfed 20min left" → {"log_type":"breastfeed","side":"left","duration_minutes":20}
"fed for 10 minutes" → {"log_type":"breastfeed","duration_minutes":10,"needs_review":true}
"bottle 90ml" → {"log_type":"bottle","amount_ml":90}
"bottle 90ml took 15 minutes" → {"log_type":"bottle","amount_ml":90,"duration_minutes":15}
"slept 2 hours" → {"log_type":"sleep","duration_minutes":120}
"slept 20min 10min ago" → {"log_type":"sleep","duration_minutes":20,"logged_at":"${calculatePastTime(10)}"}
"wet nappy" → {"log_type":"nappy","nappy_type":"wet"}
"wet net" → {"log_type":"nappy","nappy_type":"wet"}
"hello world" → {"log_type":"invalid"}
"what's the weather" → {"log_type":"invalid"}

Set needs_review:true if uncertain or missing required fields.`;

  try {
    const anthropic = getAnthropicClient();
    console.log('[Parse] Input text:', text);
    console.log('[Parse] Corrected text:', correctedText);

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: correctedText, // Use corrected text
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
  // Apply same speech recognition corrections
  let correctedText = text;
  const speechErrors = [
    { wrong: /wet\s+net/gi, correct: 'wet nappy' },
    { wrong: /dirty\s+net/gi, correct: 'dirty nappy' },
    { wrong: /mixed\s+net/gi, correct: 'mixed nappy' },
    { wrong: /\bnet\b/gi, correct: 'nappy' },
  ];

  for (const error of speechErrors) {
    correctedText = correctedText.replace(error.wrong, error.correct);
  }

  const lower = correctedText.toLowerCase();

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

/**
 * Validate log values are within reasonable ranges
 */
function validateLogValues(log: ParsedLog): string | null {
  // Breastfeed duration: 1-120 minutes
  if (log.log_type === 'breastfeed' && log.duration_minutes) {
    if (log.duration_minutes < 1 || log.duration_minutes > 120) {
      return 'Breastfeed duration must be 1-120 minutes';
    }
  }

  // Bottle feed: 10-300ml reasonable for newborn
  if (log.log_type === 'bottle') {
    if (log.amount_ml && (log.amount_ml < 10 || log.amount_ml > 300)) {
      return 'Bottle amount must be 10-300ml';
    }
    // Bottle duration: 5-60 minutes
    if (log.duration_minutes && (log.duration_minutes < 1 || log.duration_minutes > 60)) {
      return 'Bottle duration must be 1-60 minutes';
    }
  }

  // Sleep duration: 10 minutes to 10 hours
  if (log.log_type === 'sleep' && log.duration_minutes) {
    if (log.duration_minutes < 10 || log.duration_minutes > 600) {
      return 'Sleep duration must be 10 minutes to 10 hours';
    }
  }

  return null;
}
