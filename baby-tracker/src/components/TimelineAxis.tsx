'use client';

import { generateXAxisLabels, generateYAxisLabels } from '@/lib/timeline-utils';

interface TimelineAxisProps {
  maxDuration: number;
}

export default function TimelineAxis({ maxDuration }: TimelineAxisProps) {
  const yLabels = generateYAxisLabels(maxDuration);
  const xLabels = generateXAxisLabels(6); // Every 6 hours for mobile

  return (
    <>
      {/* Y-axis: Duration labels with background chip */}
      <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between pointer-events-none">
        {yLabels.slice().reverse().map((label, idx) => (
          <div key={`${label}-${idx}`} className="relative h-0">
            <div className="absolute right-2 -translate-y-1/2 bg-white px-1.5 py-0.5 rounded shadow-sm border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-700">
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Horizontal grid lines */}
      <div className="absolute left-12 right-0 top-0 bottom-8 pointer-events-none">
        {yLabels.map((label, idx) => {
          // Parse numeric value from label (remove 'm' suffix)
          const numericValue = parseInt(label.replace('m', '')) || 0;
          const position = (numericValue / maxDuration) * 100;
          return (
            <div
              key={`grid-${label}-${idx}`}
              className="absolute w-full border-t border-dashed border-gray-300"
              style={{
                bottom: `${position}%`,
              }}
            />
          );
        })}
      </div>

      {/* X-axis: Time labels with hint */}
      <div className="absolute bottom-0 left-12 right-0 pointer-events-none">
        {/* Time labels */}
        <div className="flex justify-between items-start h-6 mb-1">
          {xLabels.map((label) => (
            <div key={label} className="bg-white px-1 rounded shadow-sm border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-700">
                {label}
              </span>
            </div>
          ))}
        </div>
        {/* Subtle hint bar */}
        <div className="h-0.5 bg-gradient-to-r from-blue-100 via-yellow-100 to-purple-100 rounded-full opacity-60" />
      </div>
    </>
  );
}
