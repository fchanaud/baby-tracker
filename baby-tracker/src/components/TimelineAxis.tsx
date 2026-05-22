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
      <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between pointer-events-none">
        {yLabels.reverse().map((label) => (
          <div key={label} className="relative h-0">
            <span className="absolute right-2 text-xs font-medium leading-none text-gray-600 -translate-y-1/2">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Horizontal grid lines */}
      <div className="absolute left-12 right-0 top-0 bottom-6 pointer-events-none">
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
      <div className="absolute bottom-0 left-12 right-0 h-6 flex justify-between items-start pointer-events-none">
        {xLabels.map((label) => (
          <span key={label} className="text-xs font-semibold leading-none text-gray-700">
            {label}
          </span>
        ))}
      </div>
    </>
  );
}
