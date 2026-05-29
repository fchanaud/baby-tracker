'use client';

import { useState, useEffect } from 'react';
import { useIdentity } from '@/hooks/useIdentity';
import { getEnvironment } from '@/lib/supabase';
import IdentityPicker from './IdentityPicker';
import Navbar from './Navbar';

interface ConversationEntry {
  question: string;
  answer: string;
  timestamp: number;
}

export default function Insights() {
  const { identity, setIdentity, isLoading: identityLoading } = useIdentity();
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<ConversationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversation history from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('insightsHistory');
      if (saved) {
        try {
          setHistory(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load history:', e);
        }
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && history.length > 0) {
      localStorage.setItem('insightsHistory', JSON.stringify(history));
    }
  }, [history]);

  const handleAsk = async () => {
    if (!question.trim()) return;

    const currentQuestion = question.trim();
    setIsLoading(true);
    setQuestion(''); // Clear input immediately

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion,
          environment: getEnvironment()
        }),
      });

      const result = await response.json();

      const answerText = !response.ok
        ? `Error: ${result.error || 'Failed to get answer'}`
        : result.answer;

      // Add to history
      setHistory(prev => [...prev, {
        question: currentQuestion,
        answer: answerText,
        timestamp: Date.now(),
      }]);
    } catch (error) {
      console.error('Query error:', error);
      setHistory(prev => [...prev, {
        question: currentQuestion,
        answer: 'Failed to get answer. Please try again.',
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('insightsHistory');
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
        {/* Conversation History */}
        {history.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-100">Conversation</h2>
              <button
                onClick={handleClearHistory}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear history
              </button>
            </div>

            {history.map((entry, i) => (
              <div key={i} className="space-y-3">
                {/* Question */}
                <div className="bg-blue-900 border border-blue-700 rounded-xl p-3">
                  <p className="text-sm text-gray-400 mb-1">You asked:</p>
                  <p className="text-gray-100">{entry.question}</p>
                </div>

                {/* Answer */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-3">
                  <p className="text-sm text-gray-400 mb-1">Answer:</p>
                  <p className="text-gray-100 leading-relaxed whitespace-pre-wrap">
                    {entry.answer.replace(/\*\*/g, '')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Query Input Section */}
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

          {/* Example questions */}
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-500">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "How many feeds today?",
                "How many nappies today?",
                "Total sleep today?",
                "When was the last feed?",
                "Average time between feeds?",
                "Am I on track?",
                "Am I on track with nappies?",
                "On track with feeds?",
                "Show sleep trend this week",
                "How many feeds yesterday?",
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => setQuestion(example)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-full transition-colors"
                  disabled={isLoading}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
