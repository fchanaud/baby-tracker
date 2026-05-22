'use client';

import { useState } from 'react';
import type { Log } from '@/lib/types';

interface TimelineLanesProps {
  logs: Log[];
}

type ActivityFilter = 'feed' | 'sleep' | 'nappy' | 'all';

export default function TimelineLanes({ logs }: TimelineLanesProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filter, setFilter] = useState<ActivityFilter>('all');
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

  // Filter logs by activity type
  const filteredLogs = filter === 'all'
    ? dayLogs
    : dayLogs.filter(log => {
        if (filter === 'feed') return log.log_type === 'breastfeed' || log.log_type === 'bottle';
        return log.log_type === filter;
      });

  // Group logs by type for lanes
  const feedLogs = filteredLogs.filter(l => l.log_type === 'breastfeed' || l.log_type === 'bottle');
  const sleepLogs = filteredLogs.filter(l => l.log_type === 'sleep');
  const nappyLogs = filteredLogs.filter(l => l.log_type === 'nappy');

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

      {/* Activity Filter Buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="All"
          color="bg-gray-100"
          activeColor="bg-gray-800 text-white"
        />
        <FilterButton
          active={filter === 'feed'}
          onClick={() => setFilter('feed')}
          label="🤱 Feed"
          color="bg-green-100"
          activeColor="bg-green-500 text-white"
        />
        <FilterButton
          active={filter === 'sleep'}
          onClick={() => setFilter('sleep')}
          label="😴 Sleep"
          color="bg-blue-100"
          activeColor="bg-blue-500 text-white"
        />
        <FilterButton
          active={filter === 'nappy'}
          onClick={() => setFilter('nappy')}
          label="💩 Nappy"
          color="bg-gray-100"
          activeColor="bg-gray-500 text-white"
        />
      </div>

      {/* Timeline with Lanes */}
      <div className="border border-gray-300 rounded-lg overflow-x-auto">
        <div style={{ minWidth: '960px' }}>
          {/* Time labels (x-axis) */}
          <div className="flex bg-gray-50 border-b border-gray-300">
            <div className="w-24 flex-shrink-0 border-r border-gray-300"></div>
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className="flex-1 text-xs text-center text-gray-600 border-r border-gray-200 py-2"
                style={{ minWidth: '35px' }}
              >
                {hour.toString().padStart(2, '0')}
              </div>
            ))}
          </div>

          {/* Feed Lane */}
          {(filter === 'all' || filter === 'feed') && (
            <Lane
              label="🤱 Feed"
              logs={feedLogs}
              color="bg-green-400"
              dayStart={dayStart}
              selectedLog={selectedLog}
              onSelectLog={setSelectedLog}
            />
          )}

          {/* Sleep Lane */}
          {(filter === 'all' || filter === 'sleep') && (
            <Lane
              label="😴 Sleep"
              logs={sleepLogs}
              color="bg-blue-400"
              dayStart={dayStart}
              selectedLog={selectedLog}
              onSelectLog={setSelectedLog}
            />
          )}

          {/* Nappy Lane */}
          {(filter === 'all' || filter === 'nappy') && (
            <Lane
              label="💩 Nappy"
              logs={nappyLogs}
              color="bg-gray-400"
              dayStart={dayStart}
              selectedLog={selectedLog}
              onSelectLog={setSelectedLog}
            />
          )}
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

function FilterButton({
  active,
  onClick,
  label,
  color,
  activeColor
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color: string;
  activeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active ? activeColor : `${color} hover:opacity-80`
      }`}
    >
      {label}
    </button>
  );
}

function Lane({
  label,
  logs,
  color,
  dayStart,
  selectedLog,
  onSelectLog
}: {
  label: string;
  logs: Log[];
  color: string;
  dayStart: Date;
  selectedLog: Log | null;
  onSelectLog: (log: Log | null) => void;
}) {
  return (
    <div className="flex border-b border-gray-200">
      {/* Lane Label */}
      <div className="w-24 flex-shrink-0 border-r border-gray-300 py-3 px-2 text-sm font-medium text-gray-700 flex items-center justify-center bg-gray-50">
        {label}
      </div>

      {/* Timeline Grid */}
      <div className="flex-1 relative" style={{ height: '60px' }}>
        {/* Grid lines */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={hour}
              className="flex-1 border-r border-gray-200"
              style={{ minWidth: '35px' }}
            />
          ))}
        </div>

        {/* Activity blocks */}
        <div className="absolute inset-0">
          {logs.map(log => (
            <ActivityBlock
              key={log.id}
              log={log}
              color={color}
              dayStart={dayStart}
              selected={selectedLog?.id === log.id}
              onClick={() => onSelectLog(selectedLog?.id === log.id ? null : log)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityBlock({
  log,
  color,
  dayStart,
  selected,
  onClick
}: {
  log: Log;
  color: string;
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

  // If no duration, show as a point/marker
  const isPoint = !log.duration_minutes || log.duration_minutes === 0;

  const getIcon = () => {
    if (log.log_type === 'breastfeed') return '🤱';
    if (log.log_type === 'bottle') return '🍼';
    if (log.log_type === 'sleep') return '😴';
    if (log.log_type === 'nappy') return '💩';
    return '📝';
  };

  if (isPoint) {
    return (
      <button
        onClick={onClick}
        className={`absolute cursor-pointer transition-all ${color} hover:opacity-80 ${
          selected ? 'ring-4 ring-blue-500 z-10' : ''
        }`}
        style={{
          left: `${leftPercent}%`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px'
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
      className={`absolute cursor-pointer transition-all rounded ${color} hover:opacity-80 ${
        selected ? 'ring-4 ring-blue-500 z-10' : ''
      }`}
      style={{
        left: `${leftPercent}%`,
        top: '10px',
        width: `${Math.max(widthPercent, 1.5)}%`,
        height: '40px',
        minWidth: '32px'
      }}
      title={`${log.log_type} - ${durationMinutes}min at ${logTime.toLocaleTimeString()}`}
    >
      <div className="flex items-center justify-center h-full text-white font-semibold text-xs">
        <span className="mr-1">{getIcon()}</span>
        {durationMinutes > 0 && <span>{durationMinutes}m</span>}
      </div>
    </button>
  );
}
