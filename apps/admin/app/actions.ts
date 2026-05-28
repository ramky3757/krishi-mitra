'use server';

import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createAuthClient } from '@/lib/supabase-auth';

export async function signOut() {
  const client = await createAuthClient();
  // 'local' scope skips the server round-trip — only clears the cookie session.
  await client.auth.signOut({ scope: 'local' });
  redirect('/login');
}

export async function approveListing(listingId: string) {
  const { error } = await supabase
    .from('crop_listings')
    .update({ status: 'active' })
    .eq('id', listingId);
  if (error) throw new Error(error.message);
}

export async function rejectListing(listingId: string, reason: string) {
  const { error } = await supabase
    .from('crop_listings')
    .update({ status: 'cancelled', admin_notes: reason })
    .eq('id', listingId);
  if (error) throw new Error(error.message);
}

export async function editListing(
  listingId: string,
  updates: {
    available_qty_kg: number;
    price_per_kg_advance: number;
    price_per_kg_final: number;
    harvest_date: string;
    admin_notes: string;
  }
) {
  const { error } = await supabase
    .from('crop_listings')
    .update(updates)
    .eq('id', listingId);
  if (error) throw new Error(error.message);
}

export async function approveKYC(farmerId: string, badges: string[]) {
  const { error } = await supabase
    .from('farmer_profiles')
    .update({ kyc_status: 'approved', verification_badges: badges })
    .eq('user_id', farmerId);
  if (error) throw new Error(error.message);
}

export async function rejectKYC(farmerId: string, reason: string) {
  const { error } = await supabase
    .from('farmer_profiles')
    .update({ kyc_status: 'rejected' })
    .eq('user_id', farmerId);
  if (error) throw new Error(error.message);
}

export async function createUser(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const fullName = String(formData.get('full_name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const role = String(formData.get('role') || '');
  const method = String(formData.get('method') || 'invite');
  const password = String(formData.get('password') || '');

  if (!email || !role) throw new Error('Email and role are required');
  if (!['farmer', 'consumer', 'admin'].includes(role)) throw new Error('Invalid role');

  let userId: string | undefined;

  if (method === 'password') {
    if (password.length < 6) throw new Error('Password must be at least 6 characters');
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });
    if (error) throw new Error(error.message);
    userId = data.user?.id;
  } else {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, role },
    });
    if (error) throw new Error(error.message);
    userId = data.user?.id;
  }

  if (!userId) throw new Error('Failed to create auth user');

  // Upsert into public.users so role/profile is available immediately
  const { error: profileErr } = await supabase.from('users').upsert({
    id: userId,
    email,
    full_name: fullName || null,
    phone: phone || null,
    role,
  });
  if (profileErr) throw new Error(profileErr.message);

  redirect('/users');
}

/**
 * Cascade-delete every listing belonging to the farmer plus all dependent
 * records (bookings, payments, media, progress updates, payouts).
 * Use this when you want to wipe a farmer's catalog but keep their account.
 */
export async function deleteFarmerListings(userId: string) {
  // 1. Get all listing IDs for this farmer
  const { data: listings, error: listingsErr } = await supabase
    .from('crop_listings')
    .select('id')
    .eq('farmer_id', userId);
  if (listingsErr) throw new Error(listingsErr.message);

  const listingIds = (listings ?? []).map((l) => l.id);
  if (listingIds.length === 0) return { deletedListings: 0 };

  // 2. Get all booking IDs for those listings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id')
    .in('listing_id', listingIds);
  const bookingIds = (bookings ?? []).map((b) => b.id);

  // 3. Delete child rows in dependency order (only if there are bookings)
  if (bookingIds.length > 0) {
    await supabase.from('payments').delete().in('booking_id', bookingIds);
    await supabase.from('farm_visits').delete().in('booking_id', bookingIds);
    await supabase.from('bookings').delete().in('id', bookingIds);
  }

  // 4. Listing-level child rows
  await supabase.from('listing_media').delete().in('listing_id', listingIds);
  await supabase.from('progress_updates').delete().in('listing_id', listingIds);

  // 5. Payouts directly to this farmer
  await supabase.from('payouts').delete().eq('farmer_id', userId);

  // 6. Finally the listings themselves
  const { error: listDelErr } = await supabase
    .from('crop_listings')
    .delete()
    .in('id', listingIds);
  if (listDelErr) throw new Error(listDelErr.message);

  return { deletedListings: listingIds.length };
}

/**
 * Full removal: listings (via deleteFarmerListings) + profile + auth row.
 * After this the user can sign up fresh with the same email.
 */
export async function deleteUser(userId: string) {
  // First check role — if farmer, cascade-delete their listings + child rows
  const { data: target } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (target?.role === 'farmer') {
    await deleteFarmerListings(userId);
    // Farmer profile
    await supabase.from('farmer_profiles').delete().eq('user_id', userId);
  } else if (target?.role === 'consumer') {
    // Cancel consumer's own bookings (their advance is forfeit per policy on
    // mass-delete; admin should refund manually if needed before deleting)
    const { data: cBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('consumer_id', userId);
    const cBookingIds = (cBookings ?? []).map((b) => b.id);
    if (cBookingIds.length > 0) {
      await supabase.from('payments').delete().in('booking_id', cBookingIds);
      await supabase.from('farm_visits').delete().in('booking_id', cBookingIds);
      await supabase.from('bookings').delete().in('id', cBookingIds);
    }
    await supabase.from('consumer_profiles').delete().eq('user_id', userId);
  }

  // Auth user (also cascades sessions/identities in Supabase)
  const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
  if (authErr && !authErr.message.toLowerCase().includes('not found')) {
    throw new Error(authErr.message);
  }
  // Public profile row
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function approveConsumerKYC(userId: string) {
  const { error } = await supabase
    .from('consumer_profiles')
    .update({ kyc_status: 'approved', kyc_reviewed_at: new Date().toISOString(), kyc_rejection_reason: null })
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function rejectConsumerKYC(userId: string, reason: string) {
  const { error } = await supabase
    .from('consumer_profiles')
    .update({ kyc_status: 'rejected', kyc_reviewed_at: new Date().toISOString(), kyc_rejection_reason: reason })
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function updateUserRole(userId: string, role: 'farmer' | 'consumer' | 'admin') {
  const { error } = await supabase.from('users').update({ role }).eq('id', userId);
  if (error) throw new Error(error.message);
}

/**
 * Delete a single crop listing and all dependent rows (bookings, payments,
 * media, progress updates, farm visits, payouts).
 */
export async function deleteListing(listingId: string) {
  // 1. Bookings on this listing
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('listing_id', listingId);
  const bookingIds = (bookings ?? []).map((b) => b.id);

  if (bookingIds.length > 0) {
    await supabase.from('payments').delete().in('booking_id', bookingIds);
    await supabase.from('farm_visits').delete().in('booking_id', bookingIds);
    await supabase.from('bookings').delete().in('id', bookingIds);
  }

  // 2. Listing-level child rows
  await supabase.from('listing_media').delete().eq('listing_id', listingId);
  await supabase.from('progress_updates').delete().eq('listing_id', listingId);

  // 3. Finally the listing
  const { error } = await supabase.from('crop_listings').delete().eq('id', listingId);
  if (error) throw new Error(error.message);
}

/**
 * Change a listing's status. Used by admin to:
 *   active        → fully_booked  (no more bookings accepted, still visible to consumers)
 *   active        → archived      (end of season — hidden from consumers)
 *   archived      → active        (next season — back in the catalog)
 *   any           → completed     (manually mark done)
 */
export async function setListingStatus(
  listingId: string,
  status: 'active' | 'fully_booked' | 'archived' | 'completed' | 'cancelled'
) {
  const { error } = await supabase
    .from('crop_listings')
    .update({ status })
    .eq('id', listingId);
  if (error) throw new Error(error.message);
}
