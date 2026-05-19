'use client';

import type { Log } from '@/lib/types';

interface TimelineProps {
  logs: Log[];
}

export default function Timeline({ logs }: TimelineProps) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayLogs = logs.filter(log => new Date(log.logged_at) >= todayStart);

  // Create 24 hourly blocks
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 overflow-hidden">
      <h3 className="text-lg font-semibold mb-4">Today's Timeline</h3>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1" style={{ minWidth: '600px' }}>
          {hours.map(hour => (
            <TimelineBlock key={hour} hour={hour} logs={todayLogs} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-400 rounded"></div>
          <span>Feed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-400 rounded"></div>
          <span>Sleep</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span>Nappy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-amber-200 rounded"></div>
          <span>Awake</span>
        </div>
      </div>
    </div>
  );
}

function TimelineBlock({ hour, logs }: { hour: number; logs: Log[] }) {
  const blockStart = new Date();
  blockStart.setHours(hour, 0, 0, 0);
  const blockEnd = new Date(blockStart);
  blockEnd.setHours(hour + 1);

  const logsInBlock = logs.filter(log => {
    const logTime = new Date(log.logged_at);
    return logTime >= blockStart && logTime < blockEnd;
  });

  // Determine color based on log types in this hour
  let bgColor = 'bg-amber-100'; // Default: awake

  if (logsInBlock.some(log => log.log_type === 'sleep')) {
    bgColor = 'bg-blue-400';
  } else if (logsInBlock.some(log => log.log_type === 'breastfeed' || log.log_type === 'bottle')) {
    bgColor = 'bg-green-400';
  } else if (logsInBlock.some(log => log.log_type === 'nappy')) {
    bgColor = 'bg-gray-400';
  }

  const timeLabel = hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`;

  return (
    <div className="flex-1 min-w-0">
      <div className={`${bgColor} h-12 rounded transition-colors`} title={timeLabel}></div>
      <p className="text-xs text-gray-500 text-center mt-1">{timeLabel}</p>
    </div>
  );
}
