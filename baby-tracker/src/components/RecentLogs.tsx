'use client';

import type { Log } from '@/lib/types';

interface RecentLogsProps {
  logs: Log[];
}

export default function RecentLogs({ logs }: RecentLogsProps) {
  // Sort by logged_at descending and take first 5
  const recentLogs = logs
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>

      {recentLogs.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No logs yet</p>
      ) : (
        <div className="space-y-3">
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
  const timeStr = loggedAt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  let emoji = '📝';
  let detail = '';

  switch (log.log_type) {
    case 'breastfeed':
      emoji = '🤱';
      detail = `${log.side} • ${log.duration_minutes}min`;
      break;
    case 'bottle':
      emoji = '🍼';
      detail = `${log.amount_ml}ml`;
      break;
    case 'sleep':
      emoji = '😴';
      detail = `${log.duration_minutes}min`;
      break;
    case 'nappy':
      emoji = '💩';
      detail = log.nappy_type || '';
      break;
    case 'note':
      emoji = '📝';
      detail = log.note?.substring(0, 30) || '';
      break;
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <span className="text-2xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 capitalize">{log.log_type}</p>
          {log.needs_review && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
              ⚠️
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 truncate">{detail}</p>
      </div>
      <div className="text-right text-sm">
        <p className="text-gray-900 font-medium">{timeStr}</p>
        <p className="text-gray-500 text-xs">{log.logged_by}</p>
      </div>
    </div>
  );
}
