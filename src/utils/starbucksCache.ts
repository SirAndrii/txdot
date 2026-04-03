import type { StarbucksLocation } from '../types';

const CACHE_KEYS = {
  starbucks: 'txdot_starbucks_v1',
  cafes: 'txdot_cafes_v1',
  bakeries: 'txdot_bakeries_v1',
} as const;

export type CafeMode = keyof typeof CACHE_KEYS;

interface CacheEntry {
  data: StarbucksLocation[];
}

export function loadFromCache(mode: CafeMode): StarbucksLocation[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEYS[mode]);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CacheEntry;
    return cached.data;
  } catch {
    return null;
  }
}

export function saveToCache(mode: CafeMode, data: StarbucksLocation[]): void {
  try {
    localStorage.setItem(CACHE_KEYS[mode], JSON.stringify({ data }));
  } catch (e) {
    console.warn('[POILayer] localStorage save failed:', e);
  }
}

/** Merge incoming locations into the existing cache (dedup by ~11m grid). Returns full merged array. */
export function mergeToCache(mode: CafeMode, incoming: StarbucksLocation[]): StarbucksLocation[] {
  const existing = loadFromCache(mode) ?? [];
  const key = (s: StarbucksLocation) => `${s.lat.toFixed(4)},${s.lon.toFixed(4)}`;
  const seen = new Set(existing.map(key));
  const merged = [...existing, ...incoming.filter(s => !seen.has(key(s)))];
  saveToCache(mode, merged);
  return merged;
}
