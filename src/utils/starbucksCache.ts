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
