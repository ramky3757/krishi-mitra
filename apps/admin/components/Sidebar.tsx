'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { signOut } from '@/app/actions';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/kyc', icon: '🪪', label: 'KYC Review' },
  { href: '/listings', icon: '⏳', label: 'Approvals' },
  { href: '/manage-listings', icon: '🌾', label: 'All Listings' },
  { href: '/bookings', icon: '📦', label: 'Bookings' },
  { href: '/users', icon: '👥', label: 'Users' },
  { href: '/disputes', icon: '⚖️', label: 'Disputes' },
];

export default function Sidebar({ displayName, initials }: { displayName: string; initials: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar — only visible below md */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-brand-700 text-white px-4 py-3 shadow">
        <button
          onClick={() => setOpen(true)}
          className="text-2xl"
          aria-label="Open menu"
        >
          ☰
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">🌾</span>
          <span className="font-bold">Krishi Mitra</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
      </div>

      {/* Backdrop on mobile */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-brand-700 text-white flex flex-col
          transition-transform duration-200 ease-in-out
        `}
      >
        <div className="p-6 border-b border-brand-600 flex items-start justify-between">
          <div>
            <div className="text-2xl mb-1">🌾</div>
            <h1 className="text-xl font-bold">Krishi Mitra</h1>
            <p className="text-brand-300 text-xs mt-0.5">Admin Panel</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden text-white text-2xl"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                  isActive ? 'bg-white/15 text-white' : 'hover:bg-white/10'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-brand-600">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-brand-300 text-xs">Administrator</p>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full text-left px-4 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm text-brand-300 hover:text-white"
            >
              Sign out →
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
