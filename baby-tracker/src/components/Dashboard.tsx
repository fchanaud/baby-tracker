'use client';

import { useState, useMemo, useEffect } from 'react';
import { useIdentity } from '@/hooks/useIdentity';
import { useLogs } from '@/hooks/useLogs';
import { useBabyProfile } from '@/hooks/useBabyProfile';
import {
  evaluateFeedsMetric,
  evaluateNappiesMetric,
  evaluateSleepMetric,
  evaluateTimeAwakeMetric,
  getMostUrgentAlert,
} from '@/lib/nhs-thresholds';
import IdentityPicker from './IdentityPicker';
import ActivityForm from './ActivityForm';
import ActivityButtons from './ActivityButtons';
import AlertBanner from './AlertBanner';
import MetricCards from './MetricCards';
import RecentLogs from './RecentLogs';
import Navbar from './Navbar';

export default function Dashboard() {
  const { identity, setIdentity, isLoading: identityLoading } = useIdentity();
  const { logs, refresh } = useLogs();
  const { profile } = useBabyProfile();
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<'feed' | 'sleep' | 'nappy' | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Reset alert dismissed state when returning to dashboard
  useEffect(() => {
    setAlertDismissed(false);
  }, []);

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

  // Evaluate all metrics to get most urgent alert
  const urgentAlert = useMemo(() => {
    const feedsStatus = evaluateFeedsMetric(todayLogs, logs);
    const nappiesStatus = evaluateNappiesMetric(todayLogs, profile?.dateOfBirth);
    const sleepStatus = evaluateSleepMetric(todayLogs, logs, profile?.dateOfBirth);
    const awakeStatus = evaluateTimeAwakeMetric(logs);

    const message = getMostUrgentAlert(feedsStatus, nappiesStatus, sleepStatus, awakeStatus);

    return message ? { type: 'urgent' as const, message, severity: 'warning' as const } : null;
  }, [todayLogs, logs, profile?.dateOfBirth]);

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
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 pb-20">
      <Navbar identity={identity} onSwitchIdentity={() => setIdentity(null)} />

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
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

        {/* Alert Banner (only when urgent red alerts) */}
        <AlertBanner
          alert={urgentAlert}
          dismissed={alertDismissed}
          onDismiss={() => setAlertDismissed(true)}
        />

        {/* Activity Buttons */}
        <ActivityButtons onActivitySelect={handleActivitySelect} />

        {/* Key Metrics - 2x2 Grid */}
        <MetricCards logs={todayLogs} allLogs={logs} />

        {/* Recent Activity Feed */}
        <RecentLogs logs={todayLogs} />
      </div>
    </div>
  );
}
