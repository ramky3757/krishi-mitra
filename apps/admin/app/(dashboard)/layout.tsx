import Link from 'next/link';
import { getAdminSession } from '@/lib/supabase-auth';
import { signOut } from '@/app/actions';

const NAV_ITEMS = [
  { href: '/dashboard', label: '📊 Dashboard' },
  { href: '/kyc', label: '🪪 KYC Review' },
  { href: '/listings', label: '🌾 Listings' },
  { href: '/bookings', label: '📦 Bookings' },
  { href: '/users', label: '👥 Users' },
  { href: '/disputes', label: '⚖️ Disputes' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  const displayName = session?.profile?.full_name || session?.profile?.email || 'Admin';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-700 text-white flex flex-col">
        <div className="p-6 border-b border-brand-600">
          <div className="text-2xl mb-1">🌾</div>
          <h1 className="text-xl font-bold">Krishi Mitra</h1>
          <p className="text-brand-300 text-xs mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const [icon, ...labelParts] = item.label.split(' ');
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium"
              >
                <span>{icon}</span>
                <span>{labelParts.join(' ')}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile + Logout */}
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

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
