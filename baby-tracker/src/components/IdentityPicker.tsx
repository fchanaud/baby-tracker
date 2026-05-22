'use client';

import { Identity } from '@/hooks/useIdentity';

interface IdentityPickerProps {
  onSelect: (identity: Identity) => void;
}

export default function IdentityPicker({ onSelect }: IdentityPickerProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2">Baby Tracker</h1>
        <p className="text-gray-600 text-center mb-8">Who are you?</p>

        <div className="space-y-4">
          <button
            onClick={() => onSelect('Franklin')}
            className="w-full h-20 bg-blue-500 hover:bg-blue-600 text-white text-2xl font-semibold rounded-xl transition-colors active:scale-95"
          >
            Franklin
          </button>

          <button
            onClick={() => onSelect('Clémence')}
            className="w-full h-20 bg-pink-500 hover:bg-pink-600 text-white text-2xl font-semibold rounded-xl transition-colors active:scale-95"
          >
            Clémence
          </button>
        </div>
      </div>
    </div>
  );
}
