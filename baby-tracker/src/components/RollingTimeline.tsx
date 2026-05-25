'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Log } from '@/lib/types';

interface RollingTimelineProps {
  logs: Log[];
  onActivityTap: (log: Log) => void;
}

export default function RollingTimeline({ logs, onActivityTap }: RollingTimelineProps) {
  const [now, setNow] = useState(Date.now());

  // Update "now" every minute to shift timeline
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, []);

  // Calculate 8-hour window: 4h before and 4h after now
  const { startTime, endTime, visibleLogs, nappyLogs } = useMemo(() => {
    const start = now - 4 * 60 * 60 * 1000; // 4 hours ago
    const end = now + 4 * 60 * 60 * 1000; // 4 hours from now

    const visible = logs.filter(log => {
      const logTime = new Date(log.logged_at).getTime();
      return logTime >= start && logTime <= end && log.log_type !== 'note';
    });

    // Separate nappies from timed activities
    const nappies = visible.filter(log => log.log_type === 'nappy');
    const timed = visible.filter(log => log.log_type !== 'nappy');

    return {
      startTime: start,
      endTime: end,
      visibleLogs: timed,
      nappyLogs: nappies,
    };
  }, [logs, now]);

  // Find max duration for Y-axis scaling
  const maxDuration = useMemo(() => {
    const durations = visibleLogs
      .map(log => log.duration_minutes || 0)
      .filter(d => d > 0);
    return durations.length > 0 ? Math.max(...durations, 60) : 120;
  }, [visibleLogs]);

  // Generate time labels (every hour)
  const timeLabels = useMemo(() => {
    const labels = [];
    for (let i = 0; i <= 8; i++) {
      const time = startTime + i * 60 * 60 * 1000;
      const date = new Date(time);
      labels.push({
        time,
        label: date.getHours().toString().padStart(2, '0') + ':00',
      });
    }
    return labels;
  }, [startTime]);

  const getBarColor = (logType: string) => {
    switch (logType) {
      case 'sleep':
        return 'bg-blue-500';
      case 'breastfeed':
        return 'bg-green-500';
      case 'bottle':
        return 'bg-teal-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getBarPosition = (logTime: number) => {
    const relativeTime = logTime - startTime;
    const windowDuration = endTime - startTime;
    return (relativeTime / windowDuration) * 100;
  };

  const getBarHeight = (duration: number) => {
    return (duration / maxDuration) * 100;
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Activity Timeline</h3>
        {nappyLogs.length > 0 && (
          <span className="text-sm text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
            {nappyLogs.length} nappy changes
          </span>
        )}
      </div>

      {/* Timeline Container */}
      <div className="relative h-64 bg-gray-900 rounded-lg overflow-hidden">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-gray-500 pr-1">
          <span>{maxDuration}m</span>
          <span>{Math.floor(maxDuration / 2)}m</span>
          <span>0m</span>
        </div>

        {/* Main timeline area */}
        <div className="absolute left-10 right-0 top-0 bottom-8">
          {/* Vertical grid lines (hourly) */}
          {timeLabels.map((label, i) => {
            const pos = (i / 8) * 100;
            const isNow = Math.abs(label.time - now) < 30 * 60 * 1000; // Within 30min
            return (
              <div
                key={i}
                className={`absolute top-0 bottom-0 ${isNow ? 'w-0.5 bg-red-500' : 'w-px bg-gray-700'}`}
                style={{ left: `${pos}%` }}
              />
            );
          })}

          {/* Activity bars */}
          {visibleLogs.map(log => {
            const logTime = new Date(log.logged_at).getTime();
            const leftPos = getBarPosition(logTime);
            const height = getBarHeight(log.duration_minutes || 0);
            const color = getBarColor(log.log_type);

            return (
              <button
                key={log.id}
                onClick={() => onActivityTap(log)}
                className={`absolute bottom-0 ${color} rounded-t-md transition-all hover:opacity-80 active:scale-95 min-w-[8px] cursor-pointer`}
                style={{
                  left: `${leftPos}%`,
                  height: `${height}%`,
                  width: '12px',
                  transform: 'translateX(-50%)',
                }}
                aria-label={`${log.log_type} activity`}
              />
            );
          })}

          {/* Nappy markers */}
          {nappyLogs.map(log => {
            const logTime = new Date(log.logged_at).getTime();
            const leftPos = getBarPosition(logTime);

            return (
              <button
                key={log.id}
                onClick={() => onActivityTap(log)}
                className="absolute bottom-0 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110 active:scale-95 cursor-pointer"
                style={{
                  left: `${leftPos}%`,
                  transform: 'translateX(-50%) translateY(50%)',
                }}
                aria-label="Nappy change"
              >
                🧷
              </button>
            );
          })}
        </div>

        {/* X-axis time labels */}
        <div className="absolute left-10 right-0 bottom-0 h-8 flex justify-between items-center text-xs text-gray-500">
          {timeLabels.map((label, i) => {
            if (i % 2 === 0) { // Show every 2 hours
              return <span key={i}>{label.label}</span>;
            }
            return null;
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs text-gray-400 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span>Sleep</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span>Breastfeed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-teal-500 rounded" />
          <span>Bottle</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center text-[8px]">🧷</div>
          <span>Nappy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-0.5 h-3 bg-red-500" />
          <span>Now</span>
        </div>
      </div>
    </div>
  );
}
