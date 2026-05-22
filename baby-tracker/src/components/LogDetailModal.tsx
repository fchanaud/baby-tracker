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
            <h2 className="text-2xl font-bold capitalize" style={{ color: accent }}>
              {log.log_type.replace('_', ' ')}
            </h2>
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
          {log.log_type === 'bottle' && log.quantity_ml && (
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Quantity</div>
              <div className="text-lg">{log.quantity_ml} ml</div>
            </div>
          )}

          {/* Weight (for weight logs) */}
          {log.log_type === 'weight' && log.weight_kg && (
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Weight</div>
              <div className="text-lg">{log.weight_kg} kg</div>
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
          {log.notes && (
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Notes</div>
              <div className="text-base text-gray-700 bg-gray-50 p-3 rounded-lg">
                {log.notes}
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
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 active:scale-95 transition-all"
          >
            Close
          </button>
          <button
            onClick={() => {
              // TODO: Implement edit functionality
              console.log('Edit log:', log.id);
            }}
            className="flex-1 px-4 py-3 text-white rounded-lg font-medium hover:opacity-90 active:scale-95 transition-all"
            style={{ backgroundColor: accent }}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
