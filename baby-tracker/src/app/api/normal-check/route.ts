import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabase, getEnvironment } from '@/lib/supabase';
import { NHS_THRESHOLDS } from '@/lib/nhs-thresholds';
import type { Log } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// In-memory cache for normal check results
const checkCache = new Map<string, { answer: string, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clean up expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  checkCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_TTL) {
      checkCache.delete(key);
    }
  });
}, 10 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    const { environment } = await request.json();
    const env = environment || 'production';

    // Fetch today's logs (filtered by environment)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: logs, error } = await supabase
      .from('logs')
      .select('*')
      .eq('environment', env)
      .gte('logged_at', todayStart.toISOString())
      .order('logged_at', { ascending: false })
      .limit(200) as { data: Log[] | null; error: any };

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
        answer: "No activity logged yet today. Start logging feeds, sleep, and nappies to get insights!",
      });
    }

    // Calculate key metrics
    const feeds = logs.filter(l => l.log_type === 'breastfeed' || l.log_type === 'bottle').length;
    const wetNappies = logs.filter(l => l.log_type === 'nappy' && (l.nappy_type === 'wet' || l.nappy_type === 'both')).length;
    const sleepMinutes = logs.filter(l => l.log_type === 'sleep')
      .reduce((sum, l) => sum + (l.duration_minutes || 0), 0);

    // Check cache
    const cacheKey = `${feeds}:${wetNappies}:${sleepMinutes}`;
    const cached = checkCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        answer: cached.answer,
      });
    }

    // Calculate time since last feed
    const lastFeed = logs.find(l => l.log_type === 'breastfeed' || l.log_type === 'bottle');
    let hoursSinceLastFeed = 0;
    if (lastFeed) {
      const feedTime = new Date(lastFeed.logged_at).getTime();
      hoursSinceLastFeed = (Date.now() - feedTime) / (1000 * 60 * 60);
    }

    // Build context for Claude
    const context = `Today's summary (as of now):
- Feeds: ${feeds} (NHS target: ${NHS_THRESHOLDS.feeds.min}-${NHS_THRESHOLDS.feeds.max} per day)
- Wet nappies: ${wetNappies} (NHS target: ${NHS_THRESHOLDS.wetNappies.day6Plus}+ per day)
- Sleep: ${Math.floor(sleepMinutes/60)}h ${sleepMinutes%60}m (NHS target: ${NHS_THRESHOLDS.sleep.minHours}-${NHS_THRESHOLDS.sleep.maxHours}h per day)
- Hours since last feed: ${hoursSinceLastFeed.toFixed(1)}h (NHS max gap: ${NHS_THRESHOLDS.feeds.maxGapHours}h)`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: `You are a supportive baby tracking assistant. Answer "Is everything normal?" based on today's data and NHS newborn guidance. Be warm, reassuring, and specific. Keep it under 3 sentences. Never diagnose medical issues.`,
      messages: [
        {
          role: 'user',
          content: `Is everything normal with my baby today?\n\n${context}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text.replace(/\*\*/g, '') // Strip markdown
      : 'Unable to generate response';

    // Cache the response
    checkCache.set(cacheKey, { answer: responseText, timestamp: Date.now() });

    return NextResponse.json({
      success: true,
      answer: responseText,
    });
  } catch (error) {
    console.error('Normal check API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
