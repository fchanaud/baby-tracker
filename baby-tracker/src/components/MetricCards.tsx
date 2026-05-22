'use client';

import type { Log } from '@/lib/types';

interface MetricCardsProps {
  logs: Log[]; // Logs for selected date
  allLogs: Log[]; // All logs (for "since feed" and "currently sleeping")
  selectedDate: Date;
  isToday: boolean;
}

export default function MetricCards({ logs, allLogs, selectedDate, isToday }: MetricCardsProps) {
  // Feeds
  const feeds = logs.filter(log =>
    log.log_type === 'breastfeed' || log.log_type === 'bottle'
  ).length;

  // Total sleep
  const totalSleepMinutes = logs
    .filter(log => log.log_type === 'sleep')
    .reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

  // Nappies (wet or mixed only)
  const nappies = logs.filter(log =>
    log.log_type === 'nappy' &&
    (log.nappy_type === 'wet' || log.nappy_type === 'mixed')
  ).length;

  // For today: show "Since Feed" and "Awake Since" / "Currently Sleeping"
  // For historical dates: show "Dirty Nappies"
  let card4Title = 'Since Feed';
  let card4Value = 'N/A';
  let card4Subtitle = 'Check at 3h+';
  let card4Color = 'bg-amber-50 border-amber-200';

  if (isToday) {
    // Time since last feed (from all logs, not just today)
    const feedLogs = allLogs.filter(log =>
      log.log_type === 'breastfeed' || log.log_type === 'bottle'
    );
    const lastFeed = feedLogs.length > 0 ? feedLogs[0] : null;
    const minutesSinceLastFeed = lastFeed
      ? Math.floor((Date.now() - new Date(lastFeed.logged_at).getTime()) / (1000 * 60))
      : null;

    if (minutesSinceLastFeed !== null) {
      card4Value = `${Math.floor(minutesSinceLastFeed / 60)}h ${minutesSinceLastFeed % 60}m`;
    }

    // Check if currently sleeping
    const sleepLogs = allLogs
      .filter(log => log.log_type === 'sleep')
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());

    if (sleepLogs.length > 0) {
      const lastSleep = sleepLogs[0];
      const sleepEndTime = new Date(lastSleep.logged_at).getTime() + (lastSleep.duration_minutes || 0) * 60 * 1000;
      const isCurrentlySleeping = sleepEndTime > Date.now();

      if (isCurrentlySleeping) {
        const minutesAsleep = Math.floor((Date.now() - new Date(lastSleep.logged_at).getTime()) / (1000 * 60));
        card4Title = '😴 Sleeping';
        card4Value = `${Math.floor(minutesAsleep / 60)}h ${minutesAsleep % 60}m`;
        card4Subtitle = 'Currently asleep';
        card4Color = 'bg-blue-50 border-blue-200';
      } else {
        // Awake since last sleep ended
        const minutesAwake = Math.floor((Date.now() - sleepEndTime) / (1000 * 60));
        card4Title = 'Awake Since';
        card4Value = `${Math.floor(minutesAwake / 60)}h ${minutesAwake % 60}m`;
        card4Subtitle = 'Time since sleep';
        card4Color = 'bg-amber-50 border-amber-200';
      }
    }
  } else {
    // Historical view: show dirty nappies
    const dirtyNappies = logs.filter(log =>
      log.log_type === 'nappy' &&
      (log.nappy_type === 'dirty' || log.nappy_type === 'mixed')
    ).length;

    card4Title = 'Dirty Nappies';
    card4Value = dirtyNappies.toString();
    card4Subtitle = 'Target: 1+';
    card4Color = 'bg-yellow-50 border-yellow-200';
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <MetricCard
        title="Feeds"
        value={feeds.toString()}
        subtitle="Target: 8-12"
        color="bg-green-50 border-green-200"
      />

      <MetricCard
        title="Total Sleep"
        value={`${Math.floor(totalSleepMinutes / 60)}h ${totalSleepMinutes % 60}m`}
        subtitle="Target: ~16h"
        color="bg-blue-50 border-blue-200"
      />

      <MetricCard
        title="Wet Nappies"
        value={nappies.toString()}
        subtitle="Target: 6+"
        color="bg-gray-50 border-gray-200"
      />

      <MetricCard
        title={card4Title}
        value={card4Value}
        subtitle={card4Subtitle}
        color={card4Color}
      />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: string;
}

function MetricCard({ title, value, subtitle, color }: MetricCardProps) {
  return (
    <div className={`${color} border rounded-xl p-4`}>
      <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}
