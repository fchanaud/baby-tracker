'use client';

import { Log } from '@/lib/types';
import { getActivityColor } from '@/lib/colors';
import { formatDuration, formatTime, getRelativeTime } from '@/lib/timeline-utils';

interface LogDetailModalProps {
  log: Log | null;
  onClose: () => void;
}

export default function LogDetailModal({ log, onClose }: LogDetailModalProps) {
  if (!log) return null;

  const { bg, accent } = getActivityColor(log.log_type);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-6 rounded-t-2xl border-b-4"
          style={{
            backgroundColor: bg,
            borderColor: accent,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold capitalize" style={{ color: accent }}>
                {log.log_type.replace('_', ' ')}
              </h2>
              {log.needs_review && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold">
                  ⚠️ Needs Review
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Time */}
          <div>
            <div className="text-sm text-gray-500 font-medium mb-1">Time</div>
            <div className="text-lg">
              {formatTime(log.logged_at)}
              <span className="text-sm text-gray-500 ml-2">
                ({getRelativeTime(log.logged_at)})
              </span>
            </div>
          </div>

          {/* Duration (if applicable) */}
          {log.duration_minutes !== undefined && log.duration_minutes !== null && (
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Duration</div>
              <div className="text-lg">{formatDuration(log.duration_minutes)}</div>
            </div>
          )}

          {/* Side (for breastfeed) */}
          {log.log_type === 'breastfeed' && log.side && (
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Side</div>
              <div className="text-lg capitalize">{log.side}</div>
            </div>
          )}

          {/* Quantity (for bottle) */}
          {log.log_type === 'bottle' && log.amount_ml && (
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Amount</div>
              <div className="text-lg">{log.amount_ml} ml</div>
            </div>
          )}

          {/* Nappy type */}
          {log.log_type === 'nappy' && log.nappy_type && (
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Type</div>
              <div className="text-lg capitalize">{log.nappy_type}</div>
            </div>
          )}

          {/* Notes */}
          {log.note && (
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Notes</div>
              <div className="text-base text-gray-700 bg-gray-50 p-3 rounded-lg">
                {log.note}
              </div>
            </div>
          )}

          {/* Logged by */}
          <div>
            <div className="text-sm text-gray-500 font-medium mb-1">Logged by</div>
            <div className="text-base">{log.logged_by}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 rounded-lg font-medium hover:opacity-90 active:scale-95 transition-all text-white"
            style={{ backgroundColor: accent }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
