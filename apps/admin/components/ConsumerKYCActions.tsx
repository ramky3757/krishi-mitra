'use client';

import { useState } from 'react';
import { approveConsumerKYC, rejectConsumerKYC } from '@/app/actions';

export function ConsumerKYCActions({ consumerId }: { consumerId: string }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await approveConsumerKYC(consumerId);
      setDone(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) return;
    setIsLoading(true);
    try {
      await rejectConsumerKYC(consumerId, rejectionReason);
      setDone(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 font-medium text-sm">✅ Action completed. Refresh to see updates.</div>;
  }

  return (
    <div>
      <div className="flex gap-3">
        {!showReject && (
          <>
            <button onClick={handleApprove} disabled={isLoading} className="flex-1 bg-brand-700 text-white rounded-xl py-2.5 font-semibold hover:bg-brand-800 disabled:opacity-50">
              {isLoading ? 'Processing…' : '✅ Approve'}
            </button>
            <button onClick={() => setShowReject(true)} className="px-5 border border-red-300 text-red-600 rounded-xl py-2.5 font-semibold hover:bg-red-50">
              ❌ Reject
            </button>
          </>
        )}
      </div>

      {showReject && (
        <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-semibold text-red-800 mb-2">Rejection Reason *</p>
          <textarea
            className="w-full border border-red-300 rounded-lg p-3 text-sm text-gray-900 mb-3"
            rows={3}
            placeholder="Explain why this KYC is rejected (will be shared with consumer)…"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={() => setShowReject(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium">Cancel</button>
            <button onClick={handleReject} disabled={!rejectionReason || isLoading} className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50">
              {isLoading ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
