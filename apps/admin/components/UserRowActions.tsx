'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteUser, updateUserRole } from '@/app/actions';

const ROLES: Array<'farmer' | 'consumer' | 'admin'> = ['farmer', 'consumer', 'admin'];

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
  const [confirming, setConfirming] = useState(false);
  const [editingRole, setEditingRole] = useState(false);

  function onDelete() {
    if (!confirming) { setConfirming(true); return; }
    startTransition(async () => {
      try {
        await deleteUser(userId);
        router.refresh();
      } catch (e: any) {
        alert(e?.message ?? 'Failed to delete');
        setConfirming(false);
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

  return (
    <div className="flex gap-2 items-center justify-end">
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

      <button
        onClick={onDelete}
        disabled={pending}
        title={confirming ? `Click again to delete ${email}` : 'Delete user'}
        className={`text-xs px-2.5 py-1 rounded-md font-medium ${
          confirming
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'text-red-600 hover:bg-red-50'
        }`}
      >
        {pending ? '…' : confirming ? 'Confirm delete' : 'Delete'}
      </button>

      {confirming && !pending && (
        <button
          onClick={() => setConfirming(false)}
          className="text-xs px-2 py-1 rounded-md text-gray-400 hover:bg-gray-50"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
