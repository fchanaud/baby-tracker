'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Identity } from '@/hooks/useIdentity';

interface NavbarProps {
  identity: Identity;
  onSwitchIdentity: () => void;
}

export default function Navbar({ identity, onSwitchIdentity }: NavbarProps) {
  const pathname = usePathname();

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between max-w-2xl mx-auto mb-3">
        <Link href="/profile" className="text-2xl font-bold hover:text-blue-400 transition-colors">
          👶 Baby Tracker
        </Link>
        <button
          onClick={onSwitchIdentity}
          className="text-sm text-gray-400 hover:text-gray-200 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors min-h-[48px]"
        >
          Switch ({identity})
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex gap-2 max-w-2xl mx-auto">
        <Link
          href="/"
          className={`flex-1 text-center py-2 px-3 rounded-lg transition-colors min-h-[48px] flex items-center justify-center font-medium text-sm ${
            pathname === '/'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          }`}
        >
          Dashboard
        </Link>
        <Link
          href="/activity"
          className={`flex-1 text-center py-2 px-3 rounded-lg transition-colors min-h-[48px] flex items-center justify-center font-medium text-sm ${
            pathname === '/activity'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          }`}
        >
          Activity
        </Link>
        <Link
          href="/insights"
          className={`flex-1 text-center py-2 px-3 rounded-lg transition-colors min-h-[48px] flex items-center justify-center font-medium text-sm ${
            pathname === '/insights'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          }`}
        >
          Insights
        </Link>
      </div>
    </div>
  );
}
