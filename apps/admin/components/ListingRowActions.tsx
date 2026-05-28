'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteListing, setListingStatus } from '@/app/actions';

type Status =
  | 'draft' | 'pending_approval' | 'active' | 'fully_booked'
  | 'harvested' | 'completed' | 'cancelled' | 'archived';

export default function ListingRowActions({
  listingId,
  currentStatus,
  cropName,
}: {
  listingId: string;
  currentStatus: Status;
  cropName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function changeStatus(next: Parameters<typeof setListingStatus>[1]) {
    startTransition(async () => {
      try {
        await setListingStatus(listingId, next);
        router.refresh();
      } catch (e: any) {
        alert(e?.message ?? 'Failed to change status');
      }
    });
  }

  function onDelete() {
    if (!confirmingDelete) { setConfirmingDelete(true); return; }
    startTransition(async () => {
      try {
        await deleteListing(listingId);
        router.refresh();
      } catch (e: any) {
        alert(e?.message ?? 'Failed to delete');
        setConfirmingDelete(false);
      }
    });
  }

  // Status → suggested actions
  const actions: Array<{ label: string; status: Parameters<typeof setListingStatus>[1]; className: string }> = [];

  if (currentStatus === 'active') {
    actions.push(
      { label: 'Mark Fully Booked', status: 'fully_booked', className: 'text-blue-700 hover:bg-blue-50' },
      { label: 'Archive', status: 'archived', className: 'text-gray-700 hover:bg-gray-100' },
    );
  }
  if (currentStatus === 'fully_booked') {
    actions.push(
      { label: 'Re-open', status: 'active', className: 'text-green-700 hover:bg-green-50' },
      { label: 'Archive', status: 'archived', className: 'text-gray-700 hover:bg-gray-100' },
    );
  }
  if (currentStatus === 'archived') {
    actions.push(
      { label: 'Reactivate', status: 'active', className: 'text-green-700 hover:bg-green-50' },
    );
  }
  if (currentStatus === 'harvested') {
    actions.push(
      { label: 'Mark Completed', status: 'completed', className: 'text-green-700 hover:bg-green-50' },
    );
  }
  if (currentStatus === 'cancelled') {
    actions.push(
      { label: 'Restore', status: 'active', className: 'text-green-700 hover:bg-green-50' },
    );
  }

  return (
    <div className="flex gap-1.5 items-center flex-wrap">
      {actions.map((a) => (
        <button
          key={a.status}
          onClick={() => changeStatus(a.status)}
          disabled={pending}
          className={`text-xs px-2.5 py-1 rounded-md font-medium border border-current/20 ${a.className}`}
        >
          {pending ? '…' : a.label}
        </button>
      ))}

      <button
        onClick={onDelete}
        disabled={pending}
        title={confirmingDelete ? `Click again to delete "${cropName}"` : 'Delete this listing'}
        className={`text-xs px-2.5 py-1 rounded-md font-medium ${
          confirmingDelete ? 'bg-red-600 text-white hover:bg-red-700' : 'text-red-600 hover:bg-red-50'
        }`}
      >
        {pending && confirmingDelete ? '…' : confirmingDelete ? 'Confirm delete' : 'Delete'}
      </button>

      {confirmingDelete && !pending && (
        <button
          onClick={() => setConfirmingDelete(false)}
          className="text-xs px-2 py-1 rounded-md text-gray-400 hover:bg-gray-50"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
