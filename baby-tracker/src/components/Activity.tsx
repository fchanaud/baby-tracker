'use client';

import { useState } from 'react';
import { useIdentity } from '@/hooks/useIdentity';
import { useLogs } from '@/hooks/useLogs';
import IdentityPicker from './IdentityPicker';
import Navbar from './Navbar';
import RollingTimeline from './RollingTimeline';
import ActivityBottomSheet from './ActivityBottomSheet';
import type { Log } from '@/lib/types';

export default function Activity() {
  const { identity, setIdentity, isLoading: identityLoading } = useIdentity();
  const { logs } = useLogs();
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

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
        {/* Rolling Timeline */}
        <RollingTimeline logs={logs} onActivityTap={setSelectedLog} />
      </div>

      {/* Activity Detail Bottom Sheet */}
      <ActivityBottomSheet log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
