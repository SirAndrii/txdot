import type { StarbucksLocation } from '../types';

const CACHE_KEY = 'txdot_starbucks_v1';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  timestamp: number;
  data: StarbucksLocation[];
}

export function loadFromCache(): StarbucksLocation[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CacheEntry;
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

export function saveToCache(data: StarbucksLocation[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
  } catch (e) {
    console.warn('[Starbucks] localStorage save failed:', e);
  }
}
