'use client';

import type { Log } from '@/lib/types';

interface MetricCardsProps {
  logs: Log[]; // Logs for selected date (today)
  allLogs: Log[]; // All logs (for time calculations)
}

export default function MetricCards({ logs, allLogs }: MetricCardsProps) {
  // 1. Feeds today
  const feedsToday = logs.filter(log =>
    log.log_type === 'breastfeed' || log.log_type === 'bottle'
  ).length;

  // 2. Total sleep today (sum of all sleep durations)
  const totalSleepMinutes = logs
    .filter(log => log.log_type === 'sleep')
    .reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
  const totalSleepHours = Math.floor(totalSleepMinutes / 60);
  const totalSleepMins = totalSleepMinutes % 60;

  // 3. Nappies today (all types)
  const nappiesToday = logs.filter(log => log.log_type === 'nappy').length;

  // 4. Time awake now (or currently sleeping)
  let awakeTitle = 'Time Awake';
  let awakeValue = 'N/A';
  let awakeColor = 'bg-amber-900 border-amber-700';

  // Check if currently sleeping
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
      awakeTitle = '😴 Sleeping';
      awakeValue = `${Math.floor(minutesAsleep / 60)}h ${minutesAsleep % 60}m`;
      awakeColor = 'bg-indigo-900 border-indigo-700';
    } else {
      // Awake since last sleep ended
      const minutesAwake = Math.floor((now - sleepEndTime) / (1000 * 60));
      awakeValue = `${Math.floor(minutesAwake / 60)}h ${minutesAwake % 60}m`;
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <MetricCard
        title="Feeds Today"
        value={feedsToday.toString()}
        color="bg-pink-900 border-pink-700"
      />

      <MetricCard
        title="Total Sleep"
        value={totalSleepMinutes > 0 ? `${totalSleepHours}h ${totalSleepMins}m` : '0h'}
        color="bg-blue-900 border-blue-700"
      />

      <MetricCard
        title="Nappies Today"
        value={nappiesToday.toString()}
        color="bg-yellow-900 border-yellow-700"
      />

      <MetricCard
        title={awakeTitle}
        value={awakeValue}
        color={awakeColor}
      />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  color: string;
}

function MetricCard({ title, value, color }: MetricCardProps) {
  return (
    <div className={`${color} border rounded-xl p-4`}>
      <p className="text-sm text-gray-400 font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-100">{value}</p>
    </div>
  );
}
