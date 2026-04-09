import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export interface NeighborhoodLayerProps {
  show: boolean;
  showIncome: boolean;
  showDensity: boolean;
  hiddenIncomeBuckets: ReadonlySet<number>;
  hiddenDensityBuckets: ReadonlySet<number>;
  /** When true both income AND density conditions must be met for a tract to appear. */
  andMode: boolean;
  onLoadingChange: (loading: boolean) => void;
}

interface TractStat {
  income: number;
  density: number;
}

// ── API URLs ──────────────────────────────────────────────────────────────────
const ACS_URL =
  'https://api.census.gov/data/2022/acs/acs5' +
  '?get=B19013_001E,B01003_001E' +
  '&for=tract:*' +
  '&in=state:48%20county:201,157';

function buildTigerURL(county: '201' | '157'): string {
  const base =
    'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2022/MapServer/6/query';
  const params = new URLSearchParams({
    where: `STATE='48' AND COUNTY='${county}'`,
    outFields: 'GEOID,AREALAND',
    returnGeometry: 'true',
    f: 'geojson',
    resultRecordCount: '2000',
  });
  return `${base}?${params}`;
}

const SQ_METERS_PER_SQ_MILE = 2_589_988;

// ── Bucket definitions (exported so NeighborhoodPanel can use same thresholds) ─
// Each entry is the lower bound of that bucket; the last bucket has no upper bound.
export const INCOME_BUCKETS = [0, 40_000, 60_000, 80_000, 100_000] as const;
export const DENSITY_BUCKETS = [0, 1_000, 3_000, 7_000, 15_000] as const;

export const INCOME_LABELS = ['< $40k', '$40–60k', '$60–80k', '$80–100k', '$100k+'];
export const DENSITY_LABELS = ['< 1k/mi²', '1–3k/mi²', '3–7k/mi²', '7–15k/mi²', '15k+/mi²'];

// Representative sample values used for computing legend swatch colors
export const INCOME_SAMPLES = [25_000, 50_000, 70_000, 90_000, 120_000];
export const DENSITY_SAMPLES = [400, 2_000, 5_000, 10_000, 20_000];

function getBucketIndex(value: number, buckets: readonly number[]): number {
  let idx = 0;
  for (let i = 0; i < buckets.length; i++) {
    if (value >= buckets[i]) idx = i;
  }
  return idx;
}

// ── Color scales: two distinct green families ─────────────────────────────────
// Income — standard sequential Greens (ColorBrewer)
export function incomeColor(v: number): string {
  if (v <= 0)          return '#e0e0e0';
  if (v < 40_000)      return '#c7e9c0';
  if (v < 60_000)      return '#74c476';
  if (v < 80_000)      return '#31a354';
  if (v < 100_000)     return '#006d2c';
  return '#00441b';
}

// Density — yellow-green (YlGn, ColorBrewer)
export function densityColor(v: number): string {
  if (v <= 0)          return '#e0e0e0';
  if (v < 1_000)       return '#ffffcc';
  if (v < 3_000)       return '#c2e699';
  if (v < 7_000)       return '#78c679';
  if (v < 15_000)      return '#238b45';
  return '#004529';
}

// ── Formatters ────────────────────────────────────────────────────────────────
function fmtIncome(v: number) {
  return v > 0 ? `$${v.toLocaleString()}` : 'No data';
}
function fmtDensity(v: number) {
  return v > 0 ? `${Math.round(v).toLocaleString()} / sq mi` : 'No data';
}

// ── localStorage cache ────────────────────────────────────────────────────────
type ACSRow = [string, string, string, string, string];
const CACHE_KEY = 'txdot_tract_data_acs2022_v1';

interface CachedPayload {
  geojson: GeoJSON.FeatureCollection;
  statsEntries: [string, TractStat][];
}

function saveToCache(geojson: GeoJSON.FeatureCollection, stats: Map<string, TractStat>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ geojson, statsEntries: [...stats.entries()] } satisfies CachedPayload));
  } catch { /* quota exceeded */ }
}

function loadFromCache(): { geojson: GeoJSON.FeatureCollection; stats: Map<string, TractStat> } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { geojson, statsEntries } = JSON.parse(raw) as CachedPayload;
    return { geojson, stats: new Map(statsEntries) };
  } catch { return null; }
}

async function loadTractData(): Promise<{ geojson: GeoJSON.FeatureCollection; stats: Map<string, TractStat> }> {
  const cached = loadFromCache();
  if (cached) return cached;

  const fetchGeo = (url: string) =>
    fetch(url).then(r => {
      if (!r.ok) throw new Error(`TIGERweb ${r.status}`);
      return r.json() as Promise<GeoJSON.FeatureCollection>;
    });

  const [acsRaw, harrisTiger, fbTiger] = await Promise.all([
    fetch(ACS_URL).then(r => {
      if (!r.ok) throw new Error(`ACS ${r.status}`);
      return r.json() as Promise<[string[], ...ACSRow[]]>;
    }),
    fetchGeo(buildTigerURL('201')),
    fetchGeo(buildTigerURL('157')),
  ]);

  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [...harrisTiger.features, ...fbTiger.features],
  };

  const incomeMap = new Map<string, number>();
  const popMap = new Map<string, number>();
  const [, ...rows] = acsRaw;
  for (const [incomeStr, popStr, state, county, tract] of rows) {
    const geoid = `${state}${county}${tract}`;
    incomeMap.set(geoid, Math.max(0, parseInt(incomeStr) || 0));
    popMap.set(geoid, Math.max(0, parseInt(popStr) || 0));
  }

  const stats = new Map<string, TractStat>();
  for (const feature of geojson.features) {
    const geoid = feature.properties?.GEOID as string | undefined;
    if (!geoid) continue;
    const areaLand = (feature.properties?.AREALAND ?? 0) as number;
    const income = incomeMap.get(geoid) ?? 0;
    const pop = popMap.get(geoid) ?? 0;
    const density = areaLand > 0 ? (pop / areaLand) * SQ_METERS_PER_SQ_MILE : 0;
    stats.set(geoid, { income, density });
  }

  saveToCache(geojson, stats);
  return { geojson, stats };
}

// ── Tooltip HTML ──────────────────────────────────────────────────────────────
function tooltipHtml(geoid: string, stat: TractStat | undefined): string {
  const tractNum = geoid.slice(-6).replace(/^0+/, '') || geoid.slice(-6);
  return `<div style="font-family:sans-serif;font-size:12px;min-width:160px;line-height:1.7">
    <div style="font-size:10px;color:#888;margin-bottom:2px">Census Tract ${tractNum}</div>
    <div><b>Median income:</b> ${fmtIncome(stat?.income ?? 0)}</div>
    <div><b>Density:</b> ${fmtDensity(stat?.density ?? 0)}</div>
  </div>`;
}

// ── Layer builder ─────────────────────────────────────────────────────────────
function buildLayer(
  geojson: GeoJSON.FeatureCollection,
  stats: Map<string, TractStat>,
  colorFn: (v: number) => string,
  valueKey: 'income' | 'density',
  buckets: readonly number[],
  hiddenBuckets: ReadonlySet<number>,
  map: L.Map,
): L.GeoJSON {
  const layer = L.geoJSON(geojson, {
    style: feature => {
      const geoid = feature?.properties?.GEOID as string | undefined;
      const stat = geoid ? stats.get(geoid) : undefined;
      const value = stat?.[valueKey] ?? 0;
      const bucketIdx = getBucketIndex(value, buckets);
      const hidden = hiddenBuckets.has(bucketIdx);
      return {
        fillColor: colorFn(value),
        fillOpacity: hidden ? 0 : 0.55,
        color: hidden ? 'transparent' : '#777',
        weight: hidden ? 0 : 0.4,
        opacity: hidden ? 0 : 0.35,
      };
    },
    onEachFeature: (feature, lyr) => {
      const geoid = feature?.properties?.GEOID as string | undefined;
      if (!geoid) return;
      lyr.bindTooltip(tooltipHtml(geoid, stats.get(geoid)), { sticky: true, opacity: 0.97 });
    },
  });
  layer.addTo(map);
  layer.bringToBack();
  return layer;
}

// ── AND layer: tract visible only when both income AND density pass ───────────
function buildAndLayer(
  geojson: GeoJSON.FeatureCollection,
  stats: Map<string, TractStat>,
  hiddenIncomeBuckets: ReadonlySet<number>,
  hiddenDensityBuckets: ReadonlySet<number>,
  map: L.Map,
): L.GeoJSON {
  const layer = L.geoJSON(geojson, {
    style: feature => {
      const geoid = feature?.properties?.GEOID as string | undefined;
      const stat = geoid ? stats.get(geoid) : undefined;
      const incomeBucket  = getBucketIndex(stat?.income  ?? 0, INCOME_BUCKETS);
      const densityBucket = getBucketIndex(stat?.density ?? 0, DENSITY_BUCKETS);
      const visible =
        !hiddenIncomeBuckets.has(incomeBucket) &&
        !hiddenDensityBuckets.has(densityBucket);
      return {
        fillColor: incomeColor(stat?.income ?? 0),
        fillOpacity: visible ? 0.6 : 0,
        color: visible ? '#555' : 'transparent',
        weight: visible ? 0.4 : 0,
        opacity: visible ? 0.4 : 0,
      };
    },
    onEachFeature: (feature, lyr) => {
      const geoid = feature?.properties?.GEOID as string | undefined;
      if (!geoid) return;
      lyr.bindTooltip(tooltipHtml(geoid, stats.get(geoid)), { sticky: true, opacity: 0.97 });
    },
  });
  layer.addTo(map);
  layer.bringToBack();
  return layer;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function NeighborhoodLayer({
  show,
  showIncome,
  showDensity,
  hiddenIncomeBuckets,
  hiddenDensityBuckets,
  andMode,
  onLoadingChange,
}: NeighborhoodLayerProps) {
  const map = useMap();
  const [tractData, setTractData] = useState<{ geojson: GeoJSON.FeatureCollection; stats: Map<string, TractStat> } | null>(null);
  const fetchStarted = useRef(false);
  const incomeLayerRef = useRef<L.GeoJSON | null>(null);
  const densityLayerRef = useRef<L.GeoJSON | null>(null);
  const andLayerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (!show || fetchStarted.current) return;
    fetchStarted.current = true;
    onLoadingChange(true);
    loadTractData()
      .then(data => setTractData(data))
      .catch(err => console.error('[NeighborhoodLayer]', err))
      .finally(() => onLoadingChange(false));
  }, [show, onLoadingChange]);

  // Individual income layer — suppressed when AND mode is active
  useEffect(() => {
    incomeLayerRef.current?.remove();
    incomeLayerRef.current = null;
    if (!show || !showIncome || !tractData || andMode) return;
    incomeLayerRef.current = buildLayer(
      tractData.geojson, tractData.stats, incomeColor, 'income', INCOME_BUCKETS, hiddenIncomeBuckets, map,
    );
    return () => { incomeLayerRef.current?.remove(); incomeLayerRef.current = null; };
  }, [show, showIncome, tractData, hiddenIncomeBuckets, andMode, map]);

  // Individual density layer — suppressed when AND mode is active
  useEffect(() => {
    densityLayerRef.current?.remove();
    densityLayerRef.current = null;
    if (!show || !showDensity || !tractData || andMode) return;
    densityLayerRef.current = buildLayer(
      tractData.geojson, tractData.stats, densityColor, 'density', DENSITY_BUCKETS, hiddenDensityBuckets, map,
    );
    return () => { densityLayerRef.current?.remove(); densityLayerRef.current = null; };
  }, [show, showDensity, tractData, hiddenDensityBuckets, andMode, map]);

  // Combined AND layer — only active when both layers are enabled + andMode is on
  useEffect(() => {
    andLayerRef.current?.remove();
    andLayerRef.current = null;
    if (!show || !showIncome || !showDensity || !andMode || !tractData) return;
    andLayerRef.current = buildAndLayer(
      tractData.geojson, tractData.stats, hiddenIncomeBuckets, hiddenDensityBuckets, map,
    );
    return () => { andLayerRef.current?.remove(); andLayerRef.current = null; };
  }, [show, showIncome, showDensity, andMode, tractData, hiddenIncomeBuckets, hiddenDensityBuckets, map]);

  return null;
}
