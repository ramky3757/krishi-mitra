'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createUser } from '@/app/actions';

export default function NewUserPage() {
  const [method, setMethod] = useState<'invite' | 'password'>('invite');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError('');
    setLoading(true);
    try {
      formData.set('method', method);
      await createUser(formData);
    } catch (e: any) {
      // redirect() throws NEXT_REDIRECT, swallow it
      if (e?.message?.includes('NEXT_REDIRECT')) return;
      setError(e?.message ?? 'Failed to create user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/users" className="text-brand-700 text-sm hover:underline">← Back to Users</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-3 mb-1">Create User</h1>
      <p className="text-gray-500 text-sm mb-6">Add a new farmer, consumer, or admin to the platform.</p>

      <form action={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
        {/* Method toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account creation method</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMethod('invite')}
              className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                method === 'invite'
                  ? 'border-brand-700 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              📧 Email magic link
              <p className="text-xs font-normal mt-0.5 opacity-75">User clicks link to log in</p>
            </button>
            <button
              type="button"
              onClick={() => setMethod('password')}
              className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                method === 'password'
                  ? 'border-brand-700 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              🔑 Set password
              <p className="text-xs font-normal mt-0.5 opacity-75">User logs in with email + password</p>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select name="role" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-600">
            <option value="farmer">Farmer</option>
            <option value="consumer">Consumer</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
          <input name="full_name" type="text" placeholder="e.g. Ramesh Kumar" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
          <input name="email" type="email" required placeholder="user@example.com" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
          <input name="phone" type="tel" placeholder="+91 98765 43210" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
        </div>

        {method === 'password' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temporary password <span className="text-red-500">*</span></label>
            <input name="password" type="text" minLength={6} required={method === 'password'} placeholder="At least 6 characters" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 font-mono" />
            <p className="text-xs text-gray-400 mt-1">Share this with the user. They can change it later from their profile.</p>
          </div>
        )}

        {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-700 hover:bg-brand-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {loading ? 'Creating…' : method === 'invite' ? 'Send Invite' : 'Create User'}
          </button>
          <Link href="/users" className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
