'use client';

import { generateXAxisLabels, generateYAxisLabels } from '@/lib/timeline-utils';

interface TimelineAxisProps {
  maxDuration: number;
}

export default function TimelineAxis({ maxDuration }: TimelineAxisProps) {
  const yLabels = generateYAxisLabels(maxDuration);
  const xLabels = generateXAxisLabels(3); // Every 3 hours

  return (
    <>
      {/* Y-axis labels and grid lines */}
      <div className="absolute left-0 top-0 h-full w-12 flex flex-col justify-between pointer-events-none">
        {yLabels.reverse().map((label) => (
          <div key={label} className="relative">
            <span className="absolute right-2 text-xs text-gray-500 -translate-y-1/2">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Horizontal grid lines */}
      <div className="absolute left-12 right-0 top-0 h-full pointer-events-none">
        {yLabels.map((label) => {
          const position = (label / maxDuration) * 100;
          return (
            <div
              key={`grid-${label}`}
              className="absolute w-full border-t border-gray-200"
              style={{
                bottom: `${position}%`,
                opacity: 0.3,
              }}
            />
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-12 right-0 h-8 flex justify-between items-center pointer-events-none">
        {xLabels.map((label) => (
          <span key={label} className="text-xs text-gray-500">
            {label}
          </span>
        ))}
      </div>

      {/* Axis titles */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-gray-500 font-medium origin-center pointer-events-none whitespace-nowrap">
        Duration (min)
      </div>
      <div className="absolute bottom-0 right-0 text-xs text-gray-500 font-medium pointer-events-none whitespace-nowrap mr-2 mb-1">
        Time of day
      </div>
    </>
  );
}
