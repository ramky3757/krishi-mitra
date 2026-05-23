import { supabase } from '@/lib/supabase';
import { ListingApprovalActions } from '@/components/ListingApprovalActions';

async function getPendingListings() {
  const { data } = await supabase
    .from('crop_listings')
    .select('*, farmer:farmer_profiles(*, user:users(*)), media:listing_media(*)')
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: true });
  return data ?? [];
}

export default async function ListingsPage() {
  const listings = await getPendingListings();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing Approvals</h1>
      <p className="text-gray-500 mb-8">{listings.length} listing{listings.length !== 1 ? 's' : ''} pending approval</p>

      {listings.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-gray-600 font-semibold text-lg">No pending listings</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing: any) => (
            <div key={listing.id} className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{listing.crop_name}</h3>
                  <p className="text-gray-500 text-sm">by {listing.farmer?.user?.full_name} · {listing.district}, {listing.state}</p>
                </div>
                <span className="bg-amber-100 text-amber-700 text-sm font-semibold px-3 py-1 rounded-full">Pending Approval</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 text-sm">
                <InfoItem label="Category" value={listing.crop_category} />
                <InfoItem label="Available Qty" value={`${listing.available_qty_kg} kg`} />
                <InfoItem label="Price/kg" value={`₹${listing.price_per_kg_final}`} />
                <InfoItem label="Harvest" value={listing.harvest_date} />
                <InfoItem label="Method" value={listing.farming_method} />
              </div>

              {listing.description && (
                <p className="text-gray-600 text-sm mb-4 p-3 bg-gray-50 rounded-xl">{listing.description}</p>
              )}

              {(listing.media ?? []).length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {listing.media.map((m: any) => (
                    <img key={m.id} src={m.url} alt="Farm" className="w-24 h-24 rounded-xl object-cover shrink-0" />
                  ))}
                </div>
              )}

              <ListingApprovalActions listingId={listing.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
