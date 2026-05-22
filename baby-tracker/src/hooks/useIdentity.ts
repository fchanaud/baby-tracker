'use client';

import { useState, useEffect } from 'react';

const IDENTITY_KEY = 'baby-tracker-identity';

export type Identity = 'Franklin' | 'Clémence' | null;

export function useIdentity() {
  const [identity, setIdentityState] = useState<Identity>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem(IDENTITY_KEY);
    if (stored === 'Franklin' || stored === 'Clémence') {
      setIdentityState(stored);
    }
    setIsLoading(false);
  }, []);

  const setIdentity = (newIdentity: Identity) => {
    if (newIdentity) {
      localStorage.setItem(IDENTITY_KEY, newIdentity);
    } else {
      localStorage.removeItem(IDENTITY_KEY);
    }
    setIdentityState(newIdentity);
  };

  return { identity, setIdentity, isLoading };
}
