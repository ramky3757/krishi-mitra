'use client';

import { useState } from 'react';
import { approveListing, rejectListing, editListing } from '@/app/actions';

interface EditableFields {
  available_qty_kg: number;
  price_per_kg_advance: number;
  price_per_kg_final: number;
  harvest_date: string;
  admin_notes: string;
}

export function ListingApprovalActions({
  listingId,
  listing,
}: {
  listingId: string;
  listing: any;
}) {
  const [mode, setMode] = useState<'default' | 'reject' | 'edit'>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [edit, setEdit] = useState<EditableFields>({
    available_qty_kg: listing.available_qty_kg ?? 0,
    price_per_kg_advance: listing.price_per_kg_advance ?? 0,
    price_per_kg_final: listing.price_per_kg_final ?? 0,
    harvest_date: listing.harvest_date ?? '',
    admin_notes: listing.admin_notes ?? '',
  });

  const approve = async () => {
    setIsLoading(true);
    try {
      await approveListing(listingId);
      setDone('approved');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) return;
    setIsLoading(true);
    try {
      await rejectListing(listingId, rejectReason.trim());
      setDone('rejected');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEdits = async () => {
    if (!edit.admin_notes.trim()) {
      alert('A rationale note is required when editing a listing.');
      return;
    }
    setIsLoading(true);
    try {
      await editListing(listingId, edit);
      setMode('default');
      setDone('edited');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (done === 'approved') {
    return <div className="rounded-xl p-3 text-sm font-medium bg-green-50 text-green-700">✅ Listing approved and live</div>;
  }
  if (done === 'rejected') {
    return <div className="rounded-xl p-3 text-sm font-medium bg-red-50 text-red-700">❌ Listing rejected</div>;
  }

  if (mode === 'reject') {
    return (
      <div className="space-y-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-red-800 text-sm font-semibold mb-2">Rejection Reason *</p>
          <textarea
            className="w-full border border-red-200 rounded-lg p-2 text-sm text-gray-800 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
            placeholder="Explain why this listing is being rejected (visible to farmer)…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMode('default')} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button
            onClick={reject}
            disabled={isLoading || !rejectReason.trim()}
            className="flex-1 bg-red-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Rejecting…' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'edit') {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-amber-800 text-sm font-semibold">Admin Edit Mode</p>
          <p className="text-amber-700 text-xs mt-0.5">Override the farmer's values. A rationale note is required.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <EditField label="Available Qty (kg)" type="number" value={String(edit.available_qty_kg)} onChange={(v) => setEdit((e) => ({ ...e, available_qty_kg: parseFloat(v) || 0 }))} />
          <EditField label="Advance Price ₹/kg" type="number" value={String(edit.price_per_kg_advance)} onChange={(v) => setEdit((e) => ({ ...e, price_per_kg_advance: parseFloat(v) || 0 }))} />
          <EditField label="Final Price ₹/kg" type="number" value={String(edit.price_per_kg_final)} onChange={(v) => setEdit((e) => ({ ...e, price_per_kg_final: parseFloat(v) || 0 }))} />
          <EditField label="Harvest Date" type="date" value={edit.harvest_date} onChange={(v) => setEdit((e) => ({ ...e, harvest_date: v }))} />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-1">Admin Rationale *</label>
          <textarea
            className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm text-gray-800 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400"
            placeholder="Explain the reason for adjusting these values…"
            value={edit.admin_notes}
            onChange={(e) => setEdit((prev) => ({ ...prev, admin_notes: e.target.value }))}
          />
        </div>

        {done === 'edited' && <div className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">✏️ Changes saved</div>}

        <div className="flex gap-2">
          <button onClick={() => setMode('default')} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button
            onClick={saveEdits}
            disabled={isLoading || !edit.admin_notes.trim()}
            className="flex-1 bg-brand-700 text-white rounded-xl py-2 text-sm font-semibold hover:bg-brand-800 disabled:opacity-50"
          >
            {isLoading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <button onClick={() => setMode('edit')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">✏️ Edit Details</button>
      <button onClick={approve} disabled={isLoading} className="flex-1 bg-brand-700 text-white rounded-xl py-2.5 font-semibold hover:bg-brand-800 disabled:opacity-50 text-sm">
        {isLoading ? 'Processing…' : '✅ Approve & Publish'}
      </button>
      <button onClick={() => setMode('reject')} className="px-4 border border-red-300 text-red-600 rounded-xl py-2.5 font-semibold hover:bg-red-50 text-sm">❌ Reject</button>
    </div>
  );
}

function EditField({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-gray-600 text-xs font-semibold mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-400" />
    </div>
  );
}
