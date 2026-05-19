import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient, CLAUDE_MODEL, MAX_TOKENS } from '@/lib/claude';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query' },
        { status: 400 }
      );
    }

    // Fetch all logs from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: logs, error } = await supabase
      .from('logs')
      .select('*')
      .gte('logged_at', thirtyDaysAgo.toISOString())
      .order('logged_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch logs' },
        { status: 500 }
      );
    }

    // Generate report with Claude
    const report = await generateReport(query, logs || []);

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateReport(query: string, logs: any[]): Promise<string> {
  const currentTime = new Date().toISOString();

  // Compress prompt and use compact JSON to reduce tokens
  const systemPrompt = `Answer baby log questions. Be concise (<150 words), parent-friendly, no medical diagnoses.

Date: ${currentTime}
Data: ${JSON.stringify(logs)}`;

  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300, // Increased slightly for report responses
      messages: [
        {
          role: 'user',
          content: query,
        },
      ],
      // Use prompt caching for the system prompt
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }
        }
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return content.text;
  } catch (error) {
    console.error('Claude API error:', error);
    return 'Sorry, I could not generate a report at this time. Please try again later.';
  }
}
