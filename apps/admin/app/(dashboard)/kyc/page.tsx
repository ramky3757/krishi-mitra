export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';
import { KYCActions } from '@/components/KYCActions';
import { ConsumerKYCActions } from '@/components/ConsumerKYCActions';

async function getPendingFarmerKYC() {
  const { data } = await supabase
    .from('farmer_profiles')
    .select('*, user:users!user_id(*)')
    .in('kyc_status', ['pending', 'under_review'])
    .order('created_at', { ascending: true });
  return data ?? [];
}

async function getPendingConsumerKYC() {
  const { data } = await supabase
    .from('consumer_profiles')
    .select('*, user:users!user_id(*)')
    .eq('kyc_status', 'pending')
    .order('kyc_submitted_at', { ascending: true });
  return data ?? [];
}

export default async function KYCPage() {
  const [farmers, consumers] = await Promise.all([getPendingFarmerKYC(), getPendingConsumerKYC()]);

  const total = farmers.length + consumers.length;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">KYC Review Queue</h1>
      <p className="text-gray-500 mb-8">{total} application{total !== 1 ? 's' : ''} pending review</p>

      {total === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-gray-600 font-semibold text-lg">All caught up!</p>
          <p className="text-gray-400 text-sm mt-1">No pending KYC applications</p>
        </div>
      )}

      {farmers.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🧑‍🌾 Farmers ({farmers.length})</h2>
          <div className="space-y-4">
            {farmers.map((farmer: any) => (
              <div key={farmer.user_id} className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center text-2xl">🧑‍🌾</div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{farmer.user?.full_name}</h3>
                      <p className="text-gray-500 text-sm">{farmer.user?.email} · {farmer.user?.phone}</p>
                      <p className="text-gray-400 text-sm">📍 {farmer.village ? `${farmer.village}, ` : ''}{farmer.district}, {farmer.state}</p>
                    </div>
                  </div>
                  <span className="bg-amber-100 text-amber-700 text-sm font-semibold px-3 py-1 rounded-full">Pending</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  <DocCard label="Govt ID" url={farmer.id_doc_url} />
                  <DocCard label="Land Record" url={farmer.land_doc_url} />
                  <InfoCard label="Farm GPS" value={farmer.farm_geo_lat ? `${farmer.farm_geo_lat?.toFixed(4)}, ${farmer.farm_geo_lng?.toFixed(4)}` : 'Not provided'} hasValue={!!farmer.farm_geo_lat} />
                  <InfoCard label="Farm Address" value={farmer.farm_address ?? 'Not provided'} hasValue={!!farmer.farm_address} />
                </div>

                <KYCActions farmerId={farmer.user_id} />
              </div>
            ))}
          </div>
        </section>
      )}

      {consumers.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">🛒 Consumers ({consumers.length})</h2>
          <div className="space-y-4">
            {consumers.map((c: any) => (
              <div key={c.user_id} className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl">🛒</div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{c.user?.full_name ?? '—'}</h3>
                      <p className="text-gray-500 text-sm">{c.user?.email} · {c.user?.phone}</p>
                      {c.profession && <p className="text-gray-400 text-sm">💼 {c.profession}</p>}
                    </div>
                  </div>
                  <span className="bg-amber-100 text-amber-700 text-sm font-semibold px-3 py-1 rounded-full">Pending</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  <InfoCard label="Address" value={c.address_line ?? '—'} hasValue={!!c.address_line} />
                  <InfoCard label="City / District" value={[c.city, c.district].filter(Boolean).join(', ') || '—'} hasValue={!!c.city} />
                  <InfoCard label="State / Pincode" value={[c.state, c.pincode].filter(Boolean).join(' · ') || '—'} hasValue={!!c.state} />
                  <InfoCard label={c.government_id_type ?? 'Govt ID'} value={c.government_id_number ?? '—'} hasValue={!!c.government_id_number} />
                </div>

                {c.government_id_url && (
                  <div className="mb-4">
                    <DocCard label="ID Document" url={c.government_id_url} />
                  </div>
                )}

                <ConsumerKYCActions consumerId={c.user_id} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DocCard({ label, url }: { label: string; url?: string }) {
  return (
    <div className={`rounded-xl p-3 border ${url ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-green-700 font-semibold text-sm flex items-center gap-1">
          <span>✅</span> View Document
        </a>
      ) : (
        <p className="text-gray-400 text-sm">Not uploaded</p>
      )}
    </div>
  );
}

function InfoCard({ label, value, hasValue }: { label: string; value: string; hasValue: boolean }) {
  return (
    <div className={`rounded-xl p-3 border ${hasValue ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-medium ${hasValue ? 'text-blue-700' : 'text-gray-400'}`}>{value}</p>
    </div>
  );
}
