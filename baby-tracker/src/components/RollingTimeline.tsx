'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Log } from '@/lib/types';

interface RollingTimelineProps {
  logs: Log[];
  onActivityTap: (log: Log) => void;
}

export default function RollingTimeline({ logs, onActivityTap }: RollingTimelineProps) {
  const [now, setNow] = useState(Date.now());
  const [windowOffset, setWindowOffset] = useState(0); // Hours offset from now

  // Update "now" every minute to shift timeline
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, []);

  // Calculate 4-hour window
  const { startTime, endTime, visibleLogs, nappyLogs } = useMemo(() => {
    const centerTime = now + (windowOffset * 60 * 60 * 1000);
    const start = centerTime - 2 * 60 * 60 * 1000; // 2 hours before center
    const end = centerTime + 2 * 60 * 60 * 1000; // 2 hours after center

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
  }, [logs, now, windowOffset]);

  // Find max duration for Y-axis scaling
  const maxDuration = useMemo(() => {
    const durations = visibleLogs
      .map(log => log.duration_minutes || 0)
      .filter(d => d > 0);
    return durations.length > 0 ? Math.max(...durations, 60) : 120;
  }, [visibleLogs]);

  // Generate time labels (every 30 minutes for 4-hour window)
  const timeLabels = useMemo(() => {
    const labels = [];
    for (let i = 0; i <= 8; i++) {
      const time = startTime + i * 30 * 60 * 1000; // 30-minute intervals
      const date = new Date(time);
      labels.push({
        time,
        label: date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0'),
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
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWindowOffset(windowOffset - 4)}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors min-h-[48px] flex items-center gap-2"
        >
          ← Prev 4h
        </button>

        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold text-gray-100">Activity Timeline</h3>
          {windowOffset !== 0 && (
            <button
              onClick={() => setWindowOffset(0)}
              className="text-xs text-blue-400 hover:text-blue-300 mt-1"
            >
              Return to now
            </button>
          )}
        </div>

        <button
          onClick={() => setWindowOffset(windowOffset + 4)}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors min-h-[48px] flex items-center gap-2"
        >
          Next 4h →
        </button>
      </div>

      {/* Timeline Container */}
      <div className="relative h-72 bg-gray-900 rounded-lg overflow-hidden">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-16 w-8 flex flex-col justify-between text-xs text-gray-500 pr-1">
          <span>{maxDuration}m</span>
          <span>{Math.floor(maxDuration / 2)}m</span>
          <span>0m</span>
        </div>

        {/* Main timeline area */}
        <div className="absolute left-10 right-0 top-0 bottom-16">
          {/* Vertical grid lines (every 30 min) */}
          {timeLabels.map((label, i) => {
            const pos = (i / 8) * 100;
            const isNow = Math.abs(label.time - now) < 30 * 60 * 1000 && windowOffset === 0;
            return (
              <div
                key={i}
                className={`absolute top-0 bottom-0 ${isNow ? 'w-0.5 bg-red-500 z-10' : 'w-px bg-gray-700'}`}
                style={{ left: `${pos}%` }}
              />
            );
          })}

          {/* Activity bars - wider and easier to tap */}
          {visibleLogs.map(log => {
            const logTime = new Date(log.logged_at).getTime();
            const leftPos = getBarPosition(logTime);
            const height = getBarHeight(log.duration_minutes || 0);
            const color = getBarColor(log.log_type);

            return (
              <button
                key={log.id}
                onClick={() => onActivityTap(log)}
                className={`absolute bottom-0 ${color} rounded-t-lg transition-all hover:opacity-80 active:scale-95 cursor-pointer shadow-md`}
                style={{
                  left: `calc(${leftPos}% - 18px)`, // Center the bar
                  height: `${height}%`,
                  width: '36px', // Much wider for easy tapping
                  minHeight: '20px',
                }}
                aria-label={`${log.log_type} activity`}
              />
            );
          })}
        </div>

        {/* X-axis time labels */}
        <div className="absolute left-10 right-0 bottom-8 h-8 flex justify-between items-center text-xs text-gray-500">
          {timeLabels.map((label, i) => {
            if (i % 2 === 0) { // Show every hour
              return <span key={i} className="text-[10px]">{label.label}</span>;
            }
            return null;
          })}
        </div>

        {/* Nappy markers - below X-axis with exact times */}
        <div className="absolute left-10 right-0 bottom-0 h-8 relative">
          {nappyLogs.map(log => {
            const logTime = new Date(log.logged_at).getTime();
            const leftPos = getBarPosition(logTime);
            const timeString = new Date(log.logged_at).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={log.id}
                className="absolute"
                style={{
                  left: `${leftPos}%`,
                  transform: 'translateX(-50%)',
                  bottom: 0,
                }}
              >
                <button
                  onClick={() => onActivityTap(log)}
                  className="flex flex-col items-center gap-1 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                >
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-base shadow-md">
                    🧷
                  </div>
                  <span className="text-[9px] text-gray-400 whitespace-nowrap">{timeString}</span>
                </button>
              </div>
            );
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
          <span>Nappy (with time)</span>
        </div>
        {windowOffset === 0 && (
          <div className="flex items-center gap-1">
            <div className="w-0.5 h-3 bg-red-500" />
            <span>Now</span>
          </div>
        )}
      </div>
    </div>
  );
}
