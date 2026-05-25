'use client';

interface ActivityButtonsProps {
  onActivitySelect: (activity: 'feed' | 'sleep' | 'nappy') => void;
}

export default function ActivityButtons({ onActivitySelect }: ActivityButtonsProps) {
  const activities = [
    { id: 'feed' as const, icon: '🍼', label: 'Feed', color: 'bg-pink-500 hover:bg-pink-600' },
    { id: 'sleep' as const, icon: '😴', label: 'Sleep', color: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'nappy' as const, icon: '🧷', label: 'Nappy', color: 'bg-yellow-500 hover:bg-yellow-600' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {activities.map(activity => (
        <button
          key={activity.id}
          onClick={() => onActivitySelect(activity.id)}
          className={`${activity.color} active:scale-95 text-white rounded-2xl p-4 transition-all flex flex-col items-center justify-center gap-2`}
          style={{ minHeight: '96px' }}
        >
          <span className="text-4xl">{activity.icon}</span>
          <span className="text-sm font-semibold">{activity.label}</span>
        </button>
      ))}
    </div>
  );
}
