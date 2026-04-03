import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { StarbucksLocation } from '../types';
import { loadFromCache, saveToCache } from '../utils/starbucksCache';

// Shared across the session (module-level cache so refs survive StrictMode double-invoke)
let _sessionData: StarbucksLocation[] | null = null;

const STARBUCKS_ICON = L.divIcon({
  html: '<div class="sbux-s-badge">S</div>',
  className: 'sbux-div-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

interface OverpassElement {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface Props {
  show: boolean;
  onLoadingChange: (loading: boolean) => void;
}

export default function StarbucksLayer({ show, onLoadingChange }: Props) {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);

  // Stable callback ref so the async fetch never captures a stale version
  const onLoadingChangeRef = useRef(onLoadingChange);
  useEffect(() => { onLoadingChangeRef.current = onLoadingChange; });

  useEffect(() => {
    // ── hide ─────────────────────────────────────────────────────────────────
    if (!show) {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      return;
    }

    let cancelled = false;

    function placeMarkers(data: StarbucksLocation[]) {
      if (cancelled) return;
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      data.forEach(s => {
        const m = L.marker([s.lat, s.lon], { icon: STARBUCKS_ICON })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:sans-serif;font-size:12px;min-width:180px;">
              <strong style="font-size:13px;color:#00704A;">${s.name}</strong><br/>
              <span style="color:#666;font-size:11px;">${s.address}</span>
            </div>`,
            { maxWidth: 260 },
          );
        markersRef.current.push(m);
      });
    }

    // ── session cache (survives StrictMode double-invoke) ─────────────────────
    if (_sessionData) {
      placeMarkers(_sessionData);
      return () => { cancelled = true; markersRef.current.forEach(m => m.remove()); markersRef.current = []; };
    }

    // ── localStorage cache ────────────────────────────────────────────────────
    const cached = loadFromCache();
    if (cached) {
      console.log('[Starbucks] Loaded', cached.length, 'from localStorage');
      _sessionData = cached;
      placeMarkers(cached);
      return () => { cancelled = true; markersRef.current.forEach(m => m.remove()); markersRef.current = []; };
    }

    // ── Overpass fetch ────────────────────────────────────────────────────────
    onLoadingChangeRef.current(true);
    const b = map.getBounds().pad(0.05);
    const bbox = [
      b.getSouth().toFixed(5),
      b.getWest().toFixed(5),
      b.getNorth().toFixed(5),
      b.getEast().toFixed(5),
    ].join(',');
    const query =
      `[out:json][timeout:25][bbox:${bbox}];` +
      `(node["name"~"Starbucks",i];way["name"~"Starbucks",i];);` +
      `out center tags;`;

    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
    })
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json() as Promise<{ elements: OverpassElement[] }>;
      })
      .then(json => {
        if (cancelled) return;
        console.log('[Starbucks] Overpass returned', json.elements.length, 'elements');
        const data: StarbucksLocation[] = json.elements
          .filter(e => e.lat != null || e.center != null)
          .map(e => {
            const lat = e.center ? e.center.lat : e.lat!;
            const lon = e.center ? e.center.lon : e.lon!;
            const tags = e.tags ?? {};
            const address =
              [tags['addr:housenumber'], tags['addr:street'], tags['addr:city'] ?? 'Houston']
                .filter(Boolean)
                .join(', ') || 'TX';
            return { lat, lon, name: tags['name'] ?? 'Starbucks', address };
          });
        _sessionData = data;
        saveToCache(data);
        placeMarkers(data);
      })
      .catch(err => {
        console.error('[Starbucks] Overpass failed:', err);
      })
      .finally(() => {
        if (!cancelled) onLoadingChangeRef.current(false);
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      onLoadingChangeRef.current(false);
    };
  }, [show, map]);

  return null;
}
