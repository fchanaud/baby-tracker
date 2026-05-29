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
  logs: Log[];
  allLogs: Log[];
}

function timeAgo(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  // Don't show "0h" - show minutes only if less than 1 hour
  if (h === 0) return `${mins}m ago`;
  return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

function duration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  // Don't show "0h" - show minutes only if less than 1 hour
  if (h === 0) return `${mins}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function MetricCards({ logs, allLogs }: MetricCardsProps) {
  const { profile } = useBabyProfile();
  const [, forceUpdate] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState<'feeds' | 'sleep' | 'nappies' | null>(null);

  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const feedsStatus = evaluateFeedsMetric(logs, allLogs);
  const nappiesStatus = evaluateNappiesMetric(logs, profile?.dateOfBirth);
  const sleepStatus = evaluateSleepMetric(logs, allLogs, profile?.dateOfBirth);
  const awakeStatus = evaluateTimeAwakeMetric(allLogs);

  const feedLogs = logs.filter(log => log.log_type === 'breastfeed' || log.log_type === 'bottle');
  const feedsToday = feedLogs.length;

  const sleepLogs = logs.filter(log => log.log_type === 'sleep');
  const totalSleepMinutes = sleepLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
  const totalSleepHours = Math.floor(totalSleepMinutes / 60);
  const totalSleepMins = totalSleepMinutes % 60;

  const nappyLogs = logs.filter(log => log.log_type === 'nappy');
  const wetNappiesToday = nappyLogs.length;

  // Time awake
  const allSleepLogs = allLogs
    .filter(log => log.log_type === 'sleep')
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());

  let awakeValue = 'N/A';
  if (allSleepLogs.length > 0) {
    const sleepEndTime = new Date(allSleepLogs[0].logged_at).getTime();
    awakeValue = duration(Date.now() - sleepEndTime);
  }

  // Last nappy (any type)
  const lastNappy = allLogs
    .filter(log => log.log_type === 'nappy')
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())[0];
  const lastNappyValue = lastNappy ? timeAgo(Date.now() - new Date(lastNappy.logged_at).getTime()) : 'N/A';

  // Last milk — use feed end time (logged_at + duration)
  const lastMilk = allLogs
    .filter(log => log.log_type === 'breastfeed' || log.log_type === 'bottle')
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())[0];
  let lastMilkValue = 'N/A';
  let lastMilkDetail = '';
  if (lastMilk) {
    const feedEndTime = new Date(lastMilk.logged_at).getTime() + (lastMilk.duration_minutes || 0) * 60000;
    lastMilkValue = timeAgo(Date.now() - feedEndTime);
    if (lastMilk.log_type === 'breastfeed') {
      lastMilkDetail = lastMilk.side ? lastMilk.side : 'breast';
    } else {
      lastMilkDetail = lastMilk.amount_ml ? `${lastMilk.amount_ml}ml` : 'bottle';
    }
  }

  const sheetData = (() => {
    switch (selectedMetric) {
      case 'feeds': return { title: 'Feeds Today', logs: feedLogs };
      case 'sleep': return { title: 'Sleep Today', logs: sleepLogs };
      case 'nappies': return { title: 'Nappies Today', logs: nappyLogs };
      default: return { title: '', logs: [] };
    }
  })();

  return (
    <>
      {/* Totals — 3 columns in single row */}
      <div className="grid grid-cols-3 gap-3">
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
      </div>

      {/* Recency row — 3 cards */}
      <div className="grid grid-cols-3 gap-3">
        <SmallCard emoji="🧷" title="Last nappy" value={lastNappyValue} />
        <SmallCard
          emoji="⏱"
          title="Time awake"
          value={awakeValue}
          state={awakeStatus.state}
        />
        <SmallCard
          emoji="🍼"
          title="Last milk"
          value={lastMilkValue}
          detail={lastMilkDetail}
        />
      </div>

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
  const colors = {
    green: 'bg-green-900 border-green-700',
    amber: 'bg-amber-900 border-amber-700',
    red: 'bg-red-900 border-red-700',
  };
  const baseClasses = `${colors[state]} border rounded-xl p-4`;
  const interactiveClasses = onClick ? 'cursor-pointer active:scale-95 transition-transform' : '';

  return (
    <div className={`${baseClasses} ${interactiveClasses}`} onClick={onClick}>
      <p className="text-sm text-gray-400 font-medium mb-1">{title}</p>
      <p className="text-lg font-bold text-gray-100 leading-tight">
        <span>{value.split(' · ')[0]}</span>
        {value.includes(' · ') && (
          <span className="text-xs font-normal text-gray-500 ml-1">· {value.split(' · ')[1]}</span>
        )}
      </p>
      {message && <p className="text-xs text-gray-300 mt-2 leading-snug">{message}</p>}
    </div>
  );
}

interface SmallCardProps {
  emoji: string;
  title: string;
  value: string;
  detail?: string;
  state?: AlertState;
}

function SmallCard({ emoji, title, value, detail, state }: SmallCardProps) {
  const borderColor = state === 'red' ? 'border-red-700' : state === 'amber' ? 'border-amber-700' : 'border-gray-700';
  return (
    <div className={`bg-gray-800 border ${borderColor} rounded-xl p-3 flex flex-col gap-1`}>
      <p className="text-xs text-gray-400 font-medium leading-none">{emoji} {title}</p>
      <p className="text-sm font-bold text-gray-100 leading-tight">{value}</p>
      {detail && <p className="text-xs text-gray-500 leading-none">{detail}</p>}
    </div>
  );
}
