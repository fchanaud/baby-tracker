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

  // Update "now" every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate current 4-hour block (e.g., if 15:20, show 12:00–16:00)
  const getCurrentBlockStart = (timestamp: number) => {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const blockStart = Math.floor(hour / 4) * 4;
    date.setHours(blockStart, 0, 0, 0);
    return date.getTime();
  };

  // Calculate 4-hour window
  const { startTime, endTime, visibleLogs, nappyLogs } = useMemo(() => {
    const blockStart = getCurrentBlockStart(now);
    const offsetMs = windowOffset * 4 * 60 * 60 * 1000;
    const start = blockStart + offsetMs;
    const end = start + 4 * 60 * 60 * 1000;

    const visible = logs.filter(log => {
      if (log.log_type === 'note') return false;

      const logTime = new Date(log.logged_at).getTime();
      // For sleep activities, check if any part overlaps with window
      if (log.log_type === 'sleep' && log.duration_minutes) {
        const sleepEnd = logTime + log.duration_minutes * 60 * 1000;
        return logTime < end && sleepEnd > start;
      }
      return logTime >= start && logTime < end;
    });

    const nappies = visible.filter(log => log.log_type === 'nappy');
    const timed = visible.filter(log => log.log_type !== 'nappy');

    return {
      startTime: start,
      endTime: end,
      visibleLogs: timed,
      nappyLogs: nappies,
    };
  }, [logs, now, windowOffset]);

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

    // Hide next button if no activities AND window is in the future
    const hasNextActivities = logs.some(log => {
      const logTime = new Date(log.logged_at).getTime();
      return logTime >= nextWindowStart && logTime < nextWindowEnd && log.log_type !== 'note';
    });
    const nextWindowIsFuture = nextWindowStart > now;

    return {
      hasPrevious: hasPrev,
      hasNext: hasNextActivities || !nextWindowIsFuture
    };
  }, [logs, startTime, endTime, now]);

  // Generate hour labels for 4-hour window (5 labels: start, +1h, +2h, +3h, +4h)
  const timeLabels = useMemo(() => {
    const labels = [];
    for (let i = 0; i <= 4; i++) {
      const time = startTime + i * 60 * 60 * 1000;
      const date = new Date(time);
      const hour = date.getHours();
      const ampm = hour >= 12 ? 'pm' : 'am';
      const displayHour = hour % 12 || 12;
      labels.push({
        time,
        label: `${displayHour}${ampm}`,
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
        };
      case 'breastfeed':
        return {
          color: 'bg-green-500',
          hoverColor: 'hover:bg-green-600',
          label: 'Breastfeed',
          icon: '🤱',
        };
      case 'bottle':
        return {
          color: 'bg-teal-500',
          hoverColor: 'hover:bg-teal-600',
          label: 'Bottle',
          icon: '🍼',
        };
      default:
        return {
          color: 'bg-gray-500',
          hoverColor: 'hover:bg-gray-600',
          label: 'Activity',
          icon: '📝',
        };
    }
  };

  // Calculate position and width for activity bars
  const getBarGeometry = (log: Log) => {
    const logTime = new Date(log.logged_at).getTime();
    const windowDuration = endTime - startTime;

    if (log.log_type === 'sleep' && log.duration_minutes) {
      const sleepEnd = logTime + log.duration_minutes * 60 * 1000;
      const visibleStart = Math.max(logTime, startTime);
      const visibleEnd = Math.min(sleepEnd, endTime);

      const leftPos = ((visibleStart - startTime) / windowDuration) * 100;
      const width = ((visibleEnd - visibleStart) / windowDuration) * 100;

      return {
        left: leftPos,
        width: width,
        isClippedLeft: logTime < startTime,
        isClippedRight: sleepEnd > endTime,
      };
    }

    // Non-sleep activities: fixed width, centered on time
    const leftPos = ((logTime - startTime) / windowDuration) * 100;
    return {
      left: leftPos,
      width: 3.5, // Fixed width percentage
      isClippedLeft: false,
      isClippedRight: false,
    };
  };

  // Detect and resolve overlapping bars
  const getPositionedLogs = useMemo(() => {
    const positioned: Array<{
      log: Log;
      geometry: ReturnType<typeof getBarGeometry>;
      lane: number;
    }> = [];

    // Sort by time
    const sortedLogs = [...visibleLogs].sort((a, b) =>
      new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
    );

    sortedLogs.forEach(log => {
      const geometry = getBarGeometry(log);
      let lane = 0;

      // Find non-overlapping lane
      while (true) {
        const overlaps = positioned.some(p => {
          if (p.lane !== lane) return false;
          const thisStart = geometry.left;
          const thisEnd = geometry.left + geometry.width;
          const otherStart = p.geometry.left;
          const otherEnd = p.geometry.left + p.geometry.width;
          return !(thisEnd <= otherStart || thisStart >= otherEnd);
        });

        if (!overlaps) break;
        lane++;
      }

      positioned.push({ log, geometry, lane });
    });

    return positioned;
  }, [visibleLogs, startTime, endTime]);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        {hasPrevious ? (
          <button
            onClick={() => setWindowOffset(windowOffset - 1)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl transition-colors min-h-[48px] flex items-center gap-2 font-medium"
          >
            ← 4h
          </button>
        ) : (
          <div className="w-16" />
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
            onClick={() => setWindowOffset(windowOffset + 1)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl transition-colors min-h-[48px] flex items-center gap-2 font-medium"
          >
            4h →
          </button>
        ) : (
          <div className="w-16" />
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

      {/* Timeline Container */}
      <div className="relative h-[400px] bg-gray-900 rounded-xl overflow-hidden">
        {/* Main timeline area */}
        <div className="absolute inset-4 bottom-16">
          {/* Vertical grid lines at each hour */}
          {timeLabels.map((label, i) => {
            const pos = (i / 4) * 100;
            return (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-gray-700"
                style={{ left: `${pos}%` }}
              />
            );
          })}

          {/* Activity bars */}
          {getPositionedLogs.map(({ log, geometry, lane }) => {
            const details = getActivityDetails(log);
            const isSleep = log.log_type === 'sleep';

            return (
              <div
                key={log.id}
                className="absolute group"
                style={{
                  left: `${geometry.left}%`,
                  width: isSleep ? `${geometry.width}%` : '56px',
                  bottom: `${lane * 80 + 10}px`,
                  height: '70px',
                }}
              >
                <button
                  onClick={() => onActivityTap(log)}
                  className={`w-full h-full ${details.color} ${details.hoverColor} rounded-lg transition-all active:scale-95 cursor-pointer shadow-lg border-2 border-gray-900 flex items-center justify-center relative overflow-hidden`}
                >
                  {/* Clipping indicators for sleep */}
                  {geometry.isClippedLeft && (
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-white/40 to-transparent" />
                  )}
                  {geometry.isClippedRight && (
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-white/40 to-transparent" />
                  )}

                  <span className="text-3xl">{details.icon}</span>

                  {/* Tooltip on hover */}
                  <div className="invisible group-hover:visible absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-30 shadow-xl border border-gray-700">
                    <div className="font-bold">{details.label}</div>
                    {log.duration_minutes && (
                      <div className="text-gray-300">{log.duration_minutes}min</div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* X-axis hour labels */}
        <div className="absolute left-4 right-4 bottom-4 h-12 flex justify-between items-center text-sm text-gray-400 font-medium">
          {timeLabels.map((label, i) => (
            <span key={i} className="text-center">{label.label}</span>
          ))}
        </div>

        {/* Empty state */}
        {visibleLogs.length === 0 && nappyLogs.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-lg">No activities in this window</p>
              <p className="text-sm mt-1">Navigate to see other time periods</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-300">
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
      </div>
    </div>
  );
}
