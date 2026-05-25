'use client';

import { useState, useEffect } from 'react';
import type { Log } from '@/lib/types';
import {
  evaluateFeedsMetric,
  evaluateNappiesMetric,
  evaluateSleepMetric,
  evaluateTimeAwakeMetric,
  type AlertState,
} from '@/lib/nhs-thresholds';
import { useBabyProfile } from '@/hooks/useBabyProfile';
import MetricDetailsSheet from './MetricDetailsSheet';

interface MetricCardsProps {
  logs: Log[]; // Logs for selected date (today)
  allLogs: Log[]; // All logs (for time calculations)
}

export default function MetricCards({ logs, allLogs }: MetricCardsProps) {
  const { profile } = useBabyProfile();
  const [, forceUpdate] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState<'feeds' | 'sleep' | 'nappies' | null>(null);

  // Force re-render every minute for live time awake counter
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(n => n + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Evaluate all metrics using NHS thresholds
  const feedsStatus = evaluateFeedsMetric(logs, allLogs);
  const nappiesStatus = evaluateNappiesMetric(logs, profile?.dateOfBirth);
  const sleepStatus = evaluateSleepMetric(logs, allLogs, profile?.dateOfBirth);
  const awakeStatus = evaluateTimeAwakeMetric(allLogs);

  // Calculate display values and filter logs by type
  const feedLogs = logs.filter(log =>
    log.log_type === 'breastfeed' || log.log_type === 'bottle'
  );
  const feedsToday = feedLogs.length;

  const sleepLogs = logs.filter(log => log.log_type === 'sleep');
  const totalSleepMinutes = sleepLogs
    .reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
  const totalSleepHours = Math.floor(totalSleepMinutes / 60);
  const totalSleepMins = totalSleepMinutes % 60;

  const nappyLogs = logs.filter(
    log => log.log_type === 'nappy' &&
    (log.nappy_type === 'wet' || log.nappy_type === 'both')
  );
  const wetNappiesToday = nappyLogs.length;

  // Time awake calculation
  const allSleepLogs = allLogs
    .filter(log => log.log_type === 'sleep')
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());

  let awakeTitle = 'Time Awake';
  let awakeValue = 'N/A';
  let isCurrentlySleeping = false;

  if (allSleepLogs.length > 0) {
    const lastSleep = allSleepLogs[0];
    const sleepStartTime = new Date(lastSleep.logged_at).getTime();
    const sleepEndTime = sleepStartTime + (lastSleep.duration_minutes || 0) * 60 * 1000;
    const now = Date.now();

    if (sleepEndTime > now) {
      // Currently sleeping
      const minutesAsleep = Math.floor((now - sleepStartTime) / (1000 * 60));
      awakeTitle = '😴 Sleeping';
      awakeValue = `${Math.floor(minutesAsleep / 60)}h ${minutesAsleep % 60}m`;
      isCurrentlySleeping = true;
    } else {
      // Awake since last sleep ended
      const minutesAwake = Math.floor((now - sleepEndTime) / (1000 * 60));
      awakeValue = `${Math.floor(minutesAwake / 60)}h ${minutesAwake % 60}m`;
    }
  }

  // Get sheet title and logs based on selected metric
  const getSheetData = () => {
    switch (selectedMetric) {
      case 'feeds':
        return { title: 'Feeds Today', logs: feedLogs };
      case 'sleep':
        return { title: 'Sleep Today', logs: sleepLogs };
      case 'nappies':
        return { title: 'Nappies Today', logs: nappyLogs };
      default:
        return { title: '', logs: [] };
    }
  };

  const sheetData = getSheetData();

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          title="Feeds Today"
          value={`${feedsToday} · ${feedsStatus.target || ''}`}
          state={feedsStatus.state}
          message={feedsStatus.message}
          onClick={() => setSelectedMetric('feeds')}
        />

        <MetricCard
          title="Total Sleep"
          value={`${totalSleepMinutes > 0 ? `${totalSleepHours}h ${totalSleepMins}m` : '0h'} · ${sleepStatus.target || ''}`}
          state={sleepStatus.state}
          message={sleepStatus.message}
          onClick={() => setSelectedMetric('sleep')}
        />

        <MetricCard
          title="Nappies Today"
          value={`${wetNappiesToday} · ${nappiesStatus.target || ''}`}
          state={nappiesStatus.state}
          message={nappiesStatus.message}
          onClick={() => setSelectedMetric('nappies')}
        />

        <MetricCard
          title={awakeTitle}
          value={`${awakeValue}${isCurrentlySleeping ? '' : ` · ${awakeStatus.target || ''}`}`}
          state={awakeStatus.state}
          message={awakeStatus.message}
          onClick={undefined}
        />
      </div>

      {/* Metric Details Bottom Sheet */}
      {selectedMetric && (
        <MetricDetailsSheet
          title={sheetData.title}
          logs={sheetData.logs}
          onClose={() => setSelectedMetric(null)}
        />
      )}
    </>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  state: AlertState;
  message?: string;
  onClick?: () => void;
}

function MetricCard({ title, value, state, message, onClick }: MetricCardProps) {
  // Color based on state
  const colors = {
    green: 'bg-green-900 border-green-700',
    amber: 'bg-amber-900 border-amber-700',
    red: 'bg-red-900 border-red-700',
  };

  const baseClasses = `${colors[state]} border rounded-xl p-4`;
  const interactiveClasses = onClick
    ? 'cursor-pointer active:scale-95 transition-transform'
    : '';

  return (
    <div
      className={`${baseClasses} ${interactiveClasses}`}
      onClick={onClick}
    >
      <p className="text-sm text-gray-400 font-medium mb-1">{title}</p>
      <p className="text-lg font-bold text-gray-100 leading-tight">
        <span>{value.split(' · ')[0]}</span>
        {value.includes(' · ') && (
          <span className="text-xs font-normal text-gray-500 ml-1">
            · {value.split(' · ')[1]}
          </span>
        )}
      </p>
      {message && (
        <p className="text-xs text-gray-300 mt-2 leading-snug">{message}</p>
      )}
    </div>
  );
}
