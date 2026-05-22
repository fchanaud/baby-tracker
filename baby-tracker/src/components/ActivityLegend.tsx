'use client';

import { getActivityColor } from '@/lib/colors';

const ACTIVITY_TYPES = [
  { type: 'breastfeed', label: 'Feed', emoji: '🤱' },
  { type: 'bottle', label: 'Bottle', emoji: '🍼' },
  { type: 'sleep', label: 'Sleep', emoji: '😴' },
  { type: 'nappy', label: 'Nappy', emoji: '💩' },
] as const;

interface ActivityLegendProps {
  activeFilters: string[];
  onFilterToggle: (type: string) => void;
}

export default function ActivityLegend({ activeFilters, onFilterToggle }: ActivityLegendProps) {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      {ACTIVITY_TYPES.map(({ type, label, emoji }) => {
        const isActive = activeFilters.includes(type);
        const { bg, accent } = getActivityColor(type);

        return (
          <button
            key={type}
            onClick={() => onFilterToggle(type)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium
              transition-all active:scale-95
              ${isActive ? 'shadow-md opacity-100' : 'opacity-30'}
            `}
            style={{
              backgroundColor: bg,
              color: accent,
            }}
            aria-label={`${isActive ? 'Hide' : 'Show'} ${label}`}
            aria-pressed={isActive}
          >
            <span className="mr-1">{emoji}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
