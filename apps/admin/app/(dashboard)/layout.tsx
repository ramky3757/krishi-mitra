import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/dashboard', label: '📊 Dashboard', icon: '📊' },
  { href: '/kyc', label: '🪪 KYC Review', icon: '🪪' },
  { href: '/listings', label: '🌾 Listings', icon: '🌾' },
  { href: '/bookings', label: '📦 Bookings', icon: '📦' },
  { href: '/users', label: '👥 Users', icon: '👥' },
  { href: '/disputes', label: '⚖️ Disputes', icon: '⚖️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium"
            >
              <span>{item.icon}</span>
              <span>{item.label.split(' ').slice(1).join(' ')}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-brand-600">
          <p className="text-brand-300 text-xs">Krishi Mitra v1.0.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
