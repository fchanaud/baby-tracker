'use client';

import { useState, useMemo } from 'react';
import { Log } from '@/lib/types';
import { calculateMaxDuration, isToday } from '@/lib/timeline-utils';
import DurationBar from './DurationBar';
import TimelineAxis from './TimelineAxis';
import DateNavigator from './DateNavigator';
import ActivityLegend from './ActivityLegend';

interface DurationBarTimelineProps {
  logs: Log[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onBarClick: (log: Log) => void;
  onBarLongPress?: (log: Log) => void;
}

export default function DurationBarTimeline({
  logs,
  selectedDate,
  onDateChange,
  onBarClick,
  onBarLongPress,
}: DurationBarTimelineProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([
    'breastfeed',
    'bottle',
    'sleep',
    'nappy',
  ]);

  // Filter logs by active filters
  const filteredLogs = useMemo(() => {
    return logs.filter(log => activeFilters.includes(log.log_type));
  }, [logs, activeFilters]);

  // Calculate max duration for Y-axis
  const maxDuration = useMemo(() => {
    return calculateMaxDuration(filteredLogs);
  }, [filteredLogs]);

  // Toggle filter
  const handleFilterToggle = (type: string) => {
    setActiveFilters(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Can't navigate to future dates
  const canGoNext = !isToday(selectedDate);

  return (
    <div className="space-y-4">
      {/* Date Navigator */}
      <DateNavigator
        currentDate={selectedDate}
        onDateChange={onDateChange}
        canGoNext={canGoNext}
      />

      {/* Chart Container */}
      <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 shadow-lg border border-gray-200">
        {/* Chart Title */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
            <h3 className="text-sm font-bold text-gray-800">Activity Timeline</h3>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-300 rounded" />
              <span>Duration (min)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-0.5 bg-gray-300" />
              <span>Time of day</span>
            </div>
          </div>
        </div>

        {/* Chart area with axes */}
        <div className="relative" style={{ height: '300px', paddingLeft: '48px', paddingBottom: '32px' }}>
          {/* Axes and grid */}
          <TimelineAxis maxDuration={maxDuration} />

          {/* Bars */}
          <div className="absolute left-12 right-0 bottom-8 top-0">
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-4xl mb-2 opacity-20">📊</div>
                  <p className="text-gray-400 text-sm">No activities for this day</p>
                </div>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <DurationBar
                  key={log.id}
                  log={log}
                  maxDuration={maxDuration}
                  onBarClick={onBarClick}
                  onLongPress={onBarLongPress}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Activity Legend / Filters */}
      <ActivityLegend
        activeFilters={activeFilters}
        onFilterToggle={handleFilterToggle}
      />

      {/* Stats Summary */}
      {filteredLogs.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          Showing {filteredLogs.length} {filteredLogs.length === 1 ? 'activity' : 'activities'}
        </div>
      )}
    </div>
  );
}
