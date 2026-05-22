'use client';

import { useState, useMemo } from 'react';
import { useIdentity } from '@/hooks/useIdentity';
import { useLogs } from '@/hooks/useLogs';
import { getAlerts, getSideAlternationSuggestion } from '@/lib/alerts';
import { Log } from '@/lib/types';
import IdentityPicker from './IdentityPicker';
import VoiceInput from './VoiceInput';
import AlertBanner from './AlertBanner';
import MetricCards from './MetricCards';
import DurationBarTimeline from './DurationBarTimeline';
import LogDetailModal from './LogDetailModal';
import RecentLogs from './RecentLogs';
import ReportsModal from './ReportsModal';

export default function Dashboard() {
  const { identity, setIdentity, isLoading: identityLoading } = useIdentity();
  const { logs, refresh } = useLogs();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [showReportsModal, setShowReportsModal] = useState(false);

  // Check if selected date is today
  const isToday = useMemo(() => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  }, [selectedDate]);

  // Filter logs by selected date
  const filteredLogs = useMemo(() => {
    const dateStart = new Date(selectedDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(selectedDate);
    dateEnd.setHours(23, 59, 59, 999);

    return logs.filter(log => {
      const logDate = new Date(log.logged_at);
      return logDate >= dateStart && logDate <= dateEnd;
    });
  }, [logs, selectedDate]);

  // Calculate alerts for selected date (or all logs if today for "no feed" check)
  const alert = useMemo(() => {
    return getAlerts(isToday ? logs : filteredLogs, selectedDate);
  }, [logs, filteredLogs, selectedDate, isToday]);

  // Get side alternation suggestion
  const sideAlternation = useMemo(() => {
    return getSideAlternationSuggestion(logs);
  }, [logs]);

  // Show identity picker if not set (after all hooks)
  if (identityLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">👶</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <IdentityPicker onSelect={setIdentity} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">Baby Tracker</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowReportsModal(true)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              📊 Reports
            </button>
            <button
              onClick={() => setIdentity(null)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Switch User
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Alert Banner */}
        {alert && <AlertBanner alert={alert} />}

        {/* Side Alternation Prompt */}
        {sideAlternation && isToday && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-purple-800 font-semibold text-center">
              🤱 {sideAlternation}
            </p>
          </div>
        )}

        {/* Voice Input (only show for today) */}
        {isToday && <VoiceInput identity={identity} onLogCreated={refresh} />}

        {/* Metrics */}
        <MetricCards logs={filteredLogs} allLogs={logs} selectedDate={selectedDate} isToday={isToday} />

        {/* Duration Bar Timeline */}
        <DurationBarTimeline
          logs={logs}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onBarClick={(log) => {
            setSelectedLog(log);
          }}
          onBarLongPress={(log) => {
            setSelectedLog(log);
          }}
        />

        {/* Recent Logs */}
        <RecentLogs logs={filteredLogs} />

        {/* Detail Modal */}
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />

        {/* Reports Modal */}
        <ReportsModal
          isOpen={showReportsModal}
          onClose={() => setShowReportsModal(false)}
        />

        {/* User Info */}
        <div className="text-center text-sm text-gray-500 pb-4">
          Logged in as <span className="font-semibold">{identity}</span>
        </div>
      </div>
    </div>
  );
}
