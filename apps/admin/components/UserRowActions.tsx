'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteUser, deleteFarmerListings, updateUserRole } from '@/app/actions';

const ROLES: Array<'farmer' | 'consumer' | 'admin'> = ['farmer', 'consumer', 'admin'];

type ConfirmKind = null | 'delete-user' | 'delete-listings';

export default function UserRowActions({
  userId,
  email,
  currentRole,
}: {
  userId: string;
  email: string;
  currentRole: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<ConfirmKind>(null);
  const [editingRole, setEditingRole] = useState(false);

  function onDeleteUser() {
    if (confirming !== 'delete-user') { setConfirming('delete-user'); return; }
    startTransition(async () => {
      try {
        await deleteUser(userId);
        router.refresh();
      } catch (e: any) {
        alert(e?.message ?? 'Failed to delete user');
        setConfirming(null);
      }
    });
  }

  function onDeleteListings() {
    if (confirming !== 'delete-listings') { setConfirming('delete-listings'); return; }
    startTransition(async () => {
      try {
        const result = await deleteFarmerListings(userId);
        alert(`Removed ${result.deletedListings} listing${result.deletedListings !== 1 ? 's' : ''} for ${email}.`);
        setConfirming(null);
        router.refresh();
      } catch (e: any) {
        alert(e?.message ?? 'Failed to delete listings');
        setConfirming(null);
      }
    });
  }

  function onRoleChange(role: 'farmer' | 'consumer' | 'admin') {
    startTransition(async () => {
      try {
        await updateUserRole(userId, role);
        setEditingRole(false);
        router.refresh();
      } catch (e: any) {
        alert(e?.message ?? 'Failed to update role');
      }
    });
  }

  const isFarmer = currentRole === 'farmer';

  return (
    <div className="flex gap-2 items-center justify-end flex-wrap">
      {editingRole ? (
        <div className="flex gap-1">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => onRoleChange(r)}
              disabled={pending || r === currentRole}
              className={`text-xs px-2 py-1 rounded-md font-medium ${
                r === currentRole
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
              }`}
            >
              {r}
            </button>
          ))}
          <button
            onClick={() => setEditingRole(false)}
            className="text-xs px-2 py-1 rounded-md text-gray-400 hover:bg-gray-50"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditingRole(true)}
          className="text-xs px-2.5 py-1 rounded-md text-gray-500 hover:bg-gray-100 font-medium"
          disabled={pending}
        >
          Change role
        </button>
      )}

      {/* Delete listings — only shown for farmers */}
      {isFarmer && (
        <button
          onClick={onDeleteListings}
          disabled={pending}
          title={confirming === 'delete-listings' ? `Delete all crops for ${email}?` : 'Remove all listings for this farmer'}
          className={`text-xs px-2.5 py-1 rounded-md font-medium ${
            confirming === 'delete-listings'
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          {pending && confirming === 'delete-listings' ? '…'
            : confirming === 'delete-listings' ? 'Confirm: delete listings'
            : 'Delete listings'}
        </button>
      )}

      {/* Delete user */}
      <button
        onClick={onDeleteUser}
        disabled={pending}
        title={confirming === 'delete-user' ? `Click again to delete ${email}` : 'Delete this user account entirely'}
        className={`text-xs px-2.5 py-1 rounded-md font-medium ${
          confirming === 'delete-user'
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'text-red-600 hover:bg-red-50'
        }`}
      >
        {pending && confirming === 'delete-user' ? '…'
          : confirming === 'delete-user' ? 'Confirm delete'
          : 'Delete user'}
      </button>

      {confirming && !pending && (
        <button
          onClick={() => setConfirming(null)}
          className="text-xs px-2 py-1 rounded-md text-gray-400 hover:bg-gray-50"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
