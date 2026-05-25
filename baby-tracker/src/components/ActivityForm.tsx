'use client';

import { useState, useEffect } from 'react';
import { Identity } from '@/hooks/useIdentity';
import { LogType, Side, NappyType, PooConsistency } from '@/lib/types';

interface ActivityFormProps {
  identity: Identity;
  onLogCreated: () => void;
  initialActivity?: 'feed' | 'sleep' | 'nappy';
}

type FormStep = 'type' | 'feed-type' | 'feed-side' | 'feed-duration' | 'feed-amount' | 'sleep-duration' | 'nappy-type' | 'saving';

export default function ActivityForm({ identity, onLogCreated, initialActivity }: ActivityFormProps) {
  // Determine initial step based on initialActivity
  const getInitialStep = (): FormStep => {
    if (!initialActivity) return 'type';
    switch (initialActivity) {
      case 'feed':
        return 'feed-type';
      case 'sleep':
        return 'sleep-duration';
      case 'nappy':
        return 'nappy-type';
      default:
        return 'type';
    }
  };

  const [step, setStep] = useState<FormStep>(getInitialStep());
  const [logType, setLogType] = useState<LogType | null>(
    initialActivity === 'feed' ? 'breastfeed' :
    initialActivity === 'sleep' ? 'sleep' :
    initialActivity === 'nappy' ? 'nappy' : null
  );
  const [feedType, setFeedType] = useState<'breast' | 'bottle' | null>(null);
  const [side, setSide] = useState<Side | null>(null);
  const [nappyType, setNappyType] = useState<NappyType | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);


  const resetForm = () => {
    setStep('type');
    setLogType(null);
    setFeedType(null);
    setSide(null);
    setNappyType(null);
    setDuration(null);
    setError(null);
  };

  const saveLog = async (logData: any) => {
    setStep('saving');
    setError(null);

    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...logData,
          logged_by: identity,
          logged_at: new Date().toISOString(),
          needs_review: false,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error || 'Failed to save';
        setError(errorMsg);
        alert(`❌ Error: ${errorMsg}`);
        setStep('type');
        return;
      }

      // Success - format message based on log type
      let message = '✅ Logged: ';
      switch (logData.log_type) {
        case 'breastfeed':
          message += `Breastfeed - ${logData.side} - ${logData.duration_minutes}min`;
          break;
        case 'bottle':
          message += `Bottle - ${logData.amount_ml}ml`;
          break;
        case 'sleep':
          const hours = Math.floor(logData.duration_minutes / 60);
          const mins = logData.duration_minutes % 60;
          message += hours > 0 ? `Sleep - ${hours}h ${mins}m` : `Sleep - ${mins}m`;
          break;
        case 'nappy':
          message += `Nappy - ${logData.nappy_type}`;
          break;
        case 'note':
          message += `Note - ${logData.note}`;
          break;
      }

      setSuccessMessage(message);
      alert(message);

      // Success - notify and reset
      onLogCreated();
      resetForm();
    } catch (err) {
      console.error('Save error:', err);
      const errorMsg = 'Failed to save. Try again.';
      setError(errorMsg);
      alert(`❌ Error: ${errorMsg}`);
      setStep('type');
    }
  };

  // Step 1: Choose activity type
  if (step === 'type') {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 text-center">What happened?</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-800 text-sm text-center">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Feed */}
          <button
            onClick={() => {
              setLogType('breastfeed');
              setStep('feed-type');
            }}
            className="bg-pink-500 hover:bg-pink-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">🍼</span>
            <span className="text-lg font-semibold">Feed</span>
          </button>

          {/* Sleep */}
          <button
            onClick={() => {
              setLogType('sleep');
              setStep('sleep-duration');
            }}
            className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">😴</span>
            <span className="text-lg font-semibold">Sleep</span>
          </button>

          {/* Nappy */}
          <button
            onClick={() => {
              setLogType('nappy');
              setStep('nappy-type');
            }}
            className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">🧷</span>
            <span className="text-lg font-semibold">Nappy</span>
          </button>

          {/* Note */}
          <button
            onClick={() => {
              const note = prompt('Add a note:');
              if (note && note.trim()) {
                setLogType('note');
                saveLog({ log_type: 'note', note: note.trim() });
              }
            }}
            className="bg-purple-500 hover:bg-purple-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">📝</span>
            <span className="text-lg font-semibold">Note</span>
          </button>
        </div>
      </div>
    );
  }

  // Step 2a: Feed type (breast or bottle)
  if (step === 'feed-type') {
    return (
      <div className="space-y-3">
        <button
          onClick={resetForm}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Back
        </button>

        <h2 className="text-lg font-semibold text-gray-900 text-center">Feed type?</h2>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setFeedType('breast');
              setStep('feed-side');
            }}
            className="bg-pink-500 hover:bg-pink-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">🤱</span>
            <span className="text-lg font-semibold">Breast</span>
          </button>

          <button
            onClick={() => {
              setFeedType('bottle');
              setStep('feed-amount');
            }}
            className="bg-pink-500 hover:bg-pink-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">🍼</span>
            <span className="text-lg font-semibold">Bottle</span>
          </button>
        </div>
      </div>
    );
  }

  // Step 2b: Breast feed side
  if (step === 'feed-side') {
    // Smart defaults: predict next side based on last feed
    const lastSide = typeof window !== 'undefined' ? localStorage.getItem('lastBreastfeedSide') : null;
    const suggestedSide = lastSide === 'left' ? 'right' : lastSide === 'right' ? 'left' : 'left';
    const defaultDuration = 15; // minutes

    const handleQuickLog = () => {
      setSide(suggestedSide as Side);
      setDuration(defaultDuration);
      // Save to localStorage before logging
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastBreastfeedSide', suggestedSide);
      }
      saveLog({ log_type: 'breastfeed', side: suggestedSide, duration_minutes: defaultDuration });
    };

    return (
      <div className="space-y-3">
        <button
          onClick={() => setStep('feed-type')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Back
        </button>

        <h2 className="text-lg font-semibold text-gray-900 text-center">Which side?</h2>

        {/* Quick Log Button */}
        <button
          onClick={handleQuickLog}
          className="w-full bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[80px] flex items-center justify-center gap-3 shadow-lg border-2 border-pink-400"
        >
          <span className="text-3xl">⚡</span>
          <div className="text-left">
            <div className="text-xl font-bold">Quick Log: {suggestedSide.charAt(0).toUpperCase() + suggestedSide.slice(1)} - {defaultDuration}min</div>
            <div className="text-sm text-pink-100">One tap to save</div>
          </div>
          <span className="text-3xl">✓</span>
        </button>

        <p className="text-sm text-gray-600 text-center">Or choose manually:</p>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => {
              setSide('left');
              setStep('feed-duration');
            }}
            className="bg-pink-500 hover:bg-pink-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">👈</span>
            <span className="text-lg font-semibold">Left</span>
          </button>

          <button
            onClick={() => {
              setSide('right');
              setStep('feed-duration');
            }}
            className="bg-pink-500 hover:bg-pink-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">👉</span>
            <span className="text-lg font-semibold">Right</span>
          </button>

          <button
            onClick={() => {
              setSide('both');
              setStep('feed-duration');
            }}
            className="bg-pink-500 hover:bg-pink-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">👆</span>
            <span className="text-lg font-semibold">Both</span>
          </button>
        </div>
      </div>
    );
  }

  // Step 2b2: Breast feed duration
  if (step === 'feed-duration') {
    const commonDurations = [5, 10, 15, 20, 25, 30];

    return (
      <div className="space-y-3">
        <button
          onClick={() => setStep('feed-side')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Back
        </button>

        <h2 className="text-lg font-semibold text-gray-900 text-center">How long? (minutes)</h2>

        <div className="grid grid-cols-3 gap-3">
          {commonDurations.map(dur => (
            <button
              key={dur}
              onClick={() => {
                setDuration(dur);
                // Save side to localStorage for next time
                if (typeof window !== 'undefined' && side) {
                  localStorage.setItem('lastBreastfeedSide', side);
                }
                saveLog({ log_type: 'breastfeed', side, duration_minutes: dur });
              }}
              className="bg-pink-500 hover:bg-pink-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[100px] flex flex-col items-center justify-center gap-2"
            >
              <span className="text-3xl font-bold">{dur}</span>
              <span className="text-sm">min</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2b3: Bottle amount
  if (step === 'feed-amount') {
    const commonAmounts = [30, 60, 90, 120, 150, 180];

    return (
      <div className="space-y-3">
        <button
          onClick={() => setStep('feed-type')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Back
        </button>

        <h2 className="text-lg font-semibold text-gray-900 text-center">How much? (ml)</h2>

        <div className="grid grid-cols-3 gap-3">
          {commonAmounts.map(amount => (
            <button
              key={amount}
              onClick={() => {
                saveLog({ log_type: 'bottle', amount_ml: amount });
              }}
              className="bg-pink-500 hover:bg-pink-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[100px] flex flex-col items-center justify-center gap-2"
            >
              <span className="text-3xl font-bold">{amount}</span>
              <span className="text-sm">ml</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2c: Sleep duration
  if (step === 'sleep-duration') {
    const commonDurations = [
      { label: '30 min', value: 30 },
      { label: '1 hour', value: 60 },
      { label: '1.5 hrs', value: 90 },
      { label: '2 hours', value: 120 },
      { label: '2.5 hrs', value: 150 },
      { label: '3 hours', value: 180 },
    ];

    return (
      <div className="space-y-3">
        <button
          onClick={resetForm}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Back
        </button>

        <h2 className="text-lg font-semibold text-gray-900 text-center">How long?</h2>

        <div className="grid grid-cols-3 gap-3">
          {commonDurations.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => {
                saveLog({ log_type: 'sleep', duration_minutes: value });
              }}
              className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[100px] flex flex-col items-center justify-center gap-2"
            >
              <span className="text-2xl font-bold">{label}</span>
            </button>
          ))}

          {/* 4+ hours - ask for custom input */}
          <button
            onClick={() => {
              const hours = prompt('How many hours?');
              if (hours && !isNaN(Number(hours))) {
                const minutes = Math.round(Number(hours) * 60);
                if (minutes > 0) {
                  saveLog({ log_type: 'sleep', duration_minutes: minutes });
                }
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[100px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-2xl font-bold">4+ hrs</span>
          </button>
        </div>
      </div>
    );
  }

  // Step 2d: Nappy type
  if (step === 'nappy-type') {
    return (
      <div className="space-y-3">
        <button
          onClick={resetForm}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Back
        </button>

        <h2 className="text-lg font-semibold text-gray-900 text-center">Nappy type?</h2>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => {
              setNappyType('wet');
              saveLog({ log_type: 'nappy', nappy_type: 'wet' });
            }}
            className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">💧</span>
            <span className="text-lg font-semibold">Wet</span>
          </button>

          <button
            onClick={() => {
              setNappyType('dirty' as any);
              saveLog({ log_type: 'nappy', nappy_type: 'dirty' as any });
            }}
            className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">💩</span>
            <span className="text-lg font-semibold">Dirty</span>
          </button>

          <button
            onClick={() => {
              setNappyType('mixed' as any);
              saveLog({ log_type: 'nappy', nappy_type: 'mixed' as any });
            }}
            className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">💦</span>
            <span className="text-lg font-semibold">Mixed</span>
          </button>
        </div>
      </div>
    );
  }

  // Saving state
  if (step === 'saving') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
        <div className="text-6xl mb-4 animate-pulse">⏳</div>
        <p className="text-blue-900 font-semibold text-lg">Saving...</p>
      </div>
    );
  }

  return null;
}
