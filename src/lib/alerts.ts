import type { Log, Alert } from './types';

/**
 * NHS-based alert logic (deterministic, no LLM)
 * Based on NHS newborn guidance from NHS_RULES.md
 */

export function getAlerts(logs: Log[]): Alert | null {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Filter logs from today
  const todayLogs = logs.filter(log => new Date(log.logged_at) >= todayStart);

  // Priority 1: No feed in 3+ hours
  const noFeedAlert = checkNoFeedAlert(logs, now);
  if (noFeedAlert) return noFeedAlert;

  // Priority 2: Short feed (<10 min)
  const shortFeedAlert = checkShortFeedAlert(todayLogs);
  if (shortFeedAlert) return shortFeedAlert;

  // Priority 3: Low nappy count (<6 by 8pm)
  const lowNappyAlert = checkLowNappyCountAlert(todayLogs, now);
  if (lowNappyAlert) return lowNappyAlert;

  // Priority 4: Side imbalance (>2 difference)
  const sideImbalanceAlert = checkSideImbalanceAlert(todayLogs);
  if (sideImbalanceAlert) return sideImbalanceAlert;

  return null;
}

function checkNoFeedAlert(logs: Log[], now: Date): Alert | null {
  const feedLogs = logs.filter(log =>
    log.log_type === 'breastfeed' || log.log_type === 'bottle'
  );

  if (feedLogs.length === 0) {
    return {
      type: 'no_feed',
      message: 'No feeds logged yet — consider feeding',
      severity: 'warning',
    };
  }

  // Get most recent feed
  const lastFeed = feedLogs.sort((a, b) =>
    new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
  )[0];

  const hoursSinceLastFeed = (now.getTime() - new Date(lastFeed.logged_at).getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastFeed >= 3) {
    return {
      type: 'no_feed',
      message: `No feed in ${Math.floor(hoursSinceLastFeed)}h+ — consider feeding`,
      severity: 'warning',
    };
  }

  return null;
}

function checkShortFeedAlert(todayLogs: Log[]): Alert | null {
  const breastfeeds = todayLogs.filter(log => log.log_type === 'breastfeed');

  if (breastfeeds.length === 0) return null;

  // Check most recent breastfeed
  const lastBreastfeed = breastfeeds.sort((a, b) =>
    new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
  )[0];

  if (lastBreastfeed.duration_minutes && lastBreastfeed.duration_minutes < 10) {
    return {
      type: 'short_feed',
      message: 'Short feed flagged — check latch',
      severity: 'info',
    };
  }

  return null;
}

function checkLowNappyCountAlert(todayLogs: Log[], now: Date): Alert | null {
  const hour = now.getHours();

  // Only check after 8pm (20:00)
  if (hour < 20) return null;

  const nappies = todayLogs.filter(log =>
    log.log_type === 'nappy' && (log.nappy_type === 'wet' || log.nappy_type === 'mixed')
  );

  if (nappies.length < 6) {
    return {
      type: 'low_nappy_count',
      message: `Only ${nappies.length} nappies today — monitor output`,
      severity: 'warning',
    };
  }

  return null;
}

function checkSideImbalanceAlert(todayLogs: Log[]): Alert | null {
  const breastfeeds = todayLogs.filter(log =>
    log.log_type === 'breastfeed' && log.side !== 'both'
  );

  if (breastfeeds.length === 0) return null;

  const leftCount = breastfeeds.filter(log => log.side === 'left').length;
  const rightCount = breastfeeds.filter(log => log.side === 'right').length;
  const diff = Math.abs(leftCount - rightCount);

  if (diff > 2) {
    const preferredSide = leftCount > rightCount ? 'right' : 'left';
    return {
      type: 'side_imbalance',
      message: `Feeding imbalance — offer ${preferredSide} side next`,
      severity: 'info',
    };
  }

  return null;
}

/**
 * Get side alternation suggestion based on last breastfeed
 */
export function getSideAlternationSuggestion(logs: Log[]): string | null {
  const breastfeeds = logs
    .filter(log => log.log_type === 'breastfeed' && log.side !== 'both')
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());

  if (breastfeeds.length === 0) return null;

  const lastSide = breastfeeds[0].side;
  const nextSide = lastSide === 'left' ? 'right' : 'left';

  return `Last fed: ${lastSide} — start ${nextSide} next`;
}
