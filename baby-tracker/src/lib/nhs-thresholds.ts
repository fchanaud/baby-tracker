import type { Log } from './types';

/**
 * NHS-based thresholds and evaluation functions
 * Source: NHS newborn guidance
 */

// NHS Thresholds
export const NHS_THRESHOLDS = {
  feeds: {
    min: 8,
    max: 12,
    maxGapHours: 4,
  },
  wetNappies: {
    day1: 1,
    day2: 2,
    day3: 3,
    day4: 3,
    day5: 5,
    day6Plus: 6,
  },
  dirtyNappies: {
    minPerDayWeek1: 2,
  },
  sleep: {
    minHours: 14,
    maxHours: 19,
    targetHours: 16,
    maxStretchHoursUnder4Weeks: 5,
  },
  awake: {
    normalMaxHours: 2,
    amberThresholdHours: 2,
    redThresholdHours: 3,
  },
} as const;

export type AlertState = 'green' | 'amber' | 'red';

export interface MetricStatus {
  state: AlertState;
  message?: string;
  target?: string;
}

/**
 * Calculate baby's day of life from DOB
 */
export function getDayOfLife(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  const diffMs = now.getTime() - dob.getTime();
  const dayOfLife = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1; // +1 because day 1 starts at birth
  return Math.max(1, dayOfLife);
}

/**
 * Get wet nappy target for a specific day of life
 */
export function getWetNappyTarget(dayOfLife: number): number {
  if (dayOfLife === 1) return NHS_THRESHOLDS.wetNappies.day1;
  if (dayOfLife === 2) return NHS_THRESHOLDS.wetNappies.day2;
  if (dayOfLife === 3 || dayOfLife === 4) return NHS_THRESHOLDS.wetNappies.day3;
  if (dayOfLife === 5) return NHS_THRESHOLDS.wetNappies.day5;
  return NHS_THRESHOLDS.wetNappies.day6Plus;
}

/**
 * Check if we should show pressure messages (after 4pm)
 */
function shouldShowPressureMessages(): boolean {
  const hour = new Date().getHours();
  return hour >= 16; // 4pm or later
}

/**
 * Evaluate feeds metric
 */
export function evaluateFeedsMetric(
  todayLogs: Log[],
  allLogs: Log[]
): MetricStatus {
  const feedsToday = todayLogs.filter(
    log => log.log_type === 'breastfeed' || log.log_type === 'bottle'
  ).length;

  // Check gap between last feed
  const feedLogs = allLogs
    .filter(log => log.log_type === 'breastfeed' || log.log_type === 'bottle')
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());

  const lastFeed = feedLogs[0];
  const hoursSinceLastFeed = lastFeed
    ? (Date.now() - new Date(lastFeed.logged_at).getTime()) / (1000 * 60 * 60)
    : null;

  // Red: gap >3h or <6 feeds
  if (hoursSinceLastFeed && hoursSinceLastFeed > 3) {
    const hours = Math.floor(hoursSinceLastFeed);
    return {
      state: 'red',
      message: `No feed in ${hours}h — she may be ready to feed`,
      target: 'target 8–12',
    };
  }

  if (feedsToday < 6) {
    return {
      state: 'red',
      message: `Only ${feedsToday} feeds today — try to feed soon`,
      target: 'target 8–12',
    };
  }

  // Amber: 6-7 feeds
  if (feedsToday >= 6 && feedsToday < 8) {
    return {
      state: 'amber',
      message: shouldShowPressureMessages() ? 'Getting there — aim for 2 more feeds today' : undefined,
      target: 'target 8–12',
    };
  }

  // Green: 8-12 feeds
  return {
    state: 'green',
    target: 'target 8–12',
  };
}

/**
 * Evaluate nappies metric
 */
export function evaluateNappiesMetric(
  todayLogs: Log[],
  dateOfBirth?: string
): MetricStatus {
  const wetNappiesToday = todayLogs.filter(
    log => log.log_type === 'nappy' &&
    (log.nappy_type === 'wet' || log.nappy_type === 'both')
  ).length;

  if (!dateOfBirth) {
    return {
      state: 'green',
      target: 'target 6+',
    };
  }

  const dayOfLife = getDayOfLife(dateOfBirth);
  const target = getWetNappyTarget(dayOfLife);
  const diff = target - wetNappiesToday;

  // Red: 2+ below target or under target after 20:00
  const hour = new Date().getHours();
  if (diff >= 2 || (diff > 0 && hour >= 20)) {
    return {
      state: 'red',
      message: `Only ${wetNappiesToday} wet nappies today — keep an eye on output`,
      target: `target ${target}+`,
    };
  }

  // Amber: 1 below target
  if (diff === 1) {
    return {
      state: 'amber',
      message: shouldShowPressureMessages() ? 'Almost there — one more wet nappy expected' : undefined,
      target: `target ${target}+`,
    };
  }

  // Green: meeting target
  return {
    state: 'green',
    target: `target ${target}+`,
  };
}

/**
 * Evaluate sleep metric
 */
export function evaluateSleepMetric(
  todayLogs: Log[],
  allLogs: Log[],
  dateOfBirth?: string
): MetricStatus {
  const totalSleepMinutes = todayLogs
    .filter(log => log.log_type === 'sleep')
    .reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

  const totalSleepHours = totalSleepMinutes / 60;

  // Check if currently in a long sleep stretch (under 4 weeks)
  if (dateOfBirth) {
    const dayOfLife = getDayOfLife(dateOfBirth);
    if (dayOfLife < 28) {
      // Under 4 weeks
      const sleepLogs = allLogs
        .filter(log => log.log_type === 'sleep')
        .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());

      if (sleepLogs.length > 0) {
        const lastSleep = sleepLogs[0];
        const sleepStartTime = new Date(lastSleep.logged_at).getTime();
        const sleepEndTime = sleepStartTime + (lastSleep.duration_minutes || 0) * 60 * 1000;
        const now = Date.now();

        if (sleepEndTime > now) {
          // Currently sleeping
          const minutesAsleep = Math.floor((now - sleepStartTime) / (1000 * 60));
          const hoursAsleep = minutesAsleep / 60;

          if (hoursAsleep > NHS_THRESHOLDS.sleep.maxStretchHoursUnder4Weeks) {
            const hours = Math.floor(hoursAsleep);
            return {
              state: 'red',
              message: `She has been asleep ${hours}h — consider waking her for a feed`,
              target: 'target 14–19h',
            };
          }
        }
      }
    }
  }

  // Red: <12h
  if (totalSleepHours < 12) {
    return {
      state: 'red',
      message: 'Less sleep than usual today — watch for tired cues',
      target: 'target 14–19h',
    };
  }

  // Amber: 12-14h
  if (totalSleepHours >= 12 && totalSleepHours < 14) {
    return {
      state: 'amber',
      message: shouldShowPressureMessages() ? "Slightly under — encourage a nap if she's calm" : undefined,
      target: 'target 14–19h',
    };
  }

  // Green: 14-19h
  return {
    state: 'green',
    target: 'target 14–19h',
  };
}

/**
 * Evaluate time awake metric
 */
export function evaluateTimeAwakeMetric(
  allLogs: Log[]
): MetricStatus {
  const sleepLogs = allLogs
    .filter(log => log.log_type === 'sleep')
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());

  if (sleepLogs.length === 0) {
    return { state: 'green', target: 'normally <2h' };
  }

  const lastSleep = sleepLogs[0];
  const sleepStartTime = new Date(lastSleep.logged_at).getTime();
  const sleepEndTime = sleepStartTime + (lastSleep.duration_minutes || 0) * 60 * 1000;
  const now = Date.now();

  if (sleepEndTime > now) {
    // Currently sleeping - always green
    return { state: 'green' };
  }

  // Awake since last sleep ended
  const minutesAwake = Math.floor((now - sleepEndTime) / (1000 * 60));
  const hoursAwake = minutesAwake / 60;

  // Red: >3h
  if (hoursAwake > NHS_THRESHOLDS.awake.redThresholdHours) {
    const hours = Math.floor(hoursAwake);
    return {
      state: 'red',
      message: `Awake for ${hours}h — newborns tire quickly, try settling`,
      target: 'normally <2h',
    };
  }

  // Amber: 2-3h
  if (hoursAwake >= NHS_THRESHOLDS.awake.amberThresholdHours) {
    return {
      state: 'amber',
      message: shouldShowPressureMessages() ? "She has been awake a while — a nap may help" : undefined,
      target: 'normally <2h',
    };
  }

  // Green: <2h
  return {
    state: 'green',
    target: 'normally <2h',
  };
}

/**
 * Get most urgent red alert message across all metrics
 */
export function getMostUrgentAlert(
  feedsStatus: MetricStatus,
  nappiesStatus: MetricStatus,
  sleepStatus: MetricStatus,
  awakeStatus: MetricStatus
): string | null {
  // Priority order: nappies > feeds > sleep > awake
  if (nappiesStatus.state === 'red' && nappiesStatus.message) {
    return nappiesStatus.message;
  }
  if (feedsStatus.state === 'red' && feedsStatus.message) {
    return feedsStatus.message;
  }
  if (sleepStatus.state === 'red' && sleepStatus.message) {
    return sleepStatus.message;
  }
  if (awakeStatus.state === 'red' && awakeStatus.message) {
    return awakeStatus.message;
  }
  return null;
}
