import { useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'krishimitra:draft:';
const SAVE_DEBOUNCE_MS = 500;
const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type DraftWrapper<T> = {
  data: T;
  savedAt: number;
};

/**
 * Persisted form state. Drafts survive browser refreshes / app closes.
 *
 * Usage:
 *   const [form, setForm, { resume, clear, hydrated, savedAt }] = useDraft('farmer-kyc', defaultForm);
 *
 * - `resume` = true means we loaded a previous draft from storage
 * - `clear()` wipes the draft (call this on successful submit)
 * - `savedAt` is a Date showing when the draft was last persisted
 */
export function useDraft<T>(
  key: string,
  initialValue: T,
): [
  T,
  React.Dispatch<React.SetStateAction<T>>,
  {
    resume: boolean;
    clear: () => Promise<void>;
    hydrated: boolean;
    savedAt: Date | null;
  },
] {
  const storageKey = PREFIX + key;
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const [resume, setResume] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from storage on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (!active || !raw) {
          setHydrated(true);
          return;
        }
        const parsed: DraftWrapper<T> = JSON.parse(raw);
        // Expire old drafts
        if (Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
          await AsyncStorage.removeItem(storageKey);
          setHydrated(true);
          return;
        }
        setValue(parsed.data);
        setResume(true);
        setSavedAt(new Date(parsed.savedAt));
      } catch {
        // ignore
      } finally {
        if (active) setHydrated(true);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced persist on every value change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const wrapper: DraftWrapper<T> = { data: value, savedAt: Date.now() };
      AsyncStorage.setItem(storageKey, JSON.stringify(wrapper)).then(() => {
        setSavedAt(new Date(wrapper.savedAt));
      }).catch(() => {});
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, hydrated, storageKey]);

  const clear = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(storageKey);
      setResume(false);
      setSavedAt(null);
    } catch {}
  }, [storageKey]);

  return [value, setValue, { resume, clear, hydrated, savedAt }];
}

export function formatSavedAt(savedAt: Date | null): string {
  if (!savedAt) return '';
  const diff = Date.now() - savedAt.getTime();
  if (diff < 60 * 1000) return 'just now';
  if (diff < 60 * 60 * 1000) {
    const m = Math.floor(diff / 60000);
    return `${m} min ago`;
  }
  if (diff < 24 * 60 * 60 * 1000) {
    const h = Math.floor(diff / 3600000);
    return `${h} hour${h !== 1 ? 's' : ''} ago`;
  }
  const d = Math.floor(diff / 86400000);
  return `${d} day${d !== 1 ? 's' : ''} ago`;
}
