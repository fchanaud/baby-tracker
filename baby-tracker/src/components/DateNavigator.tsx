'use client';

import { formatDate, isToday } from '@/lib/timeline-utils';

interface DateNavigatorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  canGoNext?: boolean;
}

export default function DateNavigator({ currentDate, onDateChange, canGoNext = true }: DateNavigatorProps) {
  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    if (!canGoNext) return;
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const dateLabel = formatDate(currentDate);
  const isTodaySelected = isToday(currentDate);

  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 shadow-sm">
      {/* Previous day button */}
      <button
        onClick={handlePrevDay}
        className="p-2 rounded-md hover:bg-gray-100 active:scale-95 transition-all min-h-12 min-w-12"
        aria-label="Previous day"
      >
        <span className="text-2xl">◀</span>
      </button>

      {/* Date label */}
      <button
        onClick={isTodaySelected ? undefined : handleToday}
        className={`
          text-lg font-semibold px-4 py-2 rounded-md transition-all
          ${isTodaySelected ? 'text-gray-900 cursor-default' : 'text-gray-700 hover:bg-gray-100 cursor-pointer'}
        `}
        aria-label={isTodaySelected ? 'Today selected' : 'Jump to today'}
      >
        {dateLabel}
      </button>

      {/* Next day button */}
      <button
        onClick={handleNextDay}
        disabled={!canGoNext}
        className={`
          p-2 rounded-md transition-all min-h-12 min-w-12
          ${canGoNext ? 'hover:bg-gray-100 active:scale-95' : 'opacity-30 cursor-not-allowed'}
        `}
        aria-label="Next day"
      >
        <span className="text-2xl">▶</span>
      </button>
    </div>
  );
}
