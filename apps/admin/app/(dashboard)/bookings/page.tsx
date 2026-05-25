export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';


async function getBookings() {
  const { data } = await supabase
    .from('bookings')
    .select('*, listing:crop_listings(crop_name, district, state), consumer:users!consumer_id(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100);
  return data ?? [];
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-green-100 text-green-700',
  harvested: 'bg-teal-100 text-teal-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-200 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
  disputed: 'bg-red-100 text-red-700',
};

export default async function BookingsPage() {
  const bookings = await getBookings();

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-500 text-sm mt-1">{bookings.length} total bookings</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Consumer</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Crop</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Qty</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Amount</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bookings.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No bookings yet</td></tr>
            ) : bookings.map((b: any) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{b.consumer?.full_name ?? '—'}</p>
                  <p className="text-gray-400 text-xs">{b.consumer?.email ?? ''}</p>
                </td>
                <td className="px-5 py-3">
                  <p className="text-gray-900">{b.listing?.crop_name ?? '—'}</p>
                  <p className="text-gray-400 text-xs">{b.listing?.district}, {b.listing?.state}</p>
                </td>
                <td className="px-5 py-3 text-gray-700">{b.qty_kg} kg</td>
                <td className="px-5 py-3">
                  <p className="font-semibold text-gray-900">₹{b.total_amount?.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">Adv: ₹{b.advance_amount?.toLocaleString()}</p>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {b.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs">
                  {new Date(b.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
