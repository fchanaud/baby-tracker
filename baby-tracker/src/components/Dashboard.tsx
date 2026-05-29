'use client';

import { useState, useMemo, useEffect } from 'react';
import { useIdentity } from '@/hooks/useIdentity';
import { useLogs } from '@/hooks/useLogs';
import { useBabyProfile } from '@/hooks/useBabyProfile';
import { getEnvironment } from '@/lib/supabase';
import IdentityPicker from './IdentityPicker';
import ActivityForm from './ActivityForm';
import ActivityButtons from './ActivityButtons';
import MetricCards from './MetricCards';
import RecentLogs from './RecentLogs';
import Navbar from './Navbar';
import NormalCheckSheet from './NormalCheckSheet';
import EnvironmentToggle from './EnvironmentToggle';

export default function Dashboard() {
  const { identity, setIdentity, isLoading: identityLoading } = useIdentity();
  const { logs, refresh } = useLogs();
  const { profile } = useBabyProfile();
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<'feed' | 'sleep' | 'nappy' | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showNormalCheck, setShowNormalCheck] = useState(true);
  const [normalCheckAnswer, setNormalCheckAnswer] = useState<string | null>(null);
  const [normalCheckLoading, setNormalCheckLoading] = useState(false);

  // Filter logs for today (00:00 - now)
  const todayLogs = useMemo(() => {
    const today = new Date();
    const dateStart = new Date(today);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(today);
    dateEnd.setHours(23, 59, 59, 999);

    return logs.filter(log => {
      const logDate = new Date(log.logged_at);
      return logDate >= dateStart && logDate <= dateEnd;
    });
  }, [logs]);

  // Calculate breastfeed side balance for last 6 hours
  const breastfeedBalance = useMemo(() => {
    const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
    const recentBreastfeeds = todayLogs.filter(log =>
      log.log_type === 'breastfeed' &&
      new Date(log.logged_at).getTime() >= sixHoursAgo
    );

    const leftCount = recentBreastfeeds.filter(log => log.side === 'left').length;
    const rightCount = recentBreastfeeds.filter(log => log.side === 'right').length;
    const bothCount = recentBreastfeeds.filter(log => log.side === 'both').length;
    const total = leftCount + rightCount;

    // Only show warning if ALL feeds in last 6h are from ONE side only
    // AND there are no "both" feeds
    let showWarning = false;
    let recommendation = '';
    if (total > 0 && bothCount === 0 && (leftCount === 0 || rightCount === 0)) {
      showWarning = true;
      if (leftCount > 0) {
        recommendation = 'Try right next';
      } else {
        recommendation = 'Try left next';
      }
    }

    const lastFeed = recentBreastfeeds.length > 0 ? recentBreastfeeds[0] : null;
    let lastFeedText = '';
    if (lastFeed) {
      const now = Date.now();
      const feedTime = new Date(lastFeed.logged_at).getTime();
      const diffMs = now - feedTime;
      const totalMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;

      // Format: don't show "0h", show minutes only if less than 1 hour
      if (totalMins < 1) {
        lastFeedText = `Last feed: Just now (${lastFeed.side})`;
      } else if (hours === 0) {
        lastFeedText = `Last feed: ${mins}m ago (${lastFeed.side})`;
      } else if (mins === 0) {
        lastFeedText = `Last feed: ${hours}h ago (${lastFeed.side})`;
      } else {
        lastFeedText = `Last feed: ${hours}h ${mins}m ago (${lastFeed.side})`;
      }
    }

    return {
      leftCount,
      rightCount,
      recommendation,
      lastFeedText,
      showWarning,
      total,
    };
  }, [todayLogs]);

  const handleActivitySelect = (activity: 'feed' | 'sleep' | 'nappy') => {
    setSelectedActivity(activity);
    setShowActivityForm(true);
  };

  const handleLogCreated = () => {
    refresh();
    setShowActivityForm(false);
    setSelectedActivity(null);
    setSaveError(null);
  };

  const handleSaveError = (error: string) => {
    setSaveError(error);
    setShowActivityForm(false);
    setSelectedActivity(null);
  };

  // Check if normal check button was used today
  useEffect(() => {
    const lastCheckDate = localStorage.getItem('lastNormalCheckDate');
    const today = new Date().toDateString();
    if (lastCheckDate === today) {
      setShowNormalCheck(false);
    }
  }, []);

  const handleNormalCheck = async () => {
    setNormalCheckLoading(true);
    setNormalCheckAnswer(null);

    try {
      const response = await fetch('/api/normal-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: getEnvironment() }),
      });

      const result = await response.json();

      if (!response.ok) {
        setNormalCheckAnswer(`Error: ${result.error || 'Failed to check'}`);
        return;
      }

      setNormalCheckAnswer(result.answer);

      // Hide button for rest of day
      const today = new Date().toDateString();
      localStorage.setItem('lastNormalCheckDate', today);
      setShowNormalCheck(false);
    } catch (error) {
      console.error('Normal check error:', error);
      setNormalCheckAnswer('Failed to check. Please try again.');
    } finally {
      setNormalCheckLoading(false);
    }
  };

  // Show identity picker if not set (after all hooks)
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

  // Show activity form modal
  if (showActivityForm && selectedActivity) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <button
            onClick={() => {
              setShowActivityForm(false);
              setSelectedActivity(null);
            }}
            className="text-gray-400 hover:text-gray-200 mb-4 min-h-[48px] flex items-center gap-2"
          >
            ← Back to dashboard
          </button>
          <ActivityForm
            identity={identity}
            onLogCreated={handleLogCreated}
            onSaveError={handleSaveError}
            initialActivity={selectedActivity}
            todayLogs={todayLogs}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      <Navbar identity={identity} onSwitchIdentity={() => setIdentity(null)} />

      {/* Main Content */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Save Error Banner */}
        {saveError && (
          <div className="bg-red-100 border border-red-300 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl flex-shrink-0">❌</span>
            <p className="text-red-900 font-semibold flex-1">{saveError}</p>
            <button
              onClick={() => setSaveError(null)}
              className="text-red-700 hover:text-red-900 font-bold text-xl flex-shrink-0 min-h-[48px] min-w-[48px] flex items-center justify-center"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Normal Check Button */}
        {showNormalCheck && (
          <button
            onClick={handleNormalCheck}
            disabled={normalCheckLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-600 text-white font-bold rounded-xl p-4 transition-all min-h-[64px] flex items-center justify-center gap-3 shadow-lg"
          >
            <span className="text-2xl">🩺</span>
            <span className="text-lg">
              {normalCheckLoading ? 'Checking...' : 'Is everything normal right now?'}
            </span>
          </button>
        )}

        {/* Activity Buttons */}
        <ActivityButtons onActivitySelect={handleActivitySelect} />

        {/* Feed Side Balance Warning - Only show if all feeds in last 6h are one side */}
        {breastfeedBalance.showWarning && (
          <div className="bg-amber-900 border border-amber-700 rounded-xl p-4">
            <p className="text-gray-300 text-sm mb-2">
              {breastfeedBalance.lastFeedText} • Last 6h: L:{breastfeedBalance.leftCount} R:{breastfeedBalance.rightCount}
            </p>
            <p className="text-amber-300 font-semibold text-sm">
              ⚠️ {breastfeedBalance.recommendation}
            </p>
          </div>
        )}

        {/* Key Metrics - 2x2 Grid */}
        <MetricCards logs={todayLogs} allLogs={logs} />

        {/* Recent Activity Feed */}
        <RecentLogs logs={todayLogs} />

        {/* Environment Toggle (Franklin only) — bottom of page content */}
        {identity === 'Franklin' && (
          <div className="flex justify-center py-6">
            <EnvironmentToggle identity={identity} />
          </div>
        )}
      </div>

      {/* Normal Check Answer Sheet */}
      {normalCheckAnswer && (
        <NormalCheckSheet
          answer={normalCheckAnswer}
          onClose={() => setNormalCheckAnswer(null)}
        />
      )}
    </div>
  );
}
