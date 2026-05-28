export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ListingRowActions from '@/components/ListingRowActions';

const STATUS_TABS = [
  { value: 'active', label: '🟢 Active', emoji: '🟢' },
  { value: 'fully_booked', label: '📦 Fully Booked', emoji: '📦' },
  { value: 'harvested', label: '🌾 Harvested', emoji: '🌾' },
  { value: 'completed', label: '✅ Completed', emoji: '✅' },
  { value: 'archived', label: '📁 Archived', emoji: '📁' },
  { value: 'cancelled', label: '❌ Cancelled', emoji: '❌' },
  { value: 'pending_approval', label: '⏳ Pending', emoji: '⏳' },
] as const;

type StatusValue = typeof STATUS_TABS[number]['value'];

async function getListings(status: StatusValue) {
  const { data } = await supabase
    .from('crop_listings')
    .select('*, farmer:users!farmer_id(*), media:listing_media(*)')
    .eq('status', status)
    .order('created_at', { ascending: false });
  return data ?? [];
}

async function getCounts() {
  const { data } = await supabase
    .from('crop_listings')
    .select('status');
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[(row as any).status] = (counts[(row as any).status] ?? 0) + 1;
  }
  return counts;
}

export default async function ManageListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const activeStatus: StatusValue = (STATUS_TABS.find((t) => t.value === params.status)?.value ?? 'active');

  const [listings, counts] = await Promise.all([getListings(activeStatus), getCounts()]);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Manage Listings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Filter, archive, re-list, or delete crop listings across the platform.
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {STATUS_TABS.map((t) => {
          const isActive = activeStatus === t.value;
          const count = counts[t.value] ?? 0;
          return (
            <Link
              key={t.value}
              href={`/manage-listings?status=${t.value}`}
              className={`flex items-center gap-1.5 rounded-full px-3.5 h-9 border whitespace-nowrap text-sm font-semibold ${
                isActive
                  ? 'bg-brand-700 border-brand-700 text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{t.label}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Listings */}
      {listings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-600 font-semibold">No {activeStatus.replace('_', ' ')} listings</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l: any) => (
            <div key={l.id} className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5">
              <div className="flex items-start gap-4 flex-wrap">
                {/* Hero */}
                <div className="w-16 h-16 bg-brand-100 rounded-xl flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                  {l.media?.[0]?.url
                    ? <img src={l.media[0].url} alt="" className="w-full h-full object-cover" />
                    : <span>🌿</span>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-gray-900">{l.crop_name}</h3>
                    {l.crop_variety && <span className="text-gray-500 text-sm">· {l.crop_variety}</span>}
                  </div>
                  <p className="text-gray-500 text-xs">
                    by {l.farmer?.full_name ?? l.farmer?.email ?? '—'} · {l.district}, {l.state}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-600">
                    <span>📦 {l.available_qty_kg} kg</span>
                    <span>🌾 {l.booked_qty_kg ?? 0} kg booked</span>
                    <span>💰 ₹{l.price_per_kg_final}/kg</span>
                    {l.harvest_date && <span>📅 {new Date(l.harvest_date).toLocaleDateString()}</span>}
                  </div>
                </div>

                {/* Actions */}
                <ListingRowActions
                  listingId={l.id}
                  currentStatus={l.status}
                  cropName={l.crop_name}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
