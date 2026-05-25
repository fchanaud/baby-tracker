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

  // Check if there are activities in next/previous windows
  const { hasPrevious, hasNext } = useMemo(() => {
    const prevWindowStart = startTime - 4 * 60 * 60 * 1000;
    const prevWindowEnd = startTime;
    const nextWindowStart = endTime;
    const nextWindowEnd = endTime + 4 * 60 * 60 * 1000;

    const hasPrev = logs.some(log => {
      const logTime = new Date(log.logged_at).getTime();
      return logTime >= prevWindowStart && logTime < prevWindowEnd && log.log_type !== 'note';
    });

    const hasNxt = logs.some(log => {
      const logTime = new Date(log.logged_at).getTime();
      return logTime > nextWindowStart && logTime <= nextWindowEnd && log.log_type !== 'note';
    });

    return { hasPrevious: hasPrev, hasNext: hasNxt };
  }, [logs, startTime, endTime]);

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

  const getActivityDetails = (log: Log) => {
    switch (log.log_type) {
      case 'sleep':
        return {
          color: 'bg-blue-500',
          hoverColor: 'hover:bg-blue-600',
          label: 'Sleep',
          icon: '😴',
          detail: `${Math.floor((log.duration_minutes || 0) / 60)}h ${(log.duration_minutes || 0) % 60}m`,
        };
      case 'breastfeed':
        return {
          color: 'bg-green-500',
          hoverColor: 'hover:bg-green-600',
          label: 'Breastfeed',
          icon: '🤱',
          detail: `${log.side} • ${log.duration_minutes}m`,
        };
      case 'bottle':
        return {
          color: 'bg-teal-500',
          hoverColor: 'hover:bg-teal-600',
          label: 'Bottle',
          icon: '🍼',
          detail: `${log.amount_ml}ml`,
        };
      default:
        return {
          color: 'bg-gray-500',
          hoverColor: 'hover:bg-gray-600',
          label: 'Activity',
          icon: '📝',
          detail: '',
        };
    }
  };

  const getBarPosition = (logTime: number) => {
    const relativeTime = logTime - startTime;
    const windowDuration = endTime - startTime;
    return (relativeTime / windowDuration) * 100;
  };

  const getBarHeight = (duration: number) => {
    return Math.max((duration / maxDuration) * 100, 8); // Min 8% height
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        {hasPrevious ? (
          <button
            onClick={() => setWindowOffset(windowOffset - 4)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl transition-colors min-h-[48px] flex items-center gap-2 font-medium"
          >
            ← 4h
          </button>
        ) : (
          <div className="w-20" />
        )}

        <div className="flex flex-col items-center gap-1">
          <h3 className="text-xl font-bold text-gray-100">Activity Timeline</h3>
          {windowOffset !== 0 && (
            <button
              onClick={() => setWindowOffset(0)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Back to now
            </button>
          )}
        </div>

        {hasNext ? (
          <button
            onClick={() => setWindowOffset(windowOffset + 4)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl transition-colors min-h-[48px] flex items-center gap-2 font-medium"
          >
            4h →
          </button>
        ) : (
          <div className="w-20" />
        )}
      </div>

      {/* Nappy Summary - Above Timeline */}
      {nappyLogs.length > 0 && (
        <div className="mb-6 bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🧷</span>
              <div>
                <h4 className="text-lg font-bold text-yellow-200">Nappy Changes</h4>
                <p className="text-sm text-yellow-300/70">{nappyLogs.length} in this window</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {nappyLogs.map(log => {
              const time = new Date(log.logged_at).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
              });
              return (
                <button
                  key={log.id}
                  onClick={() => onActivityTap(log)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm transition-colors active:scale-95 min-h-[48px]"
                >
                  {time} • {log.nappy_type}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline Container - Much Taller */}
      <div className="relative h-[500px] bg-gray-900 rounded-xl overflow-hidden">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-12 w-12 flex flex-col justify-between text-sm text-gray-400 pr-2 font-medium">
          <span>{maxDuration}m</span>
          <span>{Math.floor(maxDuration * 0.75)}m</span>
          <span>{Math.floor(maxDuration * 0.5)}m</span>
          <span>{Math.floor(maxDuration * 0.25)}m</span>
          <span>0m</span>
        </div>

        {/* Main timeline area */}
        <div className="absolute left-14 right-4 top-4 bottom-12">
          {/* Vertical grid lines */}
          {timeLabels.map((label, i) => {
            const pos = (i / 8) * 100;
            const isNow = Math.abs(label.time - now) < 30 * 60 * 1000 && windowOffset === 0;
            return (
              <div
                key={i}
                className={`absolute top-0 bottom-0 ${isNow ? 'w-1 bg-red-500 z-20' : 'w-px bg-gray-700'}`}
                style={{ left: `${pos}%` }}
              >
                {isNow && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded font-bold whitespace-nowrap">
                    NOW
                  </div>
                )}
              </div>
            );
          })}

          {/* Activity bars - Taller, wider, with labels */}
          {visibleLogs.map(log => {
            const logTime = new Date(log.logged_at).getTime();
            const leftPos = getBarPosition(logTime);
            const height = getBarHeight(log.duration_minutes || 0);
            const details = getActivityDetails(log);
            const timeStr = new Date(log.logged_at).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={log.id}
                className="absolute bottom-0 group"
                style={{
                  left: `calc(${leftPos}% - 28px)`, // Center the 56px wide bar
                  height: `${height}%`,
                  minHeight: '60px',
                }}
              >
                <button
                  onClick={() => onActivityTap(log)}
                  className={`w-14 h-full ${details.color} ${details.hoverColor} rounded-t-xl transition-all active:scale-95 cursor-pointer shadow-lg border-2 border-gray-900 flex flex-col items-center justify-between py-2 relative`}
                >
                  {/* Icon at top */}
                  <span className="text-2xl">{details.icon}</span>

                  {/* Duration badge */}
                  {(log.duration_minutes || 0) > 0 && (
                    <span className="text-white font-bold text-xs bg-black/30 px-1 py-0.5 rounded">
                      {log.duration_minutes}m
                    </span>
                  )}

                  {/* Tooltip on hover */}
                  <div className="invisible group-hover:visible absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-30 shadow-xl border border-gray-700">
                    <div className="font-bold">{details.label}</div>
                    <div className="text-gray-300">{timeStr}</div>
                    <div className="text-gray-400">{details.detail}</div>
                  </div>
                </button>

                {/* Time label below bar */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap font-medium">
                  {timeStr}
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis time labels */}
        <div className="absolute left-14 right-4 bottom-0 h-12 flex justify-between items-end text-sm text-gray-400 font-medium pb-2">
          {timeLabels.map((label, i) => {
            if (i % 2 === 0) { // Show every hour
              return <span key={i}>{label.label}</span>;
            }
            return <div key={i} />;
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-6 text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded border-2 border-gray-900" />
          <span className="font-medium">Sleep</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded border-2 border-gray-900" />
          <span className="font-medium">Breastfeed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-teal-500 rounded border-2 border-gray-900" />
          <span className="font-medium">Bottle</span>
        </div>
        {windowOffset === 0 && (
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-red-500" />
            <span className="font-medium">Now</span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {visibleLogs.length === 0 && nappyLogs.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-xl mb-2">No activities in this window</p>
            <p className="text-sm">Try navigating to a different time period</p>
          </div>
        </div>
      )}
    </div>
  );
}
