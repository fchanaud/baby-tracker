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
  const height = getBarHeight(log.duration_minutes ?? null, maxDuration);
  const position = getBarPosition(log.logged_at);

  // Long press detection
  let pressTimer: NodeJS.Timeout | null = null;

  const handleTouchStart = () => {
    pressTimer = setTimeout(() => {
      if (onLongPress) {
        // Haptic feedback on supported devices
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        onLongPress(log);
      }
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  const handleClick = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
    }
    onBarClick(log);
  };

  return (
    <div
      className="absolute bottom-0 cursor-pointer transition-all hover:opacity-80 active:scale-95"
      style={{
        left: `${position}%`,
        height: `${height}%`,
        width: '8px',
        transform: 'translateX(-4px)', // Center bar on position
      }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      title={`${log.log_type} - ${formatDuration(log.duration_minutes)} at ${formatTime(log.logged_at)}`}
    >
      <div
        className="w-full h-full rounded-t-md shadow-md"
        style={{ backgroundColor: accent }}
      />
    </div>
  );
}
