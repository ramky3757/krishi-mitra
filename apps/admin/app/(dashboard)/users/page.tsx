export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';


async function getUsers() {
  const { data } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
}

const ROLE_COLORS: Record<string, string> = {
  farmer: 'bg-green-100 text-green-700',
  consumer: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700',
};

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 text-sm mt-1">{users.length} registered users</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Name</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Email</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Phone</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Role</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">No users yet</td></tr>
            ) : users.map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{u.full_name || '—'}</td>
                <td className="px-5 py-3 text-gray-600">{u.email || '—'}</td>
                <td className="px-5 py-3 text-gray-600">{u.phone || '—'}</td>
                <td className="px-5 py-3">
                  {u.role ? (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  ) : <span className="text-gray-400 text-xs">—</span>}
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
