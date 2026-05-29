'use client';

import { useEffect, useState } from 'react';
import { Identity } from '@/hooks/useIdentity';

interface EnvironmentToggleProps {
  identity: Identity;
}

export default function EnvironmentToggle({ identity }: EnvironmentToggleProps) {
  const [environment, setEnvironment] = useState<'production' | 'test'>('production');
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('baby-tracker-environment') as 'production' | 'test' | null;
    if (stored) {
      setEnvironment(stored);
    }
  }, []);

  // Only show for Franklin
  if (identity !== 'Franklin') {
    return null;
  }

  const toggleEnvironment = () => {
    const newEnv = environment === 'production' ? 'test' : 'production';
    setEnvironment(newEnv);
    localStorage.setItem('baby-tracker-environment', newEnv);
    window.location.reload();
  };

  const handleDeleteTap = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setDeleting(true);
    setConfirmDelete(false);
    fetch('/api/logs', { method: 'DELETE' })
      .then(() => window.location.reload())
      .catch(() => setDeleting(false));
  };

  return (
    <div className="flex items-center gap-2">
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

      {environment === 'test' && (
        <button
          onClick={handleDeleteTap}
          disabled={deleting}
          className={`${
            confirmDelete ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
          } text-white px-3 py-2 rounded-full text-xs font-bold shadow-lg transition-colors min-h-[40px] flex items-center gap-1`}
        >
          {deleting ? '...' : confirmDelete ? 'Confirm?' : '🗑'}
        </button>
      )}
    </div>
  );
}
