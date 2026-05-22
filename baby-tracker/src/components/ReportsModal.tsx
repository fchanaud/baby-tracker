'use client';

import { useState } from 'react';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportsModal({ isOpen, onClose }: ReportsModalProps) {
  const [query, setQuery] = useState('');
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      setError('Failed to generate report. Please try again.');
      console.error('Report error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setQuery('');
    setReport(null);
    setError(null);
    onClose();
  };

  const exampleQuestions = [
    "How many times did she feed yesterday?",
    "Show me sleep trend this week",
    "What's the average time between feeds today?",
    "How many wet nappies in the last 24 hours?"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold">📊 Reports</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              Ask any question about your baby's activity logs. Examples:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-blue-700">
              {exampleQuestions.map((q, i) => (
                <li key={i} className="flex items-start">
                  <span className="mr-2">•</span>
                  <button
                    onClick={() => setQuery(q)}
                    className="text-left hover:underline"
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                Your Question
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., How many feeds today?"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {isLoading ? '⏳ Generating...' : '✨ Generate Report'}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Report Result */}
          {report && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-semibold text-green-900 mb-2">Report:</h3>
              <p className="text-green-800 whitespace-pre-wrap">{report}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
