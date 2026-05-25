import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase';
import { NHS_THRESHOLDS } from '@/lib/nhs-thresholds';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

    // Calculate today's boundaries (00:00:00 to 23:59:59 in user's local time)
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Filter logs by day for accurate counting
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

    // Build context for Claude with pre-calculated counts
    const contextMessage = `You are a helpful baby tracking assistant. Answer the parent's question about their baby's logged activities with warmth and clarity. Be supportive and non-diagnostic.

IMPORTANT - Today's definition: Today means ${todayStart.toISOString()} to ${todayEnd.toISOString()}. Use the pre-calculated "todayLogs" for today's counts.

NHS Thresholds for context:
- Feeds: ${NHS_THRESHOLDS.feeds.min}-${NHS_THRESHOLDS.feeds.max} per day, max gap ${NHS_THRESHOLDS.feeds.maxGapHours}h
- Wet nappies: ${NHS_THRESHOLDS.wetNappies.day6Plus}+ per day (after day 5)
- Sleep: ${NHS_THRESHOLDS.sleep.minHours}-${NHS_THRESHOLDS.sleep.maxHours}h per day target

Today's logs (${todayStart.toLocaleDateString()} - use these for "today" questions):
${JSON.stringify(todayLogs, null, 2)}

Yesterday's logs (${yesterdayStart.toLocaleDateString()} - use these for "yesterday" questions):
${JSON.stringify(yesterdayLogs, null, 2)}

All recent logs (last 7 days - use for trends and weekly questions):
${JSON.stringify(logs, null, 2)}

Parent's question: ${question}

CRITICAL: When the question asks about "today", count only from todayLogs array. When it asks about "yesterday", count only from yesterdayLogs array. Provide specific counts from the appropriate array.

Provide a warm, clear answer based on the logged data. Keep it conversational and supportive. If the question asks about trends, provide specific numbers from the logs. Do not provide medical diagnosis.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: contextMessage,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : 'Unable to generate response';

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
