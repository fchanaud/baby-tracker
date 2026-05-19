'use client';

import type { Alert } from '@/lib/types';

interface AlertBannerProps {
  alert: Alert | null;
}

export default function AlertBanner({ alert }: AlertBannerProps) {
  if (!alert) return null;

  const bgColor = alert.severity === 'warning' ? 'bg-red-100 border-red-300' : 'bg-yellow-100 border-yellow-300';
  const textColor = alert.severity === 'warning' ? 'text-red-800' : 'text-yellow-800';
  const icon = alert.severity === 'warning' ? '⚠️' : 'ℹ️';

  return (
    <div className={`${bgColor} border rounded-xl p-4 flex items-center gap-3`}>
      <span className="text-2xl">{icon}</span>
      <p className={`${textColor} font-semibold flex-1`}>{alert.message}</p>
    </div>
  );
}
