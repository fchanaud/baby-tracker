'use client';

import { useState, useEffect, useMemo } from 'react';
import { Identity } from '@/hooks/useIdentity';
import { LogType, Side, NappyType, PooConsistency, Log } from '@/lib/types';
import { getEnvironment } from '@/lib/supabase';
import Toast from './Toast';

interface ActivityFormProps {
  identity: Identity;
  onLogCreated: () => void;
  onSaveError?: (error: string) => void;
  initialActivity?: 'feed' | 'sleep' | 'nappy';
  todayLogs?: Log[];
}

type FormStep = 'type' | 'timing' | 'feed-type' | 'feed-side' | 'feed-duration' | 'feed-amount' | 'sleep-duration' | 'nappy-type' | 'stool-type' | 'note' | 'saving';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export default function ActivityForm({ identity, onLogCreated, onSaveError, initialActivity, todayLogs = [] }: ActivityFormProps) {
  // Determine initial step based on initialActivity
  const getInitialStep = (): FormStep => {
    // Always start with timing if activity is pre-selected
    if (initialActivity) return 'timing';
    return 'type';
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
  const [stoolType, setStoolType] = useState<PooConsistency | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [pendingLogData, setPendingLogData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [customTime, setCustomTime] = useState<string | null>(null);
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [hoursAgo, setHoursAgo] = useState('1');

  // Calculate breastfeed side balance for today
  const breastfeedBalance = useMemo(() => {
    const breastfeeds = todayLogs.filter(log => log.log_type === 'breastfeed');
    const leftCount = breastfeeds.filter(log => log.side === 'left').length;
    const rightCount = breastfeeds.filter(log => log.side === 'right').length;

    let recommendation = '';
    if (leftCount > rightCount) {
      recommendation = 'Try right next';
    } else if (rightCount > leftCount) {
      recommendation = 'Try left next';
    } else if (leftCount === rightCount && leftCount > 0) {
      recommendation = 'Both sides equal today';
    }

    return {
      leftCount,
      rightCount,
      recommendation,
      hasFeeds: breastfeeds.length > 0,
      total: leftCount + rightCount,
    };
  }, [todayLogs]);

  const resetForm = () => {
    setStep('type');
    setLogType(null);
    setFeedType(null);
    setSide(null);
    setNappyType(null);
    setStoolType(null);
    setDuration(null);
    setNoteText('');
    setPendingLogData(null);
    setError(null);
    setCustomTime(null);
    setShowTimeInput(false);
    setHoursAgo('1');
  };

  const goToNote = (logData: any) => {
    setPendingLogData(logData);
    setStep('note');
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
          logged_at: customTime || new Date().toISOString(),
          needs_review: false,
          environment: getEnvironment(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error || 'Failed to save log';
        if (onSaveError) {
          onSaveError(errorMsg);
          resetForm();
        } else {
          setError(errorMsg);
          setToast({ message: errorMsg, type: 'error' });
          setStep('type');
        }
        return;
      }

      // Success - format message based on log type
      let message = 'Logged: ';
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
      }

      setToast({ message, type: 'success' });

      // Success - notify and reset
      onLogCreated();
      resetForm();
    } catch (err) {
      console.error('Save error:', err);
      const errorMsg = 'Failed to save. Please try again.';
      if (onSaveError) {
        onSaveError(errorMsg);
        resetForm();
      } else {
        setError(errorMsg);
        setToast({ message: errorMsg, type: 'error' });
        setStep('type');
      }
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

        <div className="grid grid-cols-3 gap-3">
          {/* Feed */}
          <button
            onClick={() => {
              setLogType('breastfeed');
              setStep('timing');
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
              setStep('timing');
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
              setStep('timing');
            }}
            className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">🧷</span>
            <span className="text-lg font-semibold">Nappy</span>
          </button>
        </div>
      </div>
    );
  }

  // Step 1.5: Choose timing (now or earlier)
  if (step === 'timing') {
    const handleNow = () => {
      setCustomTime(null);
      // Route to next step based on activity type
      if (logType === 'breastfeed' || logType === 'bottle') {
        setStep('feed-type');
      } else if (logType === 'sleep') {
        setStep('sleep-duration');
      } else if (logType === 'nappy') {
        setStep('nappy-type');
      }
    };

    const handleEarlierConfirm = () => {
      const hours = parseFloat(hoursAgo);
      if (!isNaN(hours) && hours > 0) {
        const pastTime = new Date(Date.now() - hours * 60 * 60 * 1000);
        setCustomTime(pastTime.toISOString());

        // Route to next step
        if (logType === 'breastfeed' || logType === 'bottle') {
          setStep('feed-type');
        } else if (logType === 'sleep') {
          setStep('sleep-duration');
        } else if (logType === 'nappy') {
          setStep('nappy-type');
        }
      }
    };

    return (
      <div className="space-y-3">
        <button
          onClick={() => initialActivity ? resetForm() : setStep('type')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1 min-h-[48px]"
        >
          ← Back
        </button>

        <h2 className="text-lg font-semibold text-gray-900 text-center">When did it happen?</h2>

        {!showTimeInput ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleNow}
              className="bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
            >
              <span className="text-5xl">⏰</span>
              <span className="text-lg font-semibold">Just Now</span>
            </button>

            <button
              onClick={() => setShowTimeInput(true)}
              className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
            >
              <span className="text-5xl">⏮️</span>
              <span className="text-lg font-semibold">Earlier</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 bg-gray-100 rounded-xl p-4">
            <p className="text-sm text-gray-700 text-center font-medium">How many hours ago?</p>

            <div className="grid grid-cols-4 gap-2">
              {['0.5', '1', '2', '3'].map(hours => (
                <button
                  key={hours}
                  onClick={() => {
                    setHoursAgo(hours);
                    const h = parseFloat(hours);
                    const pastTime = new Date(Date.now() - h * 60 * 60 * 1000);
                    setCustomTime(pastTime.toISOString());
                    handleEarlierConfirm();
                  }}
                  className="bg-white hover:bg-gray-200 active:scale-95 border border-gray-300 text-gray-900 rounded-xl py-4 transition-all font-semibold"
                >
                  {hours}h
                </button>
              ))}
            </div>

            <div className="flex gap-2 items-center">
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={hoursAgo}
                onChange={(e) => setHoursAgo(e.target.value)}
                placeholder="Hours"
                className="flex-1 bg-white border border-gray-300 rounded-xl p-3 text-gray-900 text-center text-lg font-semibold"
              />
              <button
                onClick={handleEarlierConfirm}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 py-3 font-semibold min-h-[48px]"
              >
                OK
              </button>
            </div>

            <button
              onClick={() => setShowTimeInput(false)}
              className="w-full text-gray-600 hover:text-gray-900 text-sm min-h-[48px]"
            >
              Cancel
            </button>
          </div>
        )}

        {customTime && !showTimeInput && (
          <p className="text-sm text-gray-600 text-center font-medium">
            Time: {new Date(customTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    );
  }

  // Step 2a: Feed type (breast or bottle)
  if (step === 'feed-type') {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setStep('timing')}
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
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastBreastfeedSide', suggestedSide);
      }
      goToNote({ log_type: 'breastfeed', side: suggestedSide, duration_minutes: defaultDuration });
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

        {/* Side Balance Indicator */}
        {breastfeedBalance.hasFeeds && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Today: L:{breastfeedBalance.leftCount} | R:{breastfeedBalance.rightCount}
              </span>
            </div>
            {/* Visual progress bar */}
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-500"
                style={{ width: `${(breastfeedBalance.leftCount / breastfeedBalance.total) * 100}%` }}
              />
              <div
                className="bg-pink-500"
                style={{ width: `${(breastfeedBalance.rightCount / breastfeedBalance.total) * 100}%` }}
              />
            </div>
            {breastfeedBalance.recommendation && (
              <p className="text-blue-600 font-semibold text-sm mt-2">
                {breastfeedBalance.recommendation}
              </p>
            )}
          </div>
        )}

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
                if (typeof window !== 'undefined' && side) {
                  localStorage.setItem('lastBreastfeedSide', side);
                }
                goToNote({ log_type: 'breastfeed', side, duration_minutes: dur });
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
                goToNote({ log_type: 'bottle', amount_ml: amount });
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
          onClick={() => setStep('timing')}
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
                goToNote({ log_type: 'sleep', duration_minutes: value });
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
                  goToNote({ log_type: 'sleep', duration_minutes: minutes });
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
          onClick={() => setStep('timing')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Back
        </button>

        <h2 className="text-lg font-semibold text-gray-900 text-center">Nappy type?</h2>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => {
              setNappyType('wet');
              goToNote({ log_type: 'nappy', nappy_type: 'wet' });
            }}
            className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">💧</span>
            <span className="text-lg font-semibold">Wet</span>
          </button>

          <button
            onClick={() => {
              setNappyType('poo');
              setStep('stool-type');
            }}
            className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">💩</span>
            <span className="text-lg font-semibold">Dirty</span>
          </button>

          <button
            onClick={() => {
              setNappyType('both');
              setStep('stool-type');
            }}
            className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">💦</span>
            <span className="text-lg font-semibold">Both</span>
          </button>
        </div>
      </div>
    );
  }

  // Step 2e: Stool type (for dirty or both nappies)
  if (step === 'stool-type') {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setStep('nappy-type')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Back
        </button>

        <h2 className="text-lg font-semibold text-gray-900 text-center">Type of stool</h2>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => {
              setStoolType('normal');
              goToNote({ log_type: 'nappy', nappy_type: nappyType, poo_consistency: 'normal' });
            }}
            className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">✅</span>
            <span className="text-lg font-semibold">Normal</span>
          </button>

          <button
            onClick={() => {
              setStoolType('soft');
              goToNote({ log_type: 'nappy', nappy_type: nappyType, poo_consistency: 'soft' });
            }}
            className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">🟡</span>
            <span className="text-lg font-semibold">Soft</span>
          </button>

          <button
            onClick={() => {
              setStoolType('liquid');
              goToNote({ log_type: 'nappy', nappy_type: nappyType, poo_consistency: 'liquid' });
            }}
            className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">💧</span>
            <span className="text-lg font-semibold">Liquid</span>
          </button>
        </div>
      </div>
    );
  }

  // Note step (optional, last step before saving)
  if (step === 'note') {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setStep(
            pendingLogData?.log_type === 'sleep' ? 'sleep-duration' :
            pendingLogData?.log_type === 'bottle' ? 'feed-amount' :
            pendingLogData?.log_type === 'nappy' && pendingLogData?.poo_consistency ? 'stool-type' :
            pendingLogData?.log_type === 'nappy' ? 'nappy-type' :
            'feed-duration'
          )}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1 min-h-[48px]"
        >
          ← Back
        </button>

        <h2 className="text-lg font-semibold text-gray-900 text-center">Add a note? <span className="text-gray-500 font-normal text-base">(optional)</span></h2>

        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="e.g. seemed gassy, latched well..."
          className="w-full bg-white border border-gray-300 rounded-xl p-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none text-base"
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => saveLog(pendingLogData)}
            className="bg-gray-200 hover:bg-gray-300 active:scale-95 text-gray-700 rounded-2xl p-4 transition-all min-h-[64px] font-semibold text-lg"
          >
            Skip
          </button>
          <button
            onClick={() => saveLog({ ...pendingLogData, note: noteText.trim() || undefined })}
            className="bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-2xl p-4 transition-all min-h-[64px] font-semibold text-lg"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  // Saving state
  if (step === 'saving') {
    return (
      <>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className="text-blue-900 font-semibold text-lg">Saving...</p>
        </div>
      </>
    );
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
