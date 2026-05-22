'use client';

import { useState } from 'react';
import { useIdentity } from '@/hooks/useIdentity';
import { useLogs } from '@/hooks/useLogs';
import { getAlerts } from '@/lib/alerts';
import { Log } from '@/lib/types';
import IdentityPicker from './IdentityPicker';
import VoiceInput from './VoiceInput';
import AlertBanner from './AlertBanner';
import MetricCards from './MetricCards';
import DurationBarTimeline from './DurationBarTimeline';
import LogDetailModal from './LogDetailModal';

export default function Dashboard() {
  const { identity, setIdentity, isLoading: identityLoading } = useIdentity();
  const { logs, refresh } = useLogs();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  // Show identity picker if not set
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

  // Calculate alerts
  const alert = getAlerts(logs);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">Baby Tracker</h1>
          <button
            onClick={() => setIdentity(null)}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Switch User
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Alert Banner */}
        {alert && <AlertBanner alert={alert} />}

        {/* Voice Input */}
        <VoiceInput identity={identity} onLogCreated={refresh} />

        {/* Metrics */}
        <MetricCards logs={logs} />

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

        {/* Detail Modal */}
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />

        {/* User Info */}
        <div className="text-center text-sm text-gray-500 pb-4">
          Logged in as <span className="font-semibold">{identity}</span>
        </div>
      </div>
    </div>
  );
}
