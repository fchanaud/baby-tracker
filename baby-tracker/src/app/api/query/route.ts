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

    // Build context for Claude
    const contextMessage = `You are a helpful baby tracking assistant. Answer the parent's question about their baby's logged activities with warmth and clarity. Be supportive and non-diagnostic.

NHS Thresholds for context:
- Feeds: ${NHS_THRESHOLDS.feeds.min}-${NHS_THRESHOLDS.feeds.max} per day, max gap ${NHS_THRESHOLDS.feeds.maxGapHours}h
- Wet nappies: ${NHS_THRESHOLDS.wetNappies.day6Plus}+ per day (after day 5)
- Sleep: ${NHS_THRESHOLDS.sleep.minHours}-${NHS_THRESHOLDS.sleep.maxHours}h per day target

Recent activity logs (last 7 days):
${JSON.stringify(logs, null, 2)}

Parent's question: ${question}

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
