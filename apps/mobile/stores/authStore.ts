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
  signInWithPhone: (phone: string) => Promise<void>;
  verifyOTP: (phone: string, token: string) => Promise<void>;
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
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await get().refreshProfile();
    }
    set({ session, isInitialized: true });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (session?.user) {
        await get().refreshProfile();
      } else {
        set({ user: null, farmerProfile: null, consumerProfile: null });
      }
    });
  },

  signInWithPhone: async (phone: string) => {
    set({ isLoading: true });
    const { error } = await supabase.auth.signInWithOtp({ phone });
    set({ isLoading: false });
    if (error) throw error;
  },

  verifyOTP: async (phone: string, token: string) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
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

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!userData) return;
    set({ user: userData });

    if (userData.role === 'farmer') {
      const { data: fp } = await supabase
        .from('farmer_profiles')
        .select('*, user:users(*)')
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
