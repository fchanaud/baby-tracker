'use client';

import { useState } from 'react';
import type { Log } from '@/lib/types';

interface VisualTimelineProps {
  logs: Log[];
}

export default function VisualTimeline({ logs }: VisualTimelineProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  // Get logs for selected date
  const dayStart = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(23, 59, 59, 999);

  const dayLogs = logs.filter(log => {
    const logTime = new Date(log.logged_at);
    return logTime >= dayStart && logTime <= dayEnd;
  });

  const goToPreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousDay}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
        >
          ← Prev
        </button>

        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </h3>
          {!isToday && (
            <button
              onClick={goToToday}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Go to Today
            </button>
          )}
        </div>

        <button
          onClick={goToNextDay}
          disabled={isToday}
          className={`px-3 py-2 rounded-lg text-sm font-medium ${
            isToday
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Next →
        </button>
      </div>

      {/* Timeline Visualization */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {/* 24-hour grid with activity blocks */}
        <div className="relative" style={{ height: '400px' }}>
          {/* Time labels (x-axis) */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gray-50 border-b border-gray-300 flex">
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className="flex-1 text-xs text-center text-gray-600 border-r border-gray-200 py-1"
                style={{ minWidth: '40px' }}
              >
                {hour.toString().padStart(2, '0')}
              </div>
            ))}
          </div>

          {/* Grid lines */}
          <div className="absolute top-8 left-0 right-0 bottom-0">
            <div className="relative h-full flex">
              {Array.from({ length: 24 }, (_, hour) => (
                <div
                  key={hour}
                  className="flex-1 border-r border-gray-200"
                  style={{ minWidth: '40px' }}
                />
              ))}
            </div>

            {/* Activity blocks */}
            <div className="absolute inset-0">
              {dayLogs.map(log => (
                <ActivityBlock
                  key={log.id}
                  log={log}
                  dayStart={dayStart}
                  selected={selectedLog?.id === log.id}
                  onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                />
              ))}
            </div>
          </div>
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
          <div className="w-4 h-4 bg-purple-400 rounded"></div>
          <span>Weight</span>
        </div>
      </div>

      {/* Selected Log Details */}
      {selectedLog && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold mb-2">Activity Details</h4>
          <div className="text-sm space-y-1">
            <p><strong>Type:</strong> {selectedLog.log_type}</p>
            <p><strong>Time:</strong> {new Date(selectedLog.logged_at).toLocaleTimeString()}</p>
            {selectedLog.duration_minutes && (
              <p><strong>Duration:</strong> {selectedLog.duration_minutes} min</p>
            )}
            {selectedLog.side && (
              <p><strong>Side:</strong> {selectedLog.side}</p>
            )}
            {selectedLog.amount_ml && (
              <p><strong>Amount:</strong> {selectedLog.amount_ml} ml</p>
            )}
            {selectedLog.nappy_type && (
              <p><strong>Nappy:</strong> {selectedLog.nappy_type}</p>
            )}
            {selectedLog.note && (
              <p><strong>Note:</strong> {selectedLog.note}</p>
            )}
            <p><strong>Logged by:</strong> {selectedLog.logged_by}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityBlock({
  log,
  dayStart,
  selected,
  onClick
}: {
  log: Log;
  dayStart: Date;
  selected: boolean;
  onClick: () => void;
}) {
  const logTime = new Date(log.logged_at);

  // Calculate position on x-axis (0-24 hours)
  const hourOfDay = logTime.getHours() + logTime.getMinutes() / 60;
  const leftPercent = (hourOfDay / 24) * 100;

  // Calculate width based on duration
  const durationMinutes = log.duration_minutes || 0;
  const durationHours = durationMinutes / 60;
  const widthPercent = (durationHours / 24) * 100;

  // Calculate height based on duration (taller = longer duration)
  const maxHeight = 320; // pixels (400 - 80 for header)
  const heightPixels = Math.max(
    30,
    Math.min(maxHeight, (durationMinutes / 180) * maxHeight) // 180 min = max height
  );

  // Get color based on log type
  const getColor = () => {
    if (log.log_type === 'breastfeed' || log.log_type === 'bottle') return 'bg-green-400 hover:bg-green-500';
    if (log.log_type === 'sleep') return 'bg-blue-400 hover:bg-blue-500';
    if (log.log_type === 'nappy') return 'bg-gray-400 hover:bg-gray-500';
    if (log.log_type === 'weight') return 'bg-purple-400 hover:bg-purple-500';
    return 'bg-yellow-400 hover:bg-yellow-500';
  };

  const getIcon = () => {
    if (log.log_type === 'breastfeed') return '🤱';
    if (log.log_type === 'bottle') return '🍼';
    if (log.log_type === 'sleep') return '😴';
    if (log.log_type === 'nappy') return '💩';
    if (log.log_type === 'weight') return '⚖️';
    return '📝';
  };

  // If no duration, show as a point/marker
  const isPoint = !log.duration_minutes || log.duration_minutes === 0;

  if (isPoint) {
    return (
      <button
        onClick={onClick}
        className={`absolute cursor-pointer transition-all ${getColor()} ${
          selected ? 'ring-4 ring-blue-500 z-10' : ''
        }`}
        style={{
          left: `${leftPercent}%`,
          bottom: '10px',
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px'
        }}
        title={`${log.log_type} at ${logTime.toLocaleTimeString()}`}
      >
        {getIcon()}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`absolute cursor-pointer transition-all rounded ${getColor()} ${
        selected ? 'ring-4 ring-blue-500 z-10' : ''
      }`}
      style={{
        left: `${leftPercent}%`,
        bottom: '10px',
        width: `${Math.max(widthPercent, 2)}%`,
        height: `${heightPixels}px`,
        minWidth: '30px'
      }}
      title={`${log.log_type} - ${durationMinutes}min at ${logTime.toLocaleTimeString()}`}
    >
      <div className="flex items-center justify-center h-full text-white font-semibold text-xs">
        <span className="mr-1">{getIcon()}</span>
        <span>{durationMinutes}m</span>
      </div>
    </button>
  );
}
