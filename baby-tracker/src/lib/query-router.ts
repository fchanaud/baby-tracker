import { NHS_THRESHOLDS, evaluateFeedsMetric, evaluateNappiesMetric, evaluateSleepMetric } from './nhs-thresholds';
import type { Log } from './types';

export type QueryType = 'simple' | 'nhs-based' | 'complex';

export interface QueryResult {
  type: QueryType;
  answer?: string; // If locally answerable
  needsAPI: boolean;
}

/**
 * Routes queries to the most efficient handler:
 * - Simple: database calculations (no API)
 * - NHS-based: local rule evaluation (no API)
 * - Complex: requires Claude API for analysis
 */
export function routeQuery(question: string, todayLogs: Log[], allLogs: Log[], dateOfBirth?: string): QueryResult {
  const normalized = question.toLowerCase().trim();

  // === SIMPLE QUERIES (database only) ===

  // Feed counts
  if (normalized.match(/how many feeds? (today|so far)/i) || normalized === 'how many feeds today') {
    const count = todayLogs.filter(l => l.log_type === 'breastfeed' || l.log_type === 'bottle').length;
    return {
      type: 'simple',
      answer: `Today you've logged **${count} feed${count === 1 ? '' : 's'}**. The NHS recommends 8-12 feeds per day for newborns.`,
      needsAPI: false,
    };
  }

  // Nappy counts
  if (normalized.match(/how many napp(y|ies) (today|so far)/i) || normalized === 'how many nappies today') {
    const count = todayLogs.filter(l => l.log_type === 'nappy').length;
    const wet = todayLogs.filter(l => l.log_type === 'nappy' && (l.nappy_type === 'wet' || l.nappy_type === 'both')).length;
    return {
      type: 'simple',
      answer: `Today you've logged **${count} nappy change${count === 1 ? '' : 's'}** (${wet} wet). The NHS recommends at least 6 wet nappies per day after day 5.`,
      needsAPI: false,
    };
  }

  // Sleep total
  if (normalized.match(/(total|how much) sleep (today|so far)/i) || normalized === 'total sleep today') {
    const mins = todayLogs.filter(l => l.log_type === 'sleep')
      .reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return {
      type: 'simple',
      answer: `Today's total sleep: **${hours}h ${minutes}m**. Newborns typically need 14-19 hours of sleep per day.`,
      needsAPI: false,
    };
  }

  // Yesterday queries
  if (normalized.match(/how many feeds? yesterday/i)) {
    const yesterday = getYesterdayLogs(allLogs);
    const count = yesterday.filter(l => l.log_type === 'breastfeed' || l.log_type === 'bottle').length;
    return {
      type: 'simple',
      answer: `Yesterday you logged **${count} feed${count === 1 ? '' : 's'}**.`,
      needsAPI: false,
    };
  }

  if (normalized.match(/how many napp(y|ies) yesterday/i)) {
    const yesterday = getYesterdayLogs(allLogs);
    const count = yesterday.filter(l => l.log_type === 'nappy').length;
    const wet = yesterday.filter(l => l.log_type === 'nappy' && (l.nappy_type === 'wet' || l.nappy_type === 'both')).length;
    return {
      type: 'simple',
      answer: `Yesterday you logged **${count} nappy change${count === 1 ? '' : 's'}** (${wet} wet).`,
      needsAPI: false,
    };
  }

  if (normalized.match(/(total|how much) sleep yesterday/i)) {
    const yesterday = getYesterdayLogs(allLogs);
    const mins = yesterday.filter(l => l.log_type === 'sleep')
      .reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return {
      type: 'simple',
      answer: `Yesterday's total sleep: **${hours}h ${minutes}m**.`,
      needsAPI: false,
    };
  }

  // Last feed time
  if (normalized.match(/when (was|is) (the )?(last|most recent) feed/i) || normalized === 'last feed') {
    const feeds = allLogs.filter(l => l.log_type === 'breastfeed' || l.log_type === 'bottle')
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());

    if (feeds.length === 0) {
      return { type: 'simple', answer: 'No feeds logged yet.', needsAPI: false };
    }

    const lastFeed = feeds[0];
    const feedTime = new Date(lastFeed.logged_at);
    const now = Date.now();
    const diffMs = now - feedTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    const timeAgo = hours > 0 ? `${hours}h ${mins}m ago` : `${mins}m ago`;
    const feedType = lastFeed.log_type === 'breastfeed' ? `breastfeed (${lastFeed.side})` : 'bottle feed';

    return {
      type: 'simple',
      answer: `Last feed was **${timeAgo}** — ${feedType} by ${lastFeed.logged_by}.`,
      needsAPI: false,
    };
  }

  // Average time between feeds
  // Example: Feed 1 @ 60min ago, Feed 2 @ 40min ago, Feed 3 @ 10min ago
  // Gaps: 60→40 = 20min, 40→10 = 30min → Average = 25min
  if (normalized.match(/average (time|gap) between feeds/i) || normalized.match(/how (long|often) between feeds/i)) {
    const feeds = allLogs.filter(l => l.log_type === 'breastfeed' || l.log_type === 'bottle')
      .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());

    if (feeds.length < 2) {
      return { type: 'simple', answer: 'Need at least 2 feeds to calculate average time between them.', needsAPI: false };
    }

    // Calculate gaps between consecutive feeds (logged_at = feed end time)
    let totalGapMinutes = 0;
    for (let i = 1; i < feeds.length; i++) {
      const prevEnd = new Date(feeds[i - 1].logged_at).getTime();
      const currEnd = new Date(feeds[i].logged_at).getTime();
      totalGapMinutes += (currEnd - prevEnd) / (1000 * 60);
    }

    const avgGapMinutes = Math.round(totalGapMinutes / (feeds.length - 1));
    const avgHours = Math.floor(avgGapMinutes / 60);
    const avgMins = avgGapMinutes % 60;

    return {
      type: 'simple',
      answer: `Average time between feeds (last ${feeds.length} feeds): **${avgHours > 0 ? `${avgHours}h ` : ''}${avgMins}m**. Newborns typically feed every 2-3 hours.`,
      needsAPI: false,
    };
  }

  // === NHS-BASED QUERIES (local logic) ===

  // Am I on track? (overall)
  if (normalized.match(/am i on track|doing (ok|okay|well|good)/i) || normalized === 'on track') {
    const feedsEval = evaluateFeedsMetric(todayLogs, allLogs);
    const nappiesEval = evaluateNappiesMetric(todayLogs, dateOfBirth);
    const sleepEval = evaluateSleepMetric(todayLogs, allLogs, dateOfBirth);

    const feedIcon = feedsEval.state === 'green' ? '✅' : feedsEval.state === 'amber' ? '⚠️' : '🔴';
    const nappyIcon = nappiesEval.state === 'green' ? '✅' : nappiesEval.state === 'amber' ? '⚠️' : '🔴';
    const sleepIcon = sleepEval.state === 'green' ? '✅' : sleepEval.state === 'amber' ? '⚠️' : '🔴';

    return {
      type: 'nhs-based',
      answer: `**Today's NHS-based assessment:**

${feedIcon} **Feeds**: ${feedsEval.message}

${nappyIcon} **Nappies**: ${nappiesEval.message}

${sleepIcon} **Sleep**: ${sleepEval.message}

${feedsEval.state === 'green' && nappiesEval.state === 'green' ? '**You\'re doing great!** Keep it up.' : 'Keep logging throughout the day — these metrics update in real-time.'}`,
      needsAPI: false,
    };
  }

  // On track with nappies?
  if (normalized.match(/on track.*napp(y|ies)|napp(y|ies).*on track/i)) {
    const nappiesEval = evaluateNappiesMetric(todayLogs, dateOfBirth);
    const wetCount = todayLogs.filter(l => l.log_type === 'nappy' && (l.nappy_type === 'wet' || l.nappy_type === 'both')).length;

    return {
      type: 'nhs-based',
      answer: `**Nappies today: ${wetCount} wet**

${nappiesEval.message}

${nappiesEval.state === 'green' ? '✅ You\'re on track!' : nappiesEval.state === 'amber' ? '⚠️ Try to add a few more wet nappies.' : '🔴 Consider contacting your healthcare provider if this continues.'}`,
      needsAPI: false,
    };
  }

  // On track with feeds?
  if (normalized.match(/on track.*(feed|feeding)|feed.*on track/i)) {
    const feedsEval = evaluateFeedsMetric(todayLogs, allLogs);
    const feedCount = todayLogs.filter(l => l.log_type === 'breastfeed' || l.log_type === 'bottle').length;

    return {
      type: 'nhs-based',
      answer: `**Feeds today: ${feedCount}**

${feedsEval.message}

${feedsEval.state === 'green' ? '✅ You\'re on track!' : feedsEval.state === 'amber' ? '⚠️ Try to add a few more feeds today.' : '🔴 Try to feed more frequently — aim for every 2-3 hours.'}`,
      needsAPI: false,
    };
  }

  // === DAILY SUMMARY QUERIES ===

  // What happened today / during the day
  if (normalized.match(/what (happened|happens|did happen) (today|during the day)/i) || normalized === 'what happened today') {
    const feedCount = todayLogs.filter(l => l.log_type === 'breastfeed' || l.log_type === 'bottle').length;
    const nappyCount = todayLogs.filter(l => l.log_type === 'nappy').length;
    const sleepMins = todayLogs.filter(l => l.log_type === 'sleep').reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
    const sleepHours = Math.floor(sleepMins / 60);
    const sleepMinsRemainder = sleepMins % 60;

    return {
      type: 'simple',
      answer: `**Today's Summary:**

📊 **Feeds**: ${feedCount} total
🧷 **Nappies**: ${nappyCount} changes
😴 **Sleep**: ${sleepHours}h ${sleepMinsRemainder}m total

${feedCount >= 8 ? '✅ On track with feeding' : '⚠️ Try to add more feeds today'}
${nappyCount >= 6 ? '✅ Good nappy changes' : '⚠️ Keep logging nappy changes'}`,
      needsAPI: false,
    };
  }

  // === COMPLEX QUERIES (requires Claude API) ===

  // Patterns, trends, "why" questions, comparisons, recommendations
  return {
    type: 'complex',
    needsAPI: true,
  };
}

// Helper: Get yesterday's logs
function getYesterdayLogs(allLogs: Log[]): Log[] {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const yesterdayEnd = new Date(todayStart);
  yesterdayEnd.setMilliseconds(yesterdayEnd.getMilliseconds() - 1);

  return allLogs.filter(log => {
    const logDate = new Date(log.logged_at);
    return logDate >= yesterdayStart && logDate <= yesterdayEnd;
  });
}
