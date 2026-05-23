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
    set({ session: data.session, isLoading: false });
    await get().refreshProfile();
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
    await supabase.auth.signOut();
    set({ session: null, user: null, farmerProfile: null, consumerProfile: null });
  },

  updateProfile: async (data: Partial<User>) => {
    const { user } = get();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('users').update(data).eq('id', user.id);
    if (error) throw error;
    set({ user: { ...user, ...data } });
  },

  refreshProfile: async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    let { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    // If no public.users row exists (e.g. account created directly in Supabase
    // dashboard without going through the app's OTP trigger), create it now.
    if (!userData) {
      const { data: created } = await supabase
        .from('users')
        .upsert({
          id: authUser.id,
          email: authUser.email ?? null,
          phone: authUser.phone ?? null,
          full_name: authUser.user_metadata?.full_name ?? '',
        })
        .select('*')
        .single();
      userData = created;
    }

    if (!userData) return;
    set({ user: userData });

    if (userData.role === 'farmer') {
      const { data: fp } = await supabase
        .from('farmer_profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();
      set({ farmerProfile: fp });
    } else if (userData.role === 'consumer') {
      const { data: cp } = await supabase
        .from('consumer_profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();
      set({ consumerProfile: cp });
    }
  },
}));
