'use server';

import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createAuthClient } from '@/lib/supabase-auth';

export async function signOut() {
  const client = await createAuthClient();
  await client.auth.signOut();
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
