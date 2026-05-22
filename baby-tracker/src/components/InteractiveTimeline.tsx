'use client';

import { useState } from 'react';
import type { Log } from '@/lib/types';

interface InteractiveTimelineProps {
  logs: Log[];
}

type FilterType = 'all' | 'feed' | 'sleep' | 'nappy' | 'awake';

export default function InteractiveTimeline({ logs }: InteractiveTimelineProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  // Get logs for selected date
  const dayStart = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(23, 59, 59, 999);

  let filteredLogs = logs.filter(log => {
    const logTime = new Date(log.logged_at);
    return logTime >= dayStart && logTime <= dayEnd;
  });

  // Apply filter
  if (filter !== 'all') {
    filteredLogs = filteredLogs.filter(log => {
      if (filter === 'feed') return log.log_type === 'breastfeed' || log.log_type === 'bottle';
      if (filter === 'sleep') return log.log_type === 'sleep';
      if (filter === 'nappy') return log.log_type === 'nappy';
      if (filter === 'awake') {
        // Awake is the gaps between sleep
        return false; // We'll handle this differently
      }
      return true;
    });
  }

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

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="All"
          color="bg-gray-200"
        />
        <FilterButton
          active={filter === 'feed'}
          onClick={() => setFilter('feed')}
          label="Feed"
          color="bg-green-400"
        />
        <FilterButton
          active={filter === 'sleep'}
          onClick={() => setFilter('sleep')}
          label="Sleep"
          color="bg-blue-400"
        />
        <FilterButton
          active={filter === 'nappy'}
          onClick={() => setFilter('nappy')}
          label="Nappy"
          color="bg-gray-400"
        />
        <FilterButton
          active={filter === 'awake'}
          onClick={() => setFilter('awake')}
          label="Awake"
          color="bg-amber-200"
        />
      </div>

      {/* Timeline */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No logs for this day
          </div>
        ) : (
          filteredLogs
            .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
            .map(log => (
              <TimelineEntry
                key={log.id}
                log={log}
                selected={selectedLog?.id === log.id}
                onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
              />
            ))
        )}
      </div>

      {/* Selected Log Details */}
      {selectedLog && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold mb-2">Log Details</h4>
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

function FilterButton({
  active,
  onClick,
  label,
  color
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? `${color} text-white shadow-md scale-105`
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

function TimelineEntry({
  log,
  selected,
  onClick
}: {
  log: Log;
  selected: boolean;
  onClick: () => void;
}) {
  const getTypeColor = (type: string) => {
    if (type === 'breastfeed' || type === 'bottle') return 'bg-green-100 border-green-300';
    if (type === 'sleep') return 'bg-blue-100 border-blue-300';
    if (type === 'nappy') return 'bg-gray-100 border-gray-300';
    return 'bg-gray-100 border-gray-300';
  };

  const getTypeIcon = (type: string) => {
    if (type === 'breastfeed') return '🤱';
    if (type === 'bottle') return '🍼';
    if (type === 'sleep') return '😴';
    if (type === 'nappy') return '💩';
    return '📝';
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSummary = (log: Log) => {
    if (log.log_type === 'breastfeed') {
      return `${log.duration_minutes || '?'} min ${log.side || ''}`;
    }
    if (log.log_type === 'bottle') {
      return `${log.amount_ml || '?'} ml`;
    }
    if (log.log_type === 'sleep') {
      return `${log.duration_minutes || '?'} min`;
    }
    if (log.log_type === 'nappy') {
      return log.nappy_type || 'change';
    }
    return log.note || 'note';
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
        getTypeColor(log.log_type)
      } ${
        selected ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{getTypeIcon(log.log_type)}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold capitalize">{log.log_type}</span>
            <span className="text-sm text-gray-600">{formatTime(log.logged_at)}</span>
          </div>
          <div className="text-sm text-gray-700">{getSummary(log)}</div>
        </div>
      </div>
    </button>
  );
}
