import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  ActivityIndicator, RefreshControl, Alert, Modal,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { CropListing } from '@/types';

type AdminListing = CropListing & { farmer: any };

type Tab = 'pending' | 'active' | 'all';

export default function AdminListingsScreen() {
  const [tab, setTab] = useState<Tab>('pending');
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminListing | null>(null);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from('crop_listings')
      .select('*, farmer:users!farmer_id(*, farmer_profile:farmer_profiles(*)), media:listing_media(*)')
      .order('created_at', { ascending: false });

    if (tab === 'pending') query = query.eq('status', 'pending_approval');
    else if (tab === 'active') query = query.eq('status', 'active');

    const { data, error } = await query;
    if (error) {
      Alert.alert('Fetch Error', error.message);
    } else {
      setListings((data ?? []) as AdminListing[]);
    }
    setIsLoading(false);
  }, [tab]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const onRefresh = async () => { setRefreshing(true); await fetchListings(); setRefreshing(false); };

  const approve = async (id: string) => {
    const { error } = await supabase.from('crop_listings').update({ status: 'active' }).eq('id', id);
    if (error) { Alert.alert('Error', error.message); return; }
    setListings((prev) => prev.filter((l) => l.id !== id));
    Alert.alert('Approved', 'Listing is now live for consumers.');
  };

  const reject = (listing: AdminListing) => {
    Alert.prompt(
      'Reject Listing',
      'Provide a reason for rejection (visible to farmer):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason?.trim()) { Alert.alert('Required', 'Please enter a rejection reason.'); return; }
            const { error } = await supabase
              .from('crop_listings')
              .update({ status: 'cancelled', admin_notes: reason.trim() })
              .eq('id', listing.id);
            if (error) { Alert.alert('Error', error.message); return; }
            setListings((prev) => prev.filter((l) => l.id !== listing.id));
          },
        },
      ],
      'plain-text'
    );
  };

  const tabCounts = { pending: listings.filter((l) => l.status === 'pending_approval').length };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-brand-700 pt-14 pb-4 px-5">
        <Text className="text-white text-xl font-bold">Admin — Listings</Text>
        <Text className="text-brand-300 text-sm mt-0.5">Review and manage all crop listings</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-100 px-4 pt-2">
        {(['pending', 'active', 'all'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            className={`mr-5 pb-2 border-b-2 ${tab === t ? 'border-brand-600' : 'border-transparent'}`}
          >
            <Text className={`font-semibold capitalize text-sm ${tab === t ? 'text-brand-700' : 'text-gray-400'}`}>
              {t === 'pending' ? '⏳ Pending' : t === 'active' ? '✅ Active' : '📋 All'}
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
          {listings.length === 0 ? (
            <View className="items-center py-20">
              <Text className="text-5xl mb-3">✅</Text>
              <Text className="text-gray-600 font-semibold">
                {tab === 'pending' ? 'No pending listings' : 'No listings found'}
              </Text>
            </View>
          ) : (
            listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                showActions={listing.status === 'pending_approval'}
                onApprove={() => approve(listing.id)}
                onReject={() => reject(listing)}
                onEdit={() => setEditTarget(listing)}
              />
            ))
          )}
        </ScrollView>
      )}

      {editTarget && (
        <EditListingModal
          listing={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => {
            setListings((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)));
            setEditTarget(null);
          }}
        />
      )}
    </View>
  );
}

function ListingCard({
  listing, showActions, onApprove, onReject, onEdit,
}: {
  listing: AdminListing;
  showActions: boolean;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
}) {
  const farmerName = listing.farmer?.full_name ?? 'Unknown';
  const statusColor =
    listing.status === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
    listing.status === 'active' ? 'bg-green-100 text-green-700' :
    listing.status === 'cancelled' ? 'bg-red-100 text-red-600' :
    'bg-gray-100 text-gray-600';

  return (
    <View className="bg-white rounded-3xl p-5 mb-4 shadow-sm">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-3">
          <Text className="font-bold text-gray-900 text-base">{listing.crop_name}</Text>
          <Text className="text-gray-500 text-sm mt-0.5">by {farmerName}</Text>
          {listing.district ? (
            <Text className="text-gray-400 text-xs mt-0.5">📍 {listing.district}, {listing.state}</Text>
          ) : null}
        </View>
        <View className={`rounded-full px-3 py-1 ${statusColor}`}>
          <Text className="text-xs font-semibold capitalize">{listing.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mb-3">
        <Chip label={`${listing.available_qty_kg} kg available`} />
        <Chip label={`₹${listing.price_per_kg_final}/kg`} />
        <Chip label={listing.farming_method} />
        {listing.harvest_date && <Chip label={`Harvest: ${listing.harvest_date}`} />}
      </View>

      {listing.description ? (
        <Text className="text-gray-500 text-sm mb-3" numberOfLines={2}>{listing.description}</Text>
      ) : null}

      <View className="flex-row gap-2 pt-3 border-t border-gray-100">
        <Pressable onPress={onEdit} className="flex-row items-center gap-1.5 px-4 py-2 bg-gray-100 rounded-xl">
          <Text className="text-gray-700 text-sm font-medium">✏️ Edit</Text>
        </Pressable>
        {showActions && (
          <>
            <Pressable onPress={onApprove} className="flex-1 py-2 bg-brand-700 rounded-xl items-center">
              <Text className="text-white text-sm font-bold">✅ Approve</Text>
            </Pressable>
            <Pressable onPress={onReject} className="flex-1 py-2 border border-red-300 rounded-xl items-center">
              <Text className="text-red-600 text-sm font-bold">❌ Reject</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View className="bg-gray-100 rounded-full px-3 py-1">
      <Text className="text-gray-600 text-xs font-medium">{label}</Text>
    </View>
  );
}

function EditListingModal({
  listing, onClose, onSaved,
}: {
  listing: AdminListing;
  onClose: () => void;
  onSaved: (updated: Partial<AdminListing>) => void;
}) {
  const [availableQty, setAvailableQty] = useState(String(listing.available_qty_kg));
  const [priceAdvance, setPriceAdvance] = useState(String(listing.price_per_kg_advance));
  const [priceFinal, setPriceFinal] = useState(String(listing.price_per_kg_final));
  const [harvestDate, setHarvestDate] = useState(listing.harvest_date ?? '');
  const [adminNotes, setAdminNotes] = useState(listing.admin_notes ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    if (!adminNotes.trim()) {
      Alert.alert('Rationale Required', 'Please enter a reason for any changes you made.');
      return;
    }
    setIsSaving(true);
    const updates = {
      available_qty_kg: parseFloat(availableQty),
      price_per_kg_advance: parseFloat(priceAdvance),
      price_per_kg_final: parseFloat(priceFinal),
      harvest_date: harvestDate,
      admin_notes: adminNotes.trim(),
    };
    const { error } = await supabase.from('crop_listings').update(updates).eq('id', listing.id);
    setIsSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    onSaved(updates);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-gray-50">
        <View className="bg-white px-5 pt-12 pb-4 border-b border-gray-100 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-gray-900">Edit Listing</Text>
          <Pressable onPress={onClose}><Text className="text-brand-700 font-medium">Cancel</Text></Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 80 }}>
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <Text className="text-amber-800 text-sm font-semibold">Admin Edit</Text>
            <Text className="text-amber-700 text-sm mt-1">
              Changes made here override the farmer's original values. A rationale note is required.
            </Text>
          </View>

          <Field label="Available Qty (kg)" value={availableQty} onChange={setAvailableQty} keyboardType="numeric" />
          <Field label="Advance Price ₹/kg" value={priceAdvance} onChange={setPriceAdvance} keyboardType="numeric" />
          <Field label="Final Price ₹/kg" value={priceFinal} onChange={setPriceFinal} keyboardType="numeric" />
          <Field label="Harvest Date (YYYY-MM-DD)" value={harvestDate} onChange={setHarvestDate} />

          <View>
            <Text className="text-gray-700 font-semibold mb-2">Admin Rationale *</Text>
            <TextInput
              className="border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-900 h-24"
              placeholder="Explain why you're adjusting these values..."
              multiline
              value={adminNotes}
              onChangeText={setAdminNotes}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 pb-8">
          <Pressable
            onPress={save}
            disabled={isSaving}
            className={`rounded-2xl py-4 items-center ${isSaving ? 'bg-gray-200' : 'bg-brand-700'}`}
          >
            {isSaving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Save Changes</Text>}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, value, onChange, keyboardType }: any) {
  return (
    <View>
      <Text className="text-gray-700 font-semibold mb-2">{label}</Text>
      <TextInput
        className="border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-900"
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}
