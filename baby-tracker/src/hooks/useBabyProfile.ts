'use client';

import { useState, useEffect } from 'react';

const PROFILE_KEY = 'baby-tracker-profile';

export interface BabyProfile {
  name?: string;
  sex?: 'male' | 'female';
  dateOfBirth?: string; // ISO date string
  currentWeight?: number; // in kg
}

export function useBabyProfile() {
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored) {
        try {
          setProfile(JSON.parse(stored));
        } catch (error) {
          console.error('Failed to parse baby profile:', error);
        }
      }
      setIsLoading(false);
    }
  }, []);

  const saveProfile = (newProfile: BabyProfile) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
      setProfile(newProfile);
    }
  };

  return { profile, saveProfile, isLoading };
}
