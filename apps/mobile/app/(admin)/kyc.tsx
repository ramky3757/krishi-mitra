import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  RefreshControl, Alert, Linking,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { VERIFICATION_BADGES } from '@/constants';

type KYCRecord = {
  user_id: string;
  kyc_status: string;
  id_doc_url?: string;
  land_doc_url?: string;
  verification_badges?: string[];
  state?: string;
  district?: string;
  village?: string;
  user?: { full_name: string; phone: string; email: string };
};

export default function AdminKYCScreen() {
  const [records, setRecords] = useState<KYCRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    const statusMap = { pending: 'pending', approved: 'approved', rejected: 'rejected' };
    const { data, error } = await supabase
      .from('farmer_profiles')
      .select('*, user:users!user_id(*)')
      .eq('kyc_status', statusMap[tab])
      .order('user_id', { ascending: false });
    if (!error) setRecords((data ?? []) as KYCRecord[]);
    setIsLoading(false);
  }, [tab]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const onRefresh = async () => { setRefreshing(true); await fetchRecords(); setRefreshing(false); };

  const approve = async (userId: string, badges: string[]) => {
    const { error } = await supabase
      .from('farmer_profiles')
      .update({ kyc_status: 'approved', verification_badges: badges })
      .eq('user_id', userId);
    if (error) { Alert.alert('Error', error.message); return; }
    setRecords((prev) => prev.filter((r) => r.user_id !== userId));
    Alert.alert('Approved', 'Farmer KYC has been approved.');
  };

  const reject = (userId: string) => {
    Alert.prompt(
      'Reject KYC',
      'Reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason?.trim()) return;
            const { error } = await supabase
              .from('farmer_profiles')
              .update({ kyc_status: 'rejected' })
              .eq('user_id', userId);
            if (error) { Alert.alert('Error', error.message); return; }
            setRecords((prev) => prev.filter((r) => r.user_id !== userId));
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-brand-700 pt-14 pb-4 px-5">
        <Text className="text-white text-xl font-bold">Admin — KYC Review</Text>
        <Text className="text-brand-300 text-sm mt-0.5">Verify farmer identity and documents</Text>
      </View>

      <View className="flex-row bg-white border-b border-gray-100 px-4 pt-2">
        {(['pending', 'approved', 'rejected'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            className={`mr-5 pb-2 border-b-2 ${tab === t ? 'border-brand-600' : 'border-transparent'}`}
          >
            <Text className={`font-semibold capitalize text-sm ${tab === t ? 'text-brand-700' : 'text-gray-400'}`}>
              {t === 'pending' ? '⏳ Pending' : t === 'approved' ? '✅ Approved' : '❌ Rejected'}
            </Text>
          </Pressable>
        ))}
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
          {records.length === 0 ? (
            <View className="items-center py-20">
              <Text className="text-5xl mb-3">✅</Text>
              <Text className="text-gray-600 font-semibold">No {tab} KYC requests</Text>
            </View>
          ) : (
            records.map((record) => (
              <KYCCard
                key={record.user_id}
                record={record}
                showActions={tab === 'pending'}
                onApprove={(badges) => approve(record.user_id, badges)}
                onReject={() => reject(record.user_id)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function KYCCard({
  record, showActions, onApprove, onReject,
}: {
  record: KYCRecord;
  showActions: boolean;
  onApprove: (badges: string[]) => void;
  onReject: () => void;
}) {
  const [selectedBadges, setSelectedBadges] = useState<string[]>(record.verification_badges ?? []);

  const toggleBadge = (key: string) =>
    setSelectedBadges((prev) => prev.includes(key) ? prev.filter((b) => b !== key) : [...prev, key]);

  return (
    <View className="bg-white rounded-3xl p-5 mb-4">
      <View className="flex-row items-start justify-between mb-3">
        <View>
          <Text className="font-bold text-gray-900 text-base">{record.user?.full_name || 'No name'}</Text>
          {record.user?.phone ? <Text className="text-gray-500 text-sm">📱 {record.user.phone}</Text> : null}
          {record.user?.email ? <Text className="text-gray-400 text-xs">✉️ {record.user.email}</Text> : null}
          {record.district && (
            <Text className="text-gray-400 text-xs mt-0.5">📍 {record.district}, {record.state}</Text>
          )}
        </View>
        <View className="bg-amber-100 rounded-full px-3 py-1">
          <Text className="text-amber-700 text-xs font-semibold capitalize">{record.kyc_status}</Text>
        </View>
      </View>

      {/* Documents */}
      <View className="flex-row gap-2 mb-4">
        {record.id_doc_url && (
          <Pressable
            onPress={() => Linking.openURL(record.id_doc_url!)}
            className="flex-1 bg-brand-50 border border-brand-200 rounded-xl py-2.5 items-center"
          >
            <Text className="text-brand-700 text-sm font-medium">🪪 ID Doc</Text>
          </Pressable>
        )}
        {record.land_doc_url && (
          <Pressable
            onPress={() => Linking.openURL(record.land_doc_url!)}
            className="flex-1 bg-brand-50 border border-brand-200 rounded-xl py-2.5 items-center"
          >
            <Text className="text-brand-700 text-sm font-medium">📄 Land Doc</Text>
          </Pressable>
        )}
        {!record.id_doc_url && !record.land_doc_url && (
          <Text className="text-gray-400 text-sm italic">No documents uploaded</Text>
        )}
      </View>

      {showActions && (
        <>
          <Text className="text-gray-700 font-semibold text-sm mb-2">Grant Verification Badges:</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {VERIFICATION_BADGES.map((badge) => (
              <Pressable
                key={badge.key}
                onPress={() => toggleBadge(badge.key)}
                className={`rounded-full px-3 py-1.5 border ${selectedBadges.includes(badge.key) ? 'bg-brand-700 border-brand-700' : 'bg-white border-gray-300'}`}
              >
                <Text className={`text-xs font-semibold ${selectedBadges.includes(badge.key) ? 'text-white' : 'text-gray-600'}`}>
                  {badge.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row gap-2 pt-3 border-t border-gray-100">
            <Pressable onPress={() => onApprove(selectedBadges)} className="flex-1 bg-brand-700 rounded-xl py-2.5 items-center">
              <Text className="text-white font-bold text-sm">✅ Approve</Text>
            </Pressable>
            <Pressable onPress={onReject} className="flex-1 border border-red-300 rounded-xl py-2.5 items-center">
              <Text className="text-red-600 font-bold text-sm">❌ Reject</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
