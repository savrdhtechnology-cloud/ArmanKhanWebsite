'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { db, ensureDay, ensureLoaded, getVersion, isReady, reload, REMOTE, save, State, STORAGE_KEY, subscribe } from './data';

/**
 * The shared store once it is ready in the browser (null while loading / during server render).
 * Re-renders on every change from any screen.
 */
export function useStore(): State | null {
  useSyncExternalStore(subscribe, getVersion, () => -1);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); ensureLoaded(); }, []);
  return mounted && isReady() ? db() : null;
}

/** Load live holds (and anonymised busy slots for the public page) for a day. */
export function useDay(date: string | null) {
  useEffect(() => {
    if (!date || !REMOTE) return;
    void ensureDay(date);
    const t = window.setInterval(() => void ensureDay(date), 30_000);
    return () => window.clearInterval(t);
  }, [date]);
}

/** Mounted once in the network layout: keeps tabs in sync, expires holds, refreshes remote data. */
export function useStoreSync() {
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (!REMOTE && e.key === STORAGE_KEY) reload(); };
    const onFocus = () => { if (REMOTE) reload(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    const t = window.setInterval(() => {
      const s = db(); const n = s.holds.length;
      s.holds = s.holds.filter((h) => h.expires > Date.now());
      if (s.holds.length !== n) save();
    }, 15_000);
    const r = REMOTE ? window.setInterval(() => reload(), 60_000) : 0;
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('focus', onFocus); window.clearInterval(t); if (r) window.clearInterval(r); };
  }, []);
}

/** Small UI choices (selected salon, date, filters) that should survive moving between pages. */
export function useSessionState<T>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    try { const raw = sessionStorage.getItem('arman-ui:' + key); if (raw) setV(JSON.parse(raw) as T); } catch { /* ignore */ }
  }, [key]);
  const set = (next: T) => { setV(next); try { sessionStorage.setItem('arman-ui:' + key, JSON.stringify(next)); } catch { /* ignore */ } };
  return [v, set];
}

/** Light / dark theme for the operator portals (Appearance Studio). */
export type Theme = 'ivory' | 'noir';
export function useTheme(): [Theme, (t: Theme) => void] {
  const [t, setT] = useState<Theme>('ivory');
  useEffect(() => { try { const v = localStorage.getItem('arman-network-theme'); if (v === 'noir' || v === 'ivory') setT(v); } catch { /* ignore */ } }, []);
  useEffect(() => { document.documentElement.dataset.theme = t; }, [t]);
  const set = (v: Theme) => { setT(v); try { localStorage.setItem('arman-network-theme', v); } catch { /* ignore */ } };
  return [t, set];
}
