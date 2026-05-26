import { create } from 'zustand';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { User, UserRole, FarmerProfile, ConsumerProfile } from '@/types';

interface AuthState {
  session: Session | null;
  user: User | null;
  farmerProfile: FarmerProfile | null;
  consumerProfile: ConsumerProfile | null;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  verifyEmailOTP: (email: string, token: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  farmerProfile: null,
  consumerProfile: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await get().refreshProfile();
      }
      set({ session, isInitialized: true });
    } catch (e) {
      set({ isInitialized: true });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (session?.user) {
        await get().refreshProfile();
      } else {
        set({ user: null, farmerProfile: null, consumerProfile: null });
      }
    });
  },

  signInWithEmail: async (email: string) => {
    set({ isLoading: true });
    const { error } = await supabase.auth.signInWithOtp({ email });
    set({ isLoading: false });
    if (error) throw error;
  },

  verifyEmailOTP: async (email: string, token: string) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) {
      set({ isLoading: false });
      throw error;
    }
    // Set session immediately; profile loads in parallel below
    set({ session: data.session, isLoading: false });
    // Don't await — let the caller navigate; profile populates in background
    void get().refreshProfile();
  },

  signInWithPassword: async (email: string, password: string) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ isLoading: false });
      throw error;
    }
    set({ session: data.session, isLoading: false });
    await get().refreshProfile();
  },

  signOut: async () => {
    // Clear local state first so UI updates instantly (<10ms)
    set({ session: null, user: null, farmerProfile: null, consumerProfile: null });
    // Use 'local' scope: only clears stored tokens — no server round-trip.
    // Fire-and-forget; user is already signed out from the UI's perspective.
    void supabase.auth.signOut({ scope: 'local' });
  },

  updateProfile: async (data: Partial<User>) => {
    const { user } = get();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('users').update(data).eq('id', user.id);
    if (error) throw error;
    set({ user: { ...user, ...data } });
  },

  refreshProfile: async () => {
    // Use session user from store if available — skips a server round-trip
    const sessionUser = get().session?.user;
    let authUser = sessionUser;
    if (!authUser) {
      const { data } = await supabase.auth.getUser();
      authUser = data.user ?? undefined;
    }
    if (!authUser) return;

    // Fetch user + both profile types in parallel — single round-trip
    const [userRes, farmerRes, consumerRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', authUser.id).maybeSingle(),
      supabase.from('farmer_profiles').select('*').eq('user_id', authUser.id).maybeSingle(),
      supabase.from('consumer_profiles').select('*').eq('user_id', authUser.id).maybeSingle(),
    ]);

    let userData = userRes.data;
    if (!userData) {
      const { data: created } = await supabase
        .from('users')
        .upsert({
          id: authUser.id,
          email: authUser.email ?? null,
          phone: authUser.phone ?? null,
          full_name: (authUser as any).user_metadata?.full_name ?? '',
        })
        .select('*')
        .maybeSingle();
      userData = created;
    }

    if (!userData) return;
    set({
      user: userData,
      farmerProfile: farmerRes.data ?? null,
      consumerProfile: consumerRes.data ?? null,
    });
  },
}));
