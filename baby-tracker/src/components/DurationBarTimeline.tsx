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
      <div className="relative bg-white rounded-lg p-3 shadow-md">
        {/* Chart area with axes */}
        <div className="relative" style={{ height: '300px', paddingLeft: '40px', paddingBottom: '24px' }}>
          {/* Axes and grid */}
          <TimelineAxis maxDuration={maxDuration} />

          {/* Bars */}
          <div className="absolute left-10 right-0 bottom-6 top-0">
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No activities for this day
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
