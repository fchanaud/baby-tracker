'use client';

import { useEffect, useState } from 'react';
import { Identity } from '@/hooks/useIdentity';

interface EnvironmentToggleProps {
  identity: Identity;
}

export default function EnvironmentToggle({ identity }: EnvironmentToggleProps) {
  const [environment, setEnvironment] = useState<'production' | 'test'>('production');

  // Only show for Franklin
  if (identity !== 'Franklin') {
    return null;
  }

  useEffect(() => {
    const stored = localStorage.getItem('baby-tracker-environment') as 'production' | 'test' | null;
    if (stored) {
      setEnvironment(stored);
    }
  }, []);

  const toggleEnvironment = () => {
    const newEnv = environment === 'production' ? 'test' : 'production';
    setEnvironment(newEnv);
    localStorage.setItem('baby-tracker-environment', newEnv);
    // Reload to apply new environment
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <button
        onClick={toggleEnvironment}
        className={`${
          environment === 'production'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-yellow-600 hover:bg-yellow-700'
        } text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg transition-colors min-h-[40px] flex items-center gap-2`}
      >
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        ENV: {environment.toUpperCase()}
      </button>
    </div>
  );
}
