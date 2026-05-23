import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { CropListing, FilterOptions } from '@/types';

interface ListingsState {
  listings: CropListing[];
  featuredListings: CropListing[];
  selectedListing: CropListing | null;
  isLoading: boolean;
  filters: FilterOptions;
  hasMore: boolean;
  page: number;

  fetchListings: (reset?: boolean) => Promise<void>;
  fetchFeaturedListings: () => Promise<void>;
  fetchListingById: (id: string) => Promise<void>;
  setFilters: (filters: FilterOptions) => void;
  clearFilters: () => void;
  refreshListing: (id: string) => Promise<void>;
}

const PAGE_SIZE = 12;

export const useListingsStore = create<ListingsState>((set, get) => ({
  listings: [],
  featuredListings: [],
  selectedListing: null,
  isLoading: false,
  filters: {},
  hasMore: true,
  page: 0,

  fetchListings: async (reset = false) => {
    const { filters, page, listings } = get();
    const currentPage = reset ? 0 : page;

    set({ isLoading: true });

    let query = supabase
      .from('crop_listings')
      .select(`
        *,
        farmer:farmer_profiles(*, user:users(*)),
        media:listing_media(*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    if (filters.category) query = query.eq('crop_category', filters.category);
    if (filters.state) query = query.eq('state', filters.state);
    if (filters.district) query = query.eq('district', filters.district);
    if (filters.farming_method) query = query.eq('farming_method', filters.farming_method);
    if (filters.is_zero_pesticide) query = query.eq('is_zero_pesticide', true);
    if (filters.min_price) query = query.gte('price_per_kg_final', filters.min_price);
    if (filters.max_price) query = query.lte('price_per_kg_final', filters.max_price);

    const { data, error } = await query;

    if (error) {
      set({ isLoading: false });
      throw error;
    }

    const newListings = data ?? [];
    set({
      listings: reset ? newListings : [...listings, ...newListings],
      isLoading: false,
      hasMore: newListings.length === PAGE_SIZE,
      page: currentPage + 1,
    });
  },

  fetchFeaturedListings: async () => {
    const { data } = await supabase
      .from('crop_listings')
      .select(`*, farmer:farmer_profiles(*, user:users(*)), media:listing_media(*)`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6);

    set({ featuredListings: data ?? [] });
  },

  fetchListingById: async (id: string) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('crop_listings')
      .select(`
        *,
        farmer:farmer_profiles(*, user:users(*)),
        media:listing_media(*),
        progress_updates(*)
      `)
      .eq('id', id)
      .single();

    set({ selectedListing: data ?? null, isLoading: false });
    if (error) throw error;
  },

  setFilters: (filters: FilterOptions) => {
    set({ filters, listings: [], page: 0, hasMore: true });
    get().fetchListings(true);
  },

  clearFilters: () => {
    set({ filters: {}, listings: [], page: 0, hasMore: true });
    get().fetchListings(true);
  },

  refreshListing: async (id: string) => {
    const { data } = await supabase
      .from('crop_listings')
      .select(`*, farmer:farmer_profiles(*, user:users(*)), media:listing_media(*), progress_updates(*)`)
      .eq('id', id)
      .single();

    if (data) {
      set((state) => ({
        selectedListing: state.selectedListing?.id === id ? data : state.selectedListing,
        listings: state.listings.map((l) => (l.id === id ? data : l)),
      }));
    }
  },
}));
