import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase';
import { NHS_THRESHOLDS } from '@/lib/nhs-thresholds';

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

// Pre-calculated answers for common queries
function tryPreCalculatedAnswer(question: string, todayLogs: any[], yesterdayLogs: any[]): string | null {
  const normalized = question.toLowerCase().trim();

  // Today's counts
  if (normalized.match(/how many feeds? (today|so far)/i) || normalized === 'how many feeds today') {
    const count = todayLogs.filter(l => l.log_type === 'breastfeed' || l.log_type === 'bottle').length;
    return `Today you've logged ${count} feed${count === 1 ? '' : 's'}. The NHS recommends 8-12 feeds per day for newborns.`;
  }

  if (normalized.match(/how many napp(y|ies) (today|so far)/i) || normalized === 'how many nappies today') {
    const count = todayLogs.filter(l => l.log_type === 'nappy').length;
    const wet = todayLogs.filter(l => l.log_type === 'nappy' && (l.nappy_type === 'wet' || l.nappy_type === 'both')).length;
    return `Today you've logged ${count} nappy change${count === 1 ? '' : 's'} (${wet} wet). The NHS recommends at least 6 wet nappies per day after day 5.`;
  }

  if (normalized.match(/(total|how much) sleep (today|so far)/i) || normalized === 'total sleep today') {
    const mins = todayLogs.filter(l => l.log_type === 'sleep')
      .reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `Today's total sleep: ${hours}h ${minutes}m. Newborns typically need 14-19 hours of sleep per day.`;
  }

  // Yesterday's counts
  if (normalized.match(/how many feeds? yesterday/i)) {
    const count = yesterdayLogs.filter(l => l.log_type === 'breastfeed' || l.log_type === 'bottle').length;
    return `Yesterday you logged ${count} feed${count === 1 ? '' : 's'}.`;
  }

  if (normalized.match(/how many napp(y|ies) yesterday/i)) {
    const count = yesterdayLogs.filter(l => l.log_type === 'nappy').length;
    return `Yesterday you logged ${count} nappy change${count === 1 ? '' : 's'}.`;
  }

  // Am I on track
  if (normalized.match(/am i on track|doing (ok|okay|well)/i)) {
    const feeds = todayLogs.filter(l => l.log_type === 'breastfeed' || l.log_type === 'bottle').length;
    const nappies = todayLogs.filter(l => l.log_type === 'nappy' && (l.nappy_type === 'wet' || l.nappy_type === 'both')).length;

    const feedStatus = feeds >= 8 ? '✓' : feeds >= 6 ? '~' : '!';
    const nappyStatus = nappies >= 6 ? '✓' : nappies >= 4 ? '~' : '!';

    return `Today's progress:\n• Feeds: ${feeds} ${feedStatus} (target 8-12)\n• Wet nappies: ${nappies} ${nappyStatus} (target 6+)\n\n${feeds >= 8 && nappies >= 6 ? 'You\'re doing great! Keep it up.' : 'Try to add a few more feeds/nappy changes if possible.'}`;
  }

  return null; // Not a pre-calculated query
}

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

    // Fetch last 7 days of logs for context
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: logs, error } = await supabase
      .from('logs')
      .select('*')
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

    // Try pre-calculated answer first (optimization #3)
    const preCalculated = tryPreCalculatedAnswer(question, todayLogs, yesterdayLogs);
    if (preCalculated) {
      return NextResponse.json({
        success: true,
        answer: preCalculated,
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
      ? 'claude-haiku-4-20250514'
      : 'claude-sonnet-4-20250514';

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
