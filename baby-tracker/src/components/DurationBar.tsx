'use client';

import { getActivityColor } from '@/lib/colors';
import { getBarHeight, getBarPosition, formatDuration, formatTime } from '@/lib/timeline-utils';
import { Log } from '@/lib/types';

interface DurationBarProps {
  log: Log;
  maxDuration: number;
  onBarClick: (log: Log) => void;
  onLongPress?: (log: Log) => void;
}

export default function DurationBar({ log, maxDuration, onBarClick, onLongPress }: DurationBarProps) {
  const { accent } = getActivityColor(log.log_type);
  const position = getBarPosition(log.logged_at);

  // Nappies: show as markers instead of bars
  const isNappy = log.log_type === 'nappy';

  if (isNappy) {
    return (
      <div
        className="absolute bottom-0 pointer-events-none"
        style={{
          left: `${position}%`,
          transform: 'translateX(-50%)',
        }}
      >
        <div
          className="w-3 h-3 rounded-full shadow-md"
          style={{ backgroundColor: accent }}
          title={`${log.nappy_type} nappy at ${formatTime(log.logged_at)}`}
        />
      </div>
    );
  }

  // Duration-based activities: show as bars (non-clickable)
  const height = getBarHeight(log.duration_minutes ?? null, maxDuration);

  return (
    <div
      className="absolute bottom-0 pointer-events-none"
      style={{
        left: `${position}%`,
        height: `${height}%`,
        width: '10px',
        transform: 'translateX(-5px)', // Center bar on position
      }}
      title={`${log.log_type} - ${formatDuration(log.duration_minutes ?? null)} at ${formatTime(log.logged_at)}`}
    >
      <div
        className="w-full h-full rounded-t shadow-sm"
        style={{ backgroundColor: accent }}
      />
    </div>
  );
}
