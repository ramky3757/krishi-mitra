// Simple local wishlist stored in AsyncStorage.
// Later this can be migrated to a Supabase table for cross-device sync.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const KEY = 'krishimitra:wishlist';

let cache: Set<string> | null = null;
const listeners = new Set<() => void>();

async function load(): Promise<Set<string>> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = new Set(raw ? JSON.parse(raw) : []);
  } catch {
    cache = new Set();
  }
  return cache;
}

async function persist() {
  if (!cache) return;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(Array.from(cache)));
  } catch {}
  listeners.forEach((l) => l());
}

export async function toggleWishlist(listingId: string) {
  const s = await load();
  if (s.has(listingId)) s.delete(listingId);
  else s.add(listingId);
  await persist();
}

export async function isInWishlist(listingId: string): Promise<boolean> {
  const s = await load();
  return s.has(listingId);
}

export function useWishlist(listingId: string) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    isInWishlist(listingId).then((v) => active && setSaved(v));
    const unsub = () => listeners.delete(onChange);
    const onChange = () => {
      isInWishlist(listingId).then((v) => active && setSaved(v));
    };
    listeners.add(onChange);
    return () => { active = false; unsub(); };
  }, [listingId]);

  const toggle = async () => {
    await toggleWishlist(listingId);
  };

  return { saved, toggle };
}
