import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';

type AppUser = {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  role: string;
  created_at: string;
};

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'farmer' | 'consumer'>('all');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from('users')
      .select('id, full_name, phone, email, role, created_at')
      .order('created_at', { ascending: false });

    if (roleFilter !== 'all') query = query.eq('role', roleFilter);

    const { data, error } = await query;
    if (!error) setUsers((data ?? []) as AppUser[]);
    setIsLoading(false);
  }, [roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const onRefresh = async () => { setRefreshing(true); await fetchUsers(); setRefreshing(false); };

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          u.phone?.includes(search) ||
          u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-brand-700 pt-14 pb-4 px-5">
        <Text className="text-white text-xl font-bold">Admin — Users</Text>
        <Text className="text-brand-300 text-sm mt-0.5">{users.length} total users</Text>
      </View>

      {/* Search + filter */}
      <View className="bg-white border-b border-gray-100 px-4 py-3 gap-3">
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 gap-2">
          <Text>🔍</Text>
          <TextInput
            className="flex-1 py-3 text-gray-900"
            placeholder="Search by name, phone, email…"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <View className="flex-row gap-2">
          {(['all', 'farmer', 'consumer'] as const).map((r) => (
            <Pressable
              key={r}
              onPress={() => setRoleFilter(r)}
              className={`rounded-full px-4 py-1.5 ${roleFilter === r ? 'bg-brand-700' : 'bg-gray-100'}`}
            >
              <Text className={`text-sm font-medium capitalize ${roleFilter === r ? 'text-white' : 'text-gray-600'}`}>{r}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {isLoading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1a6b3c" size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filtered.length === 0 ? (
            <View className="items-center py-20">
              <Text className="text-5xl mb-3">👥</Text>
              <Text className="text-gray-600 font-semibold">No users found</Text>
            </View>
          ) : (
            filtered.map((user) => <UserRow key={user.id} user={user} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}

function UserRow({ user }: { user: AppUser }) {
  const roleColor =
    user.role === 'farmer' ? 'bg-green-100 text-green-700' :
    user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
    'bg-blue-100 text-blue-700';

  const joinedDate = new Date(user.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 flex-row items-center gap-3">
      <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center">
        <Text className="text-2xl">{user.role === 'farmer' ? '🧑‍🌾' : user.role === 'admin' ? '🛡️' : '👤'}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-gray-900">{user.full_name}</Text>
        <Text className="text-gray-400 text-xs">{user.phone ?? user.email}</Text>
        <Text className="text-gray-300 text-xs">Joined {joinedDate}</Text>
      </View>
      <View className={`rounded-full px-3 py-1 ${roleColor}`}>
        <Text className="text-xs font-semibold capitalize">{user.role}</Text>
      </View>
    </View>
  );
}
