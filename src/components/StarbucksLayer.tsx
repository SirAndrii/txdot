import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { StarbucksLocation } from '../types';
import { loadFromCache, saveToCache, mergeToCache, type CafeMode } from '../utils/starbucksCache';

// ── Global Overpass request queue ─────────────────────────────────────────────
// Shared across all StarbucksLayer instances so starbucks + cafes + bakeries
// never fire simultaneously, preventing 429s.
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const queue: Array<() => Promise<boolean>> = []; // task returns true if a request was made
let queueRunning = false;

function enqueueRequest(task: () => Promise<boolean>) {
  queue.push(task);
  if (!queueRunning) drainQueue();
}

async function drainQueue() {
  queueRunning = true;
  while (queue.length > 0) {
    const task = queue.shift()!;
    const madeRequest = await task();
    if (madeRequest) await sleep(1500); // 1.5 s courtesy gap between real requests
  }
  queueRunning = false;
}

// ── Per-mode config ───────────────────────────────────────────────────────────

const _sessionData: Record<CafeMode, StarbucksLocation[] | null> = {
  starbucks: null,
  cafes: null,
  bakeries: null,
};

const ICONS: Record<CafeMode, L.DivIcon> = {
  starbucks: L.divIcon({
    html: '<div class="sbux-s-badge">S</div>',
    className: 'sbux-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  }),
  cafes: L.divIcon({
    html: '<div class="cafe-badge">C</div>',
    className: 'sbux-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  }),
  bakeries: L.divIcon({
    html: '<div class="bakery-badge">B</div>',
    className: 'sbux-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  }),
};

const QUERIES: Record<CafeMode, string> = {
  starbucks: '(node["name"~"Starbucks",i];way["name"~"Starbucks",i];);',
  cafes:     '(node["amenity"="cafe"];way["amenity"="cafe"];);',
  bakeries:  '(node["shop"="bakery"];way["shop"="bakery"];);',
};

// Starbucks: single bbox, fast name-filter query.
// Cafes/bakeries: split into 2×2 grid — each cell is small enough to avoid 504.
const GRID:        Record<CafeMode, number> = { starbucks: 1, cafes: 2, bakeries: 2 };
const TIMEOUT:     Record<CafeMode, number> = { starbucks: 25, cafes: 30, bakeries: 30 };
const CHUNK_LIMIT: Record<CafeMode, string> = {
  starbucks: 'out center tags;',
  cafes:     'out 200 center tags;',
  bakeries:  'out 200 center tags;',
};

const POPUP_COLORS:  Record<CafeMode, string> = { starbucks: '#00704A', cafes: '#795548', bakeries: '#E65100' };
const DEFAULT_NAMES: Record<CafeMode, string> = { starbucks: 'Starbucks', cafes: 'Coffee shop', bakeries: 'Bakery' };

// ── Helpers ───────────────────────────────────────────────────────────────────

interface OverpassElement {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function gridBboxes(b: L.LatLngBounds, n: number): string[] {
  const latStep = (b.getNorth() - b.getSouth()) / n;
  const lonStep = (b.getEast()  - b.getWest())  / n;
  const cells: string[] = [];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const s  = (b.getSouth() + row       * latStep).toFixed(5);
      const n_ = (b.getSouth() + (row + 1) * latStep).toFixed(5);
      const w  = (b.getWest()  + col       * lonStep).toFixed(5);
      const e  = (b.getWest()  + (col + 1) * lonStep).toFixed(5);
      cells.push(`${s},${w},${n_},${e}`);
    }
  }
  return cells;
}

function parseElements(elements: OverpassElement[], defaultName: string): StarbucksLocation[] {
  return elements
    .filter(e => e.lat != null || e.center != null)
    .map(e => {
      const lat  = e.center ? e.center.lat : e.lat!;
      const lon  = e.center ? e.center.lon : e.lon!;
      const tags = e.tags ?? {};
      const address =
        [tags['addr:housenumber'], tags['addr:street'], tags['addr:city'] ?? 'Houston']
          .filter(Boolean)
          .join(', ') || 'TX';
      return { lat, lon, name: tags['name'] ?? defaultName, address };
    });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  mode: CafeMode;
  show: boolean;
  onLoadingChange: (loading: boolean) => void;
  /** Increment to trigger a manual fetch of the current viewport (build map mode). */
  fetchKey?: number;
  onFetchResult?: (added: number) => void;
}

export default function StarbucksLayer({ mode, show, onLoadingChange, fetchKey = 0, onFetchResult }: Props) {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);

  const onLoadingChangeRef = useRef(onLoadingChange);
  useEffect(() => { onLoadingChangeRef.current = onLoadingChange; });

  useEffect(() => {
    if (!show) {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      return;
    }

    let cancelled = false;
    const icon        = ICONS[mode];
    const popupColor  = POPUP_COLORS[mode];
    const defaultName = DEFAULT_NAMES[mode];

    function addMarkers(data: StarbucksLocation[]) {
      if (cancelled) return;
      data.forEach(s => {
        const m = L.marker([s.lat, s.lon], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:sans-serif;font-size:12px;min-width:180px;">
              <strong style="font-size:13px;color:${popupColor};">${s.name}</strong><br/>
              <span style="color:#666;font-size:11px;">${s.address}</span>
            </div>`,
            { maxWidth: 260 },
          );
        markersRef.current.push(m);
      });
    }

    function clearMarkers() {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
    }

    // ── session / localStorage cache ──────────────────────────────────────────
    if (_sessionData[mode]) {
      addMarkers(_sessionData[mode]!);
      return () => { cancelled = true; clearMarkers(); };
    }

    const cached = loadFromCache(mode);
    if (cached) {
      console.log(`[POILayer:${mode}] Loaded`, cached.length, 'from localStorage');
      _sessionData[mode] = cached;
      addMarkers(cached);
      return () => { cancelled = true; clearMarkers(); };
    }

    // ── Queue chunked Overpass fetches ────────────────────────────────────────
    onLoadingChangeRef.current(true);

    const chunks     = gridBboxes(map.getBounds(), GRID[mode]);
    const timeout    = TIMEOUT[mode];
    const outClause  = CHUNK_LIMIT[mode];
    const queryBody  = QUERIES[mode];
    const accumulated: StarbucksLocation[] = [];
    let chunksLeft   = chunks.length;

    for (const bbox of chunks) {
      enqueueRequest(async () => {
        if (cancelled) return false; // skip without consuming rate-limit gap

        const query =
          `[out:json][timeout:${timeout}][bbox:${bbox}];` +
          queryBody + outClause;

        try {
          const r = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'data=' + encodeURIComponent(query),
          });
          if (!r.ok) throw new Error('HTTP ' + r.status);
          const json = await r.json() as { elements?: OverpassElement[] };

          if (!cancelled) {
            const chunk = parseElements(json.elements ?? [], defaultName);
            console.log(`[POILayer:${mode}] chunk ${bbox} → ${chunk.length}`);
            accumulated.push(...chunk);
            addMarkers(chunk);
          }
        } catch (err) {
          console.error(`[POILayer:${mode}] chunk failed (${bbox}):`, err);
        }

        chunksLeft--;
        if (chunksLeft === 0 && !cancelled) {
          _sessionData[mode] = accumulated;
          saveToCache(mode, accumulated);
          onLoadingChangeRef.current(false);
        }

        return true; // a real request was made — apply cooldown
      });
    }

    return () => {
      cancelled = true;
      clearMarkers();
      onLoadingChangeRef.current(false);
    };
  }, [show, mode, map]);

  // ── Build map mode: user-triggered fetch for the current viewport ─────────
  useEffect(() => {
    if (fetchKey === 0 || !show) return;

    let cancelled = false;
    onLoadingChangeRef.current(true);

    const icon       = ICONS[mode];
    const popupColor = POPUP_COLORS[mode];

    const b    = map.getBounds();
    const bbox = [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()]
      .map(n => n.toFixed(5)).join(',');
    const query =
      `[out:json][timeout:60][bbox:${bbox}];` +
      QUERIES[mode] +
      `out 400 center tags;`;

    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
    })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() as Promise<{ elements?: OverpassElement[] }>; })
      .then(json => {
        if (cancelled) return;
        const incoming = parseElements(json.elements ?? [], DEFAULT_NAMES[mode]);
        const merged   = mergeToCache(mode, incoming);
        const added    = merged.length - (_sessionData[mode]?.length ?? 0);
        _sessionData[mode] = merged;

        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
        merged.forEach((s: StarbucksLocation) => {
          const m = L.marker([s.lat, s.lon], { icon })
            .addTo(map)
            .bindPopup(
              `<div style="font-family:sans-serif;font-size:12px;min-width:180px;">
                <strong style="font-size:13px;color:${popupColor};">${s.name}</strong><br/>
                <span style="color:#666;font-size:11px;">${s.address}</span>
              </div>`,
              { maxWidth: 260 },
            );
          markersRef.current.push(m);
        });
        onFetchResult?.(added);
      })
      .catch(err => {
        console.error(`[POILayer:${mode}] build-fetch failed:`, err);
        onFetchResult?.(-1);
      })
      .finally(() => { if (!cancelled) onLoadingChangeRef.current(false); });

    return () => { cancelled = true; onLoadingChangeRef.current(false); };
  }, [fetchKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
