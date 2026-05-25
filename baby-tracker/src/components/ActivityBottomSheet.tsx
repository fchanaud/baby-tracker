'use client';

import { useEffect } from 'react';
import type { Log } from '@/lib/types';

interface ActivityBottomSheetProps {
  log: Log | null;
  onClose: () => void;
}

export default function ActivityBottomSheet({ log, onClose }: ActivityBottomSheetProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (log) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [log, onClose]);

  if (!log) return null;

  const loggedAt = new Date(log.logged_at);
  const createdAt = new Date(log.created_at);
  const timeString = loggedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const dateString = loggedAt.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });

  // Calculate if it was logged in real-time or backdated
  const timeDiffMinutes = Math.abs((createdAt.getTime() - loggedAt.getTime()) / (1000 * 60));
  const wasBackdated = timeDiffMinutes > 5; // More than 5 minutes difference = backdated

  const getLoggingTimeInfo = () => {
    if (wasBackdated) {
      const hoursDiff = Math.round(timeDiffMinutes / 60 * 10) / 10; // Round to 1 decimal
      return {
        label: 'Logged later',
        detail: `${hoursDiff}h after it happened`,
        icon: '⏮️',
        color: 'text-orange-400'
      };
    } else {
      return {
        label: 'Logged in real-time',
        detail: 'As it happened',
        icon: '⏰',
        color: 'text-green-400'
      };
    }
  };

  const loggingInfo = getLoggingTimeInfo();

  const getActivityEmoji = () => {
    switch (log.log_type) {
      case 'breastfeed': return '🤱';
      case 'bottle': return '🍼';
      case 'sleep': return '😴';
      case 'nappy': return '🧷';
      default: return '📝';
    }
  };

  const getActivityTitle = () => {
    switch (log.log_type) {
      case 'breastfeed': return 'Breastfeed';
      case 'bottle': return 'Bottle Feed';
      case 'sleep': return 'Sleep';
      case 'nappy': return 'Nappy Change';
      default: return 'Note';
    }
  };

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
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">{getActivityEmoji()}</span>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-100">{getActivityTitle()}</h3>
              <p className="text-sm text-gray-400">{dateString} at {timeString}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 text-2xl min-h-[48px] min-w-[48px] flex items-center justify-center"
            >
              ×
            </button>
          </div>

          {/* Activity Details */}
          <div className="space-y-4">
            {/* Breastfeed details */}
            {log.log_type === 'breastfeed' && (
              <>
                <div className="bg-gray-700 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-1">Side</p>
                  <p className="text-lg text-gray-100 font-medium capitalize">{log.side}</p>
                </div>
                <div className="bg-gray-700 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-1">Duration</p>
                  <p className="text-lg text-gray-100 font-medium">{log.duration_minutes} minutes</p>
                </div>
              </>
            )}

            {/* Bottle details */}
            {log.log_type === 'bottle' && (
              <div className="bg-gray-700 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">Amount</p>
                <p className="text-lg text-gray-100 font-medium">{log.amount_ml} ml</p>
              </div>
            )}

            {/* Sleep details */}
            {log.log_type === 'sleep' && (
              <div className="bg-gray-700 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">Duration</p>
                <p className="text-lg text-gray-100 font-medium">
                  {Math.floor((log.duration_minutes || 0) / 60)}h {(log.duration_minutes || 0) % 60}m
                </p>
              </div>
            )}

            {/* Nappy details */}
            {log.log_type === 'nappy' && (
              <>
                <div className="bg-gray-700 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-1">Type</p>
                  <p className="text-lg text-gray-100 font-medium capitalize">{log.nappy_type}</p>
                </div>
                {log.poo_consistency && (
                  <div className="bg-gray-700 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">Consistency</p>
                    <p className="text-lg text-gray-100 font-medium capitalize">{log.poo_consistency}</p>
                  </div>
                )}
              </>
            )}

            {/* Logging timing */}
            <div className="bg-gray-700 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">When logged</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{loggingInfo.icon}</span>
                <div>
                  <p className={`text-lg font-medium ${loggingInfo.color}`}>{loggingInfo.label}</p>
                  <p className="text-sm text-gray-400">{loggingInfo.detail}</p>
                </div>
              </div>
            </div>

            {/* Logged by */}
            <div className="bg-gray-700 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Logged by</p>
              <p className="text-lg text-gray-100 font-medium">{log.logged_by}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
