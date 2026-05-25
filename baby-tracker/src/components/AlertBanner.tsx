'use client';

import { useState } from 'react';
import type { Alert } from '@/lib/types';

interface AlertBannerProps {
  alert: Alert | null;
  dismissed?: boolean;
  onDismiss?: () => void;
}

export default function AlertBanner({ alert, dismissed = false, onDismiss }: AlertBannerProps) {
  if (!alert || dismissed) return null;

  const icon = alert.severity === 'warning' ? '⚠️' : 'ℹ️';

  return (
    <div className="bg-amber-100 border border-amber-300 rounded-xl p-4 flex items-center gap-3">
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <p className="text-amber-900 font-semibold flex-1">{alert.message}</p>
      <button
        onClick={onDismiss}
        className="text-amber-700 hover:text-amber-900 font-bold text-xl flex-shrink-0 min-h-[48px] min-w-[48px] flex items-center justify-center"
        aria-label="Dismiss alert"
      >
        ×
      </button>
    </div>
  );
}
