import type { Log, Alert } from './types';

/**
 * NHS-based alert logic (deterministic, no LLM)
 * Based on NHS newborn guidance from NHS_RULES.md
 */

export function getAlerts(logs: Log[], selectedDate: Date = new Date()): Alert | null {
  const dateStart = new Date(selectedDate);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(selectedDate);
  dateEnd.setHours(23, 59, 59, 999);

  // Filter logs for selected date
  const dateLogs = logs.filter(log => {
    const logDate = new Date(log.logged_at);
    return logDate >= dateStart && logDate <= dateEnd;
  });

  // Check if selected date is today
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // NHS Priority Order (from NHS_RULES.md):
  // 1. Wet nappies (highest signal)
  // 2. Feeding frequency
  // 3. Weight trend
  // 4. Side imbalance (supporting)

  // Priority 1: Low nappy count (<6 by 8pm) - HIGHEST PRIORITY per NHS
  if (isToday) {
    const lowNappyAlert = checkLowNappyCountAlert(dateLogs, selectedDate);
    if (lowNappyAlert) return lowNappyAlert;
  }

  // Priority 2: No feed in 3+ hours (only check for today)
  if (isToday) {
    const noFeedAlert = checkNoFeedAlert(logs, selectedDate);
    if (noFeedAlert) return noFeedAlert;
  }

  // Priority 3: Short feed (<10 min)
  const shortFeedAlert = checkShortFeedAlert(dateLogs);
  if (shortFeedAlert) return shortFeedAlert;

  // Priority 5: Side imbalance (>2 difference)
  const sideImbalanceAlert = checkSideImbalanceAlert(dateLogs);
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

function checkLowNappyCountAlert(todayLogs: Log[], date: Date): Alert | null {
  const hour = date.getHours();

  // Only check after 8pm (20:00)
  if (hour < 20) return null;

  const nappies = todayLogs.filter(log =>
    log.log_type === 'nappy' && (log.nappy_type === 'wet' || log.nappy_type === 'mixed')
  );

  if (nappies.length < 6) {
    return {
      type: 'low_nappy_count',
      message: `Only ${nappies.length} wet nappies today — monitor output (NHS: 6+ expected)`,
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
