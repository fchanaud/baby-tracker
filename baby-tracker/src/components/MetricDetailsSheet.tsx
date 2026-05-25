'use client';

import { useEffect, useMemo } from 'react';
import type { Log } from '@/lib/types';

interface MetricDetailsSheetProps {
  title: string;
  logs: Log[];
  onClose: () => void;
}

export default function MetricDetailsSheet({ title, logs, onClose }: MetricDetailsSheetProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Sort logs by logged_at descending
  const sortedLogs = useMemo(() =>
    [...logs].sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()),
    [logs]
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-800 rounded-t-3xl shadow-xl max-h-[70vh] overflow-y-auto pb-safe animate-slide-up">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-600 rounded-full" />
        </div>

        <div className="px-6 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-100">{title}</h3>
              <p className="text-sm text-gray-400">{logs.length} {logs.length === 1 ? 'entry' : 'entries'}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 text-2xl min-h-[48px] min-w-[48px] flex items-center justify-center"
            >
              ×
            </button>
          </div>

          {/* Log Entries */}
          {sortedLogs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No entries yet today</p>
          ) : (
            <div className="space-y-2">
              {sortedLogs.map(log => (
                <LogEntry key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function LogEntry({ log }: { log: Log }) {
  const loggedAt = new Date(log.logged_at);
  const now = Date.now();
  const diffMs = now - loggedAt.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  let timeAgo = '';
  if (diffMins < 1) {
    timeAgo = 'just now';
  } else if (diffMins < 60) {
    timeAgo = `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    timeAgo = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else {
    const days = Math.floor(diffHours / 24);
    timeAgo = `${days} day${days === 1 ? '' : 's'} ago`;
  }

  let emoji = '📝';
  let activityType = '';
  let detail = '';

  switch (log.log_type) {
    case 'breastfeed':
      emoji = '🤱';
      activityType = 'Breastfeed';
      detail = `${log.side} • ${log.duration_minutes}min`;
      break;
    case 'bottle':
      emoji = '🍼';
      activityType = 'Bottle';
      detail = `${log.amount_ml}ml`;
      break;
    case 'sleep':
      emoji = '😴';
      activityType = 'Sleep';
      const hours = Math.floor((log.duration_minutes || 0) / 60);
      const mins = (log.duration_minutes || 0) % 60;
      detail = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      break;
    case 'nappy':
      emoji = '🧷';
      activityType = 'Nappy';
      detail = (log.nappy_type || '').charAt(0).toUpperCase() + (log.nappy_type || '').slice(1);
      break;
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
      <span className="text-2xl flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-100">{activityType}</p>
        <p className="text-sm text-gray-400 truncate">{detail}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm text-gray-200 font-medium">{log.logged_by}</p>
        <p className="text-xs text-gray-400">{timeAgo}</p>
      </div>
    </div>
  );
}
