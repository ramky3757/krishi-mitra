'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function ListingApprovalActions({ listingId }: { listingId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const update = async (status: 'active' | 'cancelled') => {
    setIsLoading(true);
    await supabase.from('crop_listings').update({ status }).eq('id', listingId);
    setDone(status === 'active' ? 'approved' : 'rejected');
    setIsLoading(false);
  };

  if (done) {
    return (
      <div className={`rounded-xl p-3 text-sm font-medium ${done === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
        {done === 'approved' ? '✅ Listing approved and live' : '❌ Listing rejected'}
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => update('active')}
        disabled={isLoading}
        className="flex-1 bg-brand-700 text-white rounded-xl py-2.5 font-semibold hover:bg-brand-800 transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : '✅ Approve & Publish'}
      </button>
      <button
        onClick={() => update('cancelled')}
        disabled={isLoading}
        className="px-5 border border-red-300 text-red-600 rounded-xl py-2.5 font-semibold hover:bg-red-50 transition-colors"
      >
        ❌ Reject
      </button>
    </div>
  );
}
