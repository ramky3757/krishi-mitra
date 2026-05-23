import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Booking, BookingStatus } from '@/types';

interface BookingsState {
  bookings: Booking[];
  selectedBooking: Booking | null;
  isLoading: boolean;

  fetchMyBookings: () => Promise<void>;
  fetchFarmerBookings: () => Promise<void>;
  fetchBookingById: (id: string) => Promise<void>;
  createBooking: (data: CreateBookingInput) => Promise<Booking>;
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  refreshBooking: (id: string) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
}

export interface CreateBookingInput {
  listing_id: string;
  qty_kg: number;
  delivery_address?: string;
  notes?: string;
}

export const useBookingsStore = create<BookingsState>((set, get) => ({
  bookings: [],
  selectedBooking: null,
  isLoading: false,

  fetchMyBookings: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    set({ isLoading: true });

    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        listing:crop_listings(*, farmer:users!farmer_id(*, farmer_profile:farmer_profiles(*)), media:listing_media(*)),
        payments(*),
        visits:farm_visits(*)
      `)
      .eq('consumer_id', user.id)
      .order('created_at', { ascending: false });

    set({ bookings: data ?? [], isLoading: false });
  },

  fetchFarmerBookings: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    set({ isLoading: true });

    // First get this farmer's listing IDs, then fetch bookings for them.
    // (Filtering on a joined column with .eq() is not supported in PostgREST.)
    const { data: listings } = await supabase
      .from('crop_listings')
      .select('id')
      .eq('farmer_id', user.id);

    const listingIds = (listings ?? []).map((l) => l.id);

    if (listingIds.length === 0) {
      set({ bookings: [], isLoading: false });
      return;
    }

    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        listing:crop_listings(*, media:listing_media(*)),
        consumer:users!consumer_id(*, consumer_profile:consumer_profiles(*)),
        payments(*),
        visits:farm_visits(*)
      `)
      .in('listing_id', listingIds)
      .order('created_at', { ascending: false });

    set({ bookings: data ?? [], isLoading: false });
  },

  fetchBookingById: async (id: string) => {
    set({ isLoading: true });
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        listing:crop_listings(*, farmer:users!farmer_id(*, farmer_profile:farmer_profiles(*)), media:listing_media(*), progress_updates(*)),
        consumer:users!consumer_id(*, consumer_profile:consumer_profiles(*)),
        payments(*),
        visits:farm_visits(*)
      `)
      .eq('id', id)
      .single();

    set({ selectedBooking: data ?? null, isLoading: false });
  },

  createBooking: async ({ listing_id, qty_kg, delivery_address, notes }: CreateBookingInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Fetch listing to compute amounts
    const { data: listing } = await supabase
      .from('crop_listings')
      .select('price_per_kg_advance, price_per_kg_final, advance_percentage, available_qty_kg, booked_qty_kg')
      .eq('id', listing_id)
      .single();

    if (!listing) throw new Error('Listing not found');
    const remainingQty = listing.available_qty_kg - (listing.booked_qty_kg ?? 0);
    if (remainingQty < qty_kg) throw new Error(`Only ${remainingQty} kg available`);

    const total_amount = qty_kg * listing.price_per_kg_final;
    const advance_amount = qty_kg * listing.price_per_kg_advance;
    const final_amount = total_amount - advance_amount;

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        listing_id,
        consumer_id: user.id,
        qty_kg,
        advance_amount,
        final_amount,
        total_amount,
        delivery_address,
        notes,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data as Booking;
  },

  updateBookingStatus: async (id: string, status: BookingStatus) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) throw error;
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
      selectedBooking: state.selectedBooking?.id === id
        ? { ...state.selectedBooking, status }
        : state.selectedBooking,
    }));
  },

  refreshBooking: async (id: string) => {
    const { data } = await supabase
      .from('bookings')
      .select(`*, listing:crop_listings(*, farmer:users!farmer_id(*, farmer_profile:farmer_profiles(*)), media:listing_media(*), progress_updates(*)), consumer:users!consumer_id(*, consumer_profile:consumer_profiles(*)), payments(*), visits:farm_visits(*)`)
      .eq('id', id)
      .single();

    if (data) {
      set((state) => ({
        selectedBooking: state.selectedBooking?.id === id ? data : state.selectedBooking,
        bookings: state.bookings.map((b) => (b.id === id ? data : b)),
      }));
    }
  },

  deleteBooking: async (id: string) => {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({
      bookings: state.bookings.filter((b) => b.id !== id),
      selectedBooking: state.selectedBooking?.id === id ? null : state.selectedBooking,
    }));
  },

  cancelBooking: async (id: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id);
    if (error) throw error;
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)),
      selectedBooking: state.selectedBooking?.id === id
        ? { ...state.selectedBooking, status: 'cancelled' }
        : state.selectedBooking,
    }));
  },
}));
