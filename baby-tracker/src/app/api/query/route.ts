import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabase, getEnvironment } from '@/lib/supabase';
import { NHS_THRESHOLDS } from '@/lib/nhs-thresholds';
import { routeQuery } from '@/lib/query-router';
import type { Log } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// In-memory cache for query deduplication
const queryCache = new Map<string, { answer: string, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clean up expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  queryCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_TTL) {
      queryCache.delete(key);
    }
  });
}, 10 * 60 * 1000);

// Optimize log data - only send relevant fields
function optimizeLogs(logs: any[]) {
  return logs.map(log => ({
    t: log.log_type,
    la: log.logged_at,
    lb: log.logged_by,
    ...(log.log_type === 'sleep' && { d: log.duration_minutes }),
    ...(log.log_type === 'breastfeed' && { s: log.side, d: log.duration_minutes }),
    ...(log.log_type === 'bottle' && { a: log.amount_ml }),
    ...(log.log_type === 'nappy' && { n: log.nappy_type }),
  }));
}

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Fetch last 7 days of logs for context (filtered by environment)
    const environment = getEnvironment();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: logs, error } = await supabase
      .from('logs')
      .select('*')
      .eq('environment', environment)
      .gte('logged_at', sevenDaysAgo.toISOString())
      .order('logged_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch logs' },
        { status: 500 }
      );
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json({
        success: true,
        answer: "I don't have any logged activities yet. Start logging feeds, sleep, and nappies to get insights!",
      });
    }

    // Calculate today's boundaries
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const todayLogs = logs.filter((log: any) => {
      const logDate = new Date(log.logged_at);
      return logDate >= todayStart && logDate <= todayEnd;
    });

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayLogs = logs.filter((log: any) => {
      const logDate = new Date(log.logged_at);
      return logDate >= yesterdayStart && logDate < todayStart;
    });

    // Fetch baby profile for age-based NHS rules
    const { data: profileData } = await supabase
      .from('baby_profile')
      .select('*')
      .single();

    const dateOfBirth = (profileData as any)?.date_of_birth as string | undefined;

    // Route query to most efficient handler
    const routeResult = routeQuery(question, todayLogs as Log[], logs as Log[], dateOfBirth);

    // If answerable locally (simple or NHS-based), return immediately
    if (!routeResult.needsAPI && routeResult.answer) {
      return NextResponse.json({
        success: true,
        answer: routeResult.answer,
        queryType: routeResult.type, // For analytics
      });
    }

    // Check cache for deduplication (optimization #5)
    const cacheKey = `${question}:${todayLogs.length}:${yesterdayLogs.length}`;
    const cached = queryCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        answer: cached.answer,
      });
    }

    // Optimize logs payload (optimization #2)
    const optimizedTodayLogs = optimizeLogs(todayLogs);
    const optimizedYesterdayLogs = optimizeLogs(yesterdayLogs);
    const optimizedAllLogs = optimizeLogs(logs);

    // Build cached system context
    const nhsContext = `NHS Thresholds for newborns:
- Feeds: ${NHS_THRESHOLDS.feeds.min}-${NHS_THRESHOLDS.feeds.max} per day, max gap ${NHS_THRESHOLDS.feeds.maxGapHours}h
- Wet nappies: ${NHS_THRESHOLDS.wetNappies.day6Plus}+ per day (after day 5)
- Sleep: ${NHS_THRESHOLDS.sleep.minHours}-${NHS_THRESHOLDS.sleep.maxHours}h per day target

Log format: t=type, la=logged_at, lb=logged_by, d=duration_minutes, s=side, a=amount_ml, n=nappy_type`;

    const dataContext = `Today (${todayStart.toLocaleDateString()}):
${JSON.stringify(optimizedTodayLogs)}

Yesterday (${yesterdayStart.toLocaleDateString()}):
${JSON.stringify(optimizedYesterdayLogs)}

Last 7 days:
${JSON.stringify(optimizedAllLogs)}`;

    // Determine if this is a simple query (optimization #6)
    const isSimpleQuery = /^(how many|count|total|number of|when|what time)/i.test(question);
    const model = isSimpleQuery
      ? 'claude-haiku-4-5-20251001'
      : 'claude-sonnet-4-6';

    // Use prompt caching (optimization #1)
    // Note: Prompt caching available in SDK 0.30+
    const message = await anthropic.messages.create({
      model: model,
      max_tokens: 512, // Reduced from 1024 (optimization #4)
      system: [
        {
          type: "text",
          text: `You are a helpful baby tracking assistant. Answer questions about logged baby activities with warmth and clarity. Be supportive and non-diagnostic.

IMPORTANT: When asked about "today", use only the Today logs. For "yesterday", use Yesterday logs. For trends, use the 7-day logs.

${nhsContext}`,
          cache_control: { type: "ephemeral" } as any // Cache static NHS context
        },
        {
          type: "text",
          text: dataContext,
          cache_control: { type: "ephemeral" } as any // Cache data (refreshes every 5 min)
        }
      ] as any,
      messages: [
        {
          role: 'user',
          content: `${question}\n\nProvide a warm, clear answer based on the logged data. Keep it conversational and supportive. Provide specific counts. Do not provide medical diagnosis.`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : 'Unable to generate response';

    // Cache the response (optimization #5)
    queryCache.set(cacheKey, { answer: responseText, timestamp: Date.now() });

    return NextResponse.json({
      success: true,
      answer: responseText,
    });
  } catch (error) {
    console.error('Query API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
