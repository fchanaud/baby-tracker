'use client';

import { useState, useEffect, useMemo } from 'react';
import { useBabyProfile } from '@/hooks/useBabyProfile';

export default function BabyProfile() {
  const { profile, saveProfile } = useBabyProfile();
  const [name, setName] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | ''>('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');

  // Load existing profile
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setSex(profile.sex || '');
      setDateOfBirth(profile.dateOfBirth || '');
      setCurrentWeight(profile.currentWeight?.toString() || '');
    }
  }, [profile]);

  // Calculate age
  const age = useMemo(() => {
    if (!dateOfBirth) return null;

    const dob = new Date(dateOfBirth);
    const now = new Date();
    const diffMs = now.getTime() - dob.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const days = diffDays;
    const weeks = Math.floor(diffDays / 7);
    const months = Math.floor(diffDays / 30.44); // Average month length

    return { days, weeks, months };
  }, [dateOfBirth]);

  const handleSave = () => {
    saveProfile({
      name: name || undefined,
      sex: sex || undefined,
      dateOfBirth: dateOfBirth || undefined,
      currentWeight: currentWeight ? parseFloat(currentWeight) : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">👶 Baby Profile</h1>
          <a
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Dashboard
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Baby's Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Victoire"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>

          {/* Sex */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sex
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setSex('female')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  sex === 'female'
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-300 text-gray-600 hover:border-pink-300'
                }`}
              >
                👧 Female
              </button>
              <button
                onClick={() => setSex('male')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  sex === 'male'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:border-blue-300'
                }`}
              >
                👦 Male
              </button>
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              id="dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>

          {/* Current Weight */}
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
              Current Weight (kg)
            </label>
            <input
              id="weight"
              type="number"
              step="0.01"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(e.target.value)}
              placeholder="3.5"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full px-6 py-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 active:scale-95 transition-all"
          >
            Save Profile
          </button>
        </div>

        {/* Age Display */}
        {age && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-purple-900 mb-4">Age</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-700">{age.days}</div>
                <div className="text-sm text-purple-600 mt-1">Days</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-700">{age.weeks}</div>
                <div className="text-sm text-purple-600 mt-1">Weeks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-700">{age.months}</div>
                <div className="text-sm text-purple-600 mt-1">Months</div>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        {name && dateOfBirth && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Summary</h2>
            <div className="space-y-2 text-gray-700">
              <p>
                <span className="font-semibold">Name:</span> {name}
              </p>
              {sex && (
                <p>
                  <span className="font-semibold">Sex:</span> {sex === 'female' ? 'Female' : 'Male'}
                </p>
              )}
              <p>
                <span className="font-semibold">Born:</span>{' '}
                {new Date(dateOfBirth).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              {currentWeight && (
                <p>
                  <span className="font-semibold">Weight:</span> {currentWeight} kg
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
