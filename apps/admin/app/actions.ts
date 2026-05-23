'use server';

import { supabase } from '@/lib/supabase';

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
