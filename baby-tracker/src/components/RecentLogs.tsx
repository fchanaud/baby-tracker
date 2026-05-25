'use client';

import type { Log } from '@/lib/types';

interface RecentLogsProps {
  logs: Log[];
}

export default function RecentLogs({ logs }: RecentLogsProps) {
  // Sort by logged_at descending and take first 8
  const recentLogs = logs
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
    .slice(0, 8);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-100">Recent Activity</h3>

      {recentLogs.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No activity yet today</p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {recentLogs.map(log => (
            <LogEntry key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
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
    timeAgo = `${diffMins}m ago`;
  } else if (diffHours < 24) {
    timeAgo = `${diffHours}h ago`;
  } else {
    const days = Math.floor(diffHours / 24);
    timeAgo = `${days}d ago`;
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
    case 'note':
      emoji = '📝';
      activityType = 'Note';
      detail = log.note?.substring(0, 30) || '';
      if (log.note && log.note.length > 30) detail += '...';
      break;
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
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
