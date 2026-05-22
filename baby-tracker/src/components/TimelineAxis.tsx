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
      {/* Y-axis labels and grid lines */}
      <div className="absolute left-0 top-0 h-full w-10 flex flex-col justify-between pointer-events-none">
        {yLabels.reverse().map((label) => (
          <div key={label} className="relative h-0">
            <span className="absolute right-1 text-[10px] leading-none text-gray-500 -translate-y-1/2">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Horizontal grid lines */}
      <div className="absolute left-10 right-0 top-0 h-full pointer-events-none">
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
      <div className="absolute bottom-0 left-10 right-0 h-6 flex justify-between items-start pointer-events-none px-1">
        {xLabels.map((label) => (
          <span key={label} className="text-[10px] leading-none text-gray-500">
            {label}
          </span>
        ))}
      </div>

      {/* Y-axis title (mobile optimized) */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-gray-500 font-medium origin-center pointer-events-none whitespace-nowrap">
        Duration (min)
      </div>
      {/* X-axis title (mobile optimized) */}
      <div className="absolute bottom-0 right-1 text-[10px] text-gray-500 font-medium pointer-events-none whitespace-nowrap mb-0.5">
        Time of day
      </div>
    </>
  );
}
