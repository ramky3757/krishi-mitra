export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';

async function getStats() {
  const [users, listings, bookings, kycPending] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact' }),
    supabase.from('crop_listings').select('id, status', { count: 'exact' }),
    supabase.from('bookings').select('id, status, total_amount'),
    supabase.from('farmer_profiles').select('user_id', { count: 'exact' }).eq('kyc_status', 'under_review'),
  ]);

  const totalRevenue = (bookings.data ?? []).reduce((s, b) => s + (b.total_amount ?? 0), 0);
  const activeListings = (listings.data ?? []).filter((l) => l.status === 'active').length;

  return {
    totalUsers: users.count ?? 0,
    activeListings,
    totalBookings: bookings.count ?? 0,
    totalRevenue,
    kycPending: kycPending.count ?? 0,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">HarvestBond platform overview</p>

      {/* KYC alert */}
      {stats.kycPending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="font-semibold text-amber-800">{stats.kycPending} KYC application{stats.kycPending !== 1 ? 's' : ''} pending review</p>
            <a href="/kyc" className="text-amber-600 text-sm underline">Review now →</a>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard icon="👥" label="Total Users" value={stats.totalUsers.toLocaleString()} color="blue" />
        <StatCard icon="🌾" label="Active Listings" value={stats.activeListings.toLocaleString()} color="green" />
        <StatCard icon="📦" label="Total Bookings" value={stats.totalBookings.toLocaleString()} color="purple" />
        <StatCard icon="💰" label="Platform Revenue" value={`₹${(stats.totalRevenue).toLocaleString()}`} color="teal" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <QuickLink href="/kyc" icon="🪪" title="KYC Queue" desc="Review farmer identity and land documents" badge={stats.kycPending} />
        <QuickLink href="/listings" icon="🌾" title="Listing Approvals" desc="Approve or reject new crop listings" />
        <QuickLink href="/disputes" icon="⚖️" title="Disputes" desc="Resolve farmer-consumer disputes" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    teal: 'bg-teal-50 border-teal-200',
  };
  return (
    <div className={`${colors[color]} border rounded-2xl p-5`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-gray-500 text-sm mt-0.5">{label}</div>
    </div>
  );
}

function QuickLink({ href, icon, title, desc, badge }: { href: string; icon: string; title: string; desc: string; badge?: number }) {
  return (
    <a href={href} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-brand-300 hover:bg-brand-50 transition-colors block">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="font-semibold text-gray-900">{title}</span>
        {badge ? (
          <span className="ml-auto bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{badge}</span>
        ) : null}
      </div>
      <p className="text-gray-500 text-sm">{desc}</p>
    </a>
  );
}
