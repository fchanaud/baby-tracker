'use client';

import { useEffect } from 'react';

interface NormalCheckSheetProps {
  answer: string;
  onClose: () => void;
}

export default function NormalCheckSheet({ answer, onClose }: NormalCheckSheetProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          {/* Handle bar */}
          <div className="flex justify-center">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-center">Everything Normal?</h2>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-gray-900 leading-relaxed">{answer}</p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-xl py-3 transition-colors min-h-[48px]"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
