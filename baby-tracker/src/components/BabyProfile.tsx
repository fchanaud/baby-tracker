'use client';

import { useState, useEffect, useMemo } from 'react';
import { useIdentity } from '@/hooks/useIdentity';
import { useBabyProfile } from '@/hooks/useBabyProfile';
import IdentityPicker from './IdentityPicker';
import Navbar from './Navbar';

export default function BabyProfile() {
  const { identity, setIdentity, isLoading: identityLoading } = useIdentity();
  const { profile, saveProfile } = useBabyProfile();
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load existing profile
  useEffect(() => {
    if (profile?.dateOfBirth) {
      setDateOfBirth(profile.dateOfBirth);
    }
  }, [profile]);

  // Calculate age in days and months
  const age = useMemo(() => {
    if (!dateOfBirth) return null;

    const dob = new Date(dateOfBirth);
    const now = new Date();
    const diffMs = now.getTime() - dob.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // More accurate months calculation
    const years = now.getFullYear() - dob.getFullYear();
    const months = now.getMonth() - dob.getMonth();
    const totalMonths = years * 12 + months;

    return { days: diffDays, months: totalMonths };
  }, [dateOfBirth]);

  const handleSave = async () => {
    if (!dateOfBirth) {
      setSaveMessage('Please enter a date of birth');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      await saveProfile({
        name: 'Victoire', // Fixed name
        dateOfBirth,
      });
      setSaveMessage('✓ Profile saved');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Show identity picker if not set
  if (identityLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-4xl mb-4">👶</div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <IdentityPicker onSelect={setIdentity} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 pb-20">
      <Navbar identity={identity} onSwitchIdentity={() => setIdentity(null)} />

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
          <div className="text-6xl mb-4">👶</div>
          <h2 className="text-3xl font-bold text-gray-100">Victoire</h2>
          <p className="text-gray-400 text-sm mt-2">Baby's Profile</p>
        </div>

        {/* Date of Birth */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
          <div>
            <label htmlFor="dob" className="block text-sm font-medium text-gray-400 mb-2">
              Date of Birth
            </label>
            <input
              id="dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-100 text-lg"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving || !dateOfBirth}
            className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg active:scale-95 transition-all min-h-[48px]"
          >
            {isSaving ? 'Saving...' : 'Save Date of Birth'}
          </button>

          {saveMessage && (
            <p className={`text-center text-sm ${saveMessage.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
              {saveMessage}
            </p>
          )}
        </div>

        {/* Age Display */}
        {age && (
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 border border-purple-700 rounded-xl p-6">
            <h2 className="text-lg font-bold text-purple-100 mb-4 text-center">Victoire's Age</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center bg-purple-800 bg-opacity-50 rounded-xl py-4">
                <div className="text-4xl font-bold text-purple-100">{age.days}</div>
                <div className="text-sm text-purple-300 mt-2">Days old</div>
              </div>
              <div className="text-center bg-pink-800 bg-opacity-50 rounded-xl py-4">
                <div className="text-4xl font-bold text-pink-100">{age.months}</div>
                <div className="text-sm text-pink-300 mt-2">Months old</div>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        {dateOfBirth && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-100 mb-3">Summary</h2>
            <div className="space-y-2 text-gray-300">
              <p>
                <span className="font-semibold text-gray-400">Name:</span> Victoire
              </p>
              <p>
                <span className="font-semibold text-gray-400">Born:</span>{' '}
                {new Date(dateOfBirth).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              {age && (
                <p>
                  <span className="font-semibold text-gray-400">Age:</span> {age.days} days ({age.months} months)
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
