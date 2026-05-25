'use client';

import { useState } from 'react';
import { useIdentity } from '@/hooks/useIdentity';
import { useLogs } from '@/hooks/useLogs';
import IdentityPicker from './IdentityPicker';
import Navbar from './Navbar';
import RollingTimeline from './RollingTimeline';
import ActivityBottomSheet from './ActivityBottomSheet';
import type { Log } from '@/lib/types';

export default function Reports() {
  const { identity, setIdentity, isLoading: identityLoading } = useIdentity();
  const { logs } = useLogs();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  const handleAsk = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    setAnswer('');

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        setAnswer(`Error: ${result.error || 'Failed to get answer'}`);
        return;
      }

      setAnswer(result.answer);
    } catch (error) {
      console.error('Query error:', error);
      setAnswer('Failed to get answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
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
        {/* Natural Language Query Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-100">Ask about your baby's data</h2>

          <div className="space-y-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., How many times did she feed yesterday?"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
              disabled={isLoading}
            />

            <button
              onClick={handleAsk}
              disabled={isLoading || !question.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl py-3 px-6 transition-colors min-h-[48px]"
            >
              {isLoading ? 'Thinking...' : 'Ask'}
            </button>
          </div>

          {/* Answer */}
          {answer && (
            <div className="mt-4 p-4 bg-gray-900 border border-gray-700 rounded-xl">
              <p className="text-gray-100 leading-relaxed whitespace-pre-wrap">{answer}</p>
            </div>
          )}

          {/* Example questions */}
          {!answer && !isLoading && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-500">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "How many feeds today?",
                  "Am I on track with nappies?",
                  "Show sleep trend this week",
                  "Average time between feeds?"
                ].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setQuestion(example)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-full transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rolling Timeline */}
        <RollingTimeline logs={logs} onActivityTap={setSelectedLog} />
      </div>

      {/* Activity Detail Bottom Sheet */}
      <ActivityBottomSheet log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
