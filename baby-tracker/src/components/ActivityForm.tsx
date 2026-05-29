'use client';

import { useState, useEffect, useMemo } from 'react';
import { Identity } from '@/hooks/useIdentity';
import { LogType, Side, NappyType, PooConsistency, PooColor, Log } from '@/lib/types';
import { getEnvironment } from '@/lib/supabase';
import Toast from './Toast';

interface ActivityFormProps {
  identity: Identity;
  onLogCreated: () => void;
  onSaveError?: (error: string) => void;
  initialActivity?: 'feed' | 'sleep' | 'nappy';
  todayLogs?: Log[];
}

type FormStep = 'type' | 'timing' | 'feed-type' | 'feed-timer' | 'feed-side' | 'feed-duration' | 'feed-amount' | 'sleep-duration' | 'nappy-type' | 'stool-type' | 'poo-color' | 'note' | 'saving';

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
  const [pooColor, setPooColor] = useState<PooColor | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showPooGuide, setShowPooGuide] = useState(false);
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [sleepHours, setSleepHours] = useState(1);
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [noteText, setNoteText] = useState('');
  const [pendingLogData, setPendingLogData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [customTime, setCustomTime] = useState<string | null>(null);
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [customDateTime, setCustomDateTime] = useState('');

  // Timer effect (runs every second when timer is active)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  // Calculate breastfeed side balance for last 6 hours
  const breastfeedBalance = useMemo(() => {
    const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
    const recentBreastfeeds = todayLogs.filter(log =>
      log.log_type === 'breastfeed' &&
      new Date(log.logged_at).getTime() >= sixHoursAgo
    );

    const leftCount = recentBreastfeeds.filter(log => log.side === 'left').length;
    const rightCount = recentBreastfeeds.filter(log => log.side === 'right').length;
    const total = leftCount + rightCount;

    // Only show recommendation if there's an imbalance of 2+ feeds in last 6 hours
    let recommendation = '';
    const imbalance = Math.abs(leftCount - rightCount);
    if (imbalance >= 2 && total > 0) {
      if (leftCount > rightCount) {
        recommendation = 'Try right next';
      } else {
        recommendation = 'Try left next';
      }
    }

    return {
      leftCount,
      rightCount,
      recommendation,
      hasFeeds: recentBreastfeeds.length > 0,
      total,
    };
  }, [todayLogs]);

  const resetForm = () => {
    setStep('type');
    setLogType(null);
    setFeedType(null);
    setSide(null);
    setNappyType(null);
    setStoolType(null);
    setPooColor(null);
    setDuration(null);
    setNoteText('');
    setPendingLogData(null);
    setError(null);
    setCustomTime(null);
    setShowTimeInput(false);
    setCustomDateTime('');
    setTimerRunning(false);
    setTimerSeconds(0);
    setShowPooGuide(false);
    setDurationHours(0);
    setDurationMinutes(15);
    setSleepHours(1);
    setSleepMinutes(0);
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
          check_merge: true, // Flag to enable auto-merge logic in API
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
      if (customDateTime) {
        // Validate date is within last 7 days and not in the future
        const selectedDate = new Date(customDateTime);
        const now = new Date();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        if (selectedDate > now) {
          setError('Cannot log activities in the future');
          return;
        }

        if (selectedDate >= sevenDaysAgo && selectedDate <= now) {
          setCustomTime(selectedDate.toISOString());
          setError(null);

          // Route to next step
          if (logType === 'breastfeed' || logType === 'bottle') {
            setStep('feed-type');
          } else if (logType === 'sleep') {
            setStep('sleep-duration');
          } else if (logType === 'nappy') {
            setStep('nappy-type');
          }
        } else {
          setError('Please select a date within the last 7 days');
        }
      }
    };

    // Calculate default date/time (e.g., 1 hour ago)
    const defaultDateTime = new Date(Date.now() - 60 * 60 * 1000).toISOString().slice(0, 16);
    // Calculate min date (7 days ago)
    const minDateTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    // Calculate max date (now)
    const maxDateTime = new Date().toISOString().slice(0, 16);

    return (
      <div className="space-y-3">
        <button
          onClick={() => initialActivity ? resetForm() : setStep('type')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1 min-h-[48px]"
        >
          ← Back
        </button>

        <h2 className="text-lg font-semibold text-gray-900 text-center">When did it happen?</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-800 text-sm text-center">{error}</p>
          </div>
        )}

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
            <p className="text-sm text-gray-700 text-center font-medium">Select date and time (last 7 days)</p>

            <div className="w-full overflow-hidden">
              <input
                type="datetime-local"
                value={customDateTime || defaultDateTime}
                onChange={(e) => {
                  const selected = new Date(e.target.value);
                  const now = new Date();
                  if (selected > now) {
                    setError('Cannot select a time in the future');
                    setCustomDateTime(now.toISOString().slice(0, 16));
                  } else {
                    setError(null);
                    setCustomDateTime(e.target.value);
                  }
                }}
                min={minDateTime}
                max={maxDateTime}
                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-gray-900 text-base max-w-full"
                style={{ WebkitAppearance: 'none', maxWidth: '100%' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowTimeInput(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl py-3 font-semibold min-h-[48px]"
              >
                Cancel
              </button>
              <button
                onClick={handleEarlierConfirm}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 font-semibold min-h-[48px]"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {customTime && !showTimeInput && (
          <p className="text-sm text-gray-600 text-center font-medium">
            Time: {new Date(customTime).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
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
              setStep('feed-timer');
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

  // Step 2a2: Breastfeed timer (full screen)
  if (step === 'feed-timer') {
    const formatTimer = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const handleDone = () => {
      setDuration(Math.floor(timerSeconds / 60)); // Convert to minutes
      setTimerRunning(false);
      setStep('feed-side');
    };

    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setTimerRunning(false);
            setTimerSeconds(0);
            setStep('feed-type');
          }}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1 min-h-[48px]"
        >
          ← Back
        </button>

        {/* Full screen timer display - iPhone 16e optimized */}
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8 px-4 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 text-center">Breastfeeding Timer</h2>

          {/* Timer display - responsive font size */}
          <div className="text-7xl sm:text-9xl font-mono font-bold text-pink-600 tracking-wider">
            {formatTimer(timerSeconds)}
          </div>

          <p className="text-gray-600 text-lg text-center">
            {timerRunning ? 'Timer running...' : 'Tap Start to begin'}
          </p>

          {/* Start/Done buttons */}
          {!timerRunning ? (
            <button
              onClick={() => setTimerRunning(true)}
              className="bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-2xl px-12 py-6 text-2xl font-bold transition-all min-h-[80px] w-full max-w-[280px]"
            >
              ▶️ Start
            </button>
          ) : (
            <button
              onClick={handleDone}
              className="bg-pink-500 hover:bg-pink-600 active:scale-95 text-white rounded-2xl px-12 py-6 text-2xl font-bold transition-all min-h-[80px] w-full max-w-[280px]"
            >
              Done
            </button>
          )}
        </div>
      </div>
    );
  }

  // Step 2b: Breast feed side
  if (step === 'feed-side') {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setStep('feed-timer')}
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
                Last 6h: L:{breastfeedBalance.leftCount} | R:{breastfeedBalance.rightCount}
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

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setSide('left');
              if (typeof window !== 'undefined') {
                localStorage.setItem('lastBreastfeedSide', 'left');
              }
              goToNote({ log_type: 'breastfeed', side: 'left', duration_minutes: duration });
            }}
            className="bg-pink-500 hover:bg-pink-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">👈</span>
            <span className="text-lg font-semibold">Left</span>
          </button>

          <button
            onClick={() => {
              setSide('right');
              if (typeof window !== 'undefined') {
                localStorage.setItem('lastBreastfeedSide', 'right');
              }
              goToNote({ log_type: 'breastfeed', side: 'right', duration_minutes: duration });
            }}
            className="bg-pink-500 hover:bg-pink-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">👉</span>
            <span className="text-lg font-semibold">Right</span>
          </button>
        </div>
      </div>
    );
  }

  // Step 2b2: Breast feed duration (if timer was skipped - now unused, always use timer)
  if (step === 'feed-duration') {
    const handleSave = () => {
      const totalMinutes = durationHours * 60 + durationMinutes;
      if (totalMinutes > 0) {
        setDuration(totalMinutes);
        if (typeof window !== 'undefined' && side) {
          localStorage.setItem('lastBreastfeedSide', side);
        }
        goToNote({ log_type: 'breastfeed', side, duration_minutes: totalMinutes });
      }
    };

    return (
      <div className="space-y-3">
        <button
          onClick={() => setStep('feed-side')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Back
        </button>

        <h2 className="text-lg font-semibold text-gray-900 text-center">How long?</h2>

        {/* Duration pickers */}
        <div className="bg-gray-100 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Hours picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Hours</label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-gray-900 text-center text-2xl font-semibold min-h-[48px]"
              >
                {[0, 1, 2, 3, 4].map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Minutes picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Minutes</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-gray-900 text-center text-2xl font-semibold min-h-[48px]"
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-pink-500 hover:bg-pink-600 active:scale-95 text-white rounded-2xl py-4 font-semibold text-lg min-h-[48px]"
          >
            Continue
          </button>
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
    const handleSave = () => {
      const totalMinutes = sleepHours * 60 + sleepMinutes;
      if (totalMinutes > 0) {
        goToNote({ log_type: 'sleep', duration_minutes: totalMinutes });
      }
    };

    return (
      <div className="space-y-3">
        <button
          onClick={() => setStep('timing')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Back
        </button>

        <h2 className="text-lg font-semibold text-gray-900 text-center">How long?</h2>

        {/* Duration pickers */}
        <div className="bg-gray-100 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Hours picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Hours</label>
              <select
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-gray-900 text-center text-2xl font-semibold min-h-[48px]"
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Minutes picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Minutes</label>
              <select
                value={sleepMinutes}
                onChange={(e) => setSleepMinutes(Number(e.target.value))}
                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-gray-900 text-center text-2xl font-semibold min-h-[48px]"
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-2xl py-4 font-semibold text-lg min-h-[48px]"
          >
            Continue ({sleepHours}h {sleepMinutes}m)
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
              setStep('poo-color');
            }}
            className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">✅</span>
            <span className="text-lg font-semibold">Normal</span>
          </button>

          <button
            onClick={() => {
              setStoolType('soft');
              setStep('poo-color');
            }}
            className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
          >
            <span className="text-5xl">🟡</span>
            <span className="text-lg font-semibold">Soft</span>
          </button>

          <button
            onClick={() => {
              setStoolType('liquid');
              setStep('poo-color');
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

  // Step 2f: Poo color (after stool-type)
  if (step === 'poo-color') {
    const colors: { name: PooColor; emoji: string; bg: string; concerning: boolean }[] = [
      { name: 'yellow', emoji: '🟡', bg: 'bg-yellow-400', concerning: false },
      { name: 'green', emoji: '🟢', bg: 'bg-green-500', concerning: false },
      { name: 'brown', emoji: '🟤', bg: 'bg-amber-700', concerning: false },
      { name: 'red', emoji: '🔴', bg: 'bg-red-500', concerning: true },
      { name: 'black', emoji: '⚫', bg: 'bg-gray-900', concerning: true },
      { name: 'white', emoji: '⚪', bg: 'bg-gray-100', concerning: true },
      { name: 'gray', emoji: '🩶', bg: 'bg-gray-400', concerning: true },
    ];

    const handleColorSelect = (color: PooColor, concerning: boolean) => {
      setPooColor(color);
      if (concerning) {
        // Show warning, then proceed to note
        setTimeout(() => {
          goToNote({ log_type: 'nappy', nappy_type: nappyType, poo_consistency: stoolType, poo_color: color });
        }, 100);
      } else {
        goToNote({ log_type: 'nappy', nappy_type: nappyType, poo_consistency: stoolType, poo_color: color });
      }
    };

    return (
      <div className="space-y-3">
        <button
          onClick={() => setStep('stool-type')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Back
        </button>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Poo color?</h2>
          <button
            onClick={() => setShowPooGuide(!showPooGuide)}
            className="text-blue-600 hover:text-blue-700 bg-blue-50 rounded-full w-8 h-8 flex items-center justify-center font-bold min-h-[48px] min-w-[48px]"
          >
            ℹ️
          </button>
        </div>

        {/* Poo guide popup */}
        {showPooGuide && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-blue-900 text-center">NHS Baby Stool Guide</h3>
            <div className="space-y-2 text-sm text-blue-900">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🟡🟢🟤</span>
                <span><strong>Normal:</strong> Yellow, green, or brown stools are typical for babies</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔴⚫⚪🩶</span>
                <span><strong>Concerning:</strong> Red, black, white, or gray may indicate a health issue</span>
              </div>
            </div>
            <button
              onClick={() => setShowPooGuide(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-semibold min-h-[48px]"
            >
              Got it
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {colors.map(({ name, emoji, bg, concerning }) => (
            <button
              key={name}
              onClick={() => handleColorSelect(name, concerning)}
              className={`${bg} hover:opacity-90 active:scale-95 text-white rounded-2xl p-6 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2 ${concerning ? 'ring-2 ring-red-500' : ''}`}
            >
              <span className="text-5xl">{emoji}</span>
              <span className="text-lg font-semibold capitalize">{name}</span>
              {concerning && (
                <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full">⚠️</span>
              )}
            </button>
          ))}
        </div>

        {pooColor && colors.find(c => c.name === pooColor)?.concerning && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800 text-sm text-center">
              <strong>⚠️ Note:</strong> This color may indicate a health issue. Contact your healthcare provider.
            </p>
          </div>
        )}
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
            pendingLogData?.log_type === 'nappy' && pendingLogData?.poo_color ? 'poo-color' :
            pendingLogData?.log_type === 'nappy' && pendingLogData?.poo_consistency ? 'stool-type' :
            pendingLogData?.log_type === 'nappy' ? 'nappy-type' :
            'feed-duration'
          )}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1 min-h-[48px]"
        >
          ← Back
        </button>

        <h2 className="text-lg font-semibold text-gray-900 text-center">Add a note?</h2>

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
