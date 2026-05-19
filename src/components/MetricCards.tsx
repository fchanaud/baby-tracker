'use client';

import type { Log } from '@/lib/types';

interface MetricCardsProps {
  logs: Log[];
}

export default function MetricCards({ logs }: MetricCardsProps) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayLogs = logs.filter(log => new Date(log.logged_at) >= todayStart);

  // Feeds today
  const feedsToday = todayLogs.filter(log =>
    log.log_type === 'breastfeed' || log.log_type === 'bottle'
  ).length;

  // Total sleep
  const totalSleepMinutes = todayLogs
    .filter(log => log.log_type === 'sleep')
    .reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

  // Nappies today
  const nappiesToday = todayLogs.filter(log => log.log_type === 'nappy').length;

  // Time since last feed
  const feedLogs = logs.filter(log =>
    log.log_type === 'breastfeed' || log.log_type === 'bottle'
  );
  const lastFeed = feedLogs.length > 0 ? feedLogs[0] : null;
  const minutesSinceLastFeed = lastFeed
    ? Math.floor((Date.now() - new Date(lastFeed.logged_at).getTime()) / (1000 * 60))
    : null;

  return (
    <div className="grid grid-cols-2 gap-4">
      <MetricCard
        title="Feeds Today"
        value={feedsToday.toString()}
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
        title="Nappies"
        value={nappiesToday.toString()}
        subtitle="Target: 6+"
        color="bg-gray-50 border-gray-200"
      />

      <MetricCard
        title="Since Feed"
        value={minutesSinceLastFeed !== null ? `${Math.floor(minutesSinceLastFeed / 60)}h ${minutesSinceLastFeed % 60}m` : 'N/A'}
        subtitle="Check at 3h+"
        color="bg-amber-50 border-amber-200"
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
