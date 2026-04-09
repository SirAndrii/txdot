import { useEffect } from 'react';
import { MapContainer, TileLayer, LayersControl, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Station, StarbucksLocation } from '../types';
import type { CafeMode } from '../utils/starbucksCache';
import type { NeighborhoodLayerProps } from './NeighborhoodLayer';
import StarbucksLayer from './StarbucksLayer';
import StaticPoiLayer from './StaticPoiLayer';
import NeighborhoodLayer from './NeighborhoodLayer';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl:       new URL('leaflet/dist/images/marker-icon.png',     import.meta.url).href,
  shadowUrl:     new URL('leaflet/dist/images/marker-shadow.png',   import.meta.url).href,
});

const OSM_URL  = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const SAT_URL  = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SAT_ATTR = 'Tiles &copy; Esri';

function getColor(aadt: number) {
  if (aadt > 30_000) return '#1D9E75';
  if (aadt > 15_000) return '#EFC427';
  return '#E24B4A';
}

function getRadius(aadt: number) {
  if (aadt > 30_000) return 8;
  if (aadt > 15_000) return 6;
  return 4;
}

// Precomputed per js-cache-function-results: avoid allocating a new object per
// marker per render. Keys match the 3 possible getColor() return values.
const PATH_OPTIONS: Record<string, L.PathOptions> = {
  '#1D9E75': { fillColor: '#1D9E75', color: '#fff', weight: 1.5, opacity: 1, fillOpacity: 0.88 },
  '#EFC427': { fillColor: '#EFC427', color: '#fff', weight: 1.5, opacity: 1, fillOpacity: 0.88 },
  '#E24B4A': { fillColor: '#E24B4A', color: '#fff', weight: 1.5, opacity: 1, fillOpacity: 0.88 },
};

class LegendCtrl extends L.Control {
  onAdd(): HTMLElement {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = [
      '<b>Daily traffic (AADT 2024)</b>',
      '<div><span class="dot" style="width:14px;height:14px;background:#1D9E75;"></span> &gt; 30,000</div>',
      '<div><span class="dot" style="width:10px;height:10px;background:#EFC427;"></span> 15,000 &ndash; 30,000</div>',
      '<div><span class="dot" style="width:7px;height:7px;background:#E24B4A;"></span> &lt; 15,000</div>',
    ].join('');
    return div;
  }
}

function LegendControl() {
  const map = useMap();
  useEffect(() => {
    const ctrl = new LegendCtrl({ position: 'bottomright' });
    ctrl.addTo(map);
    return () => { ctrl.remove(); };
  }, [map]);
  return null;
}

function TrafficLayer({ stations, showLabels }: { stations: Station[]; showLabels: boolean }) {
  return (
    <>
      {stations.map(s => {
        const color = getColor(s.aadt);
        const road  = s.road === '-' ? 'Unnamed road' : s.road;
        return (
          // key must not include showLabels: changing it would unmount/remount all markers
          <CircleMarker key={s.station} center={[s.lat, s.lon]} radius={getRadius(s.aadt)}
            pathOptions={PATH_OPTIONS[color]}>
            <Tooltip permanent={showLabels} sticky={!showLabels}
              direction={showLabels ? 'bottom' : 'top'} offset={showLabels ? [0, 8] : [0, 0]}
              className={showLabels ? 'traffic-label' : undefined} opacity={0.97}>
              {showLabels ? s.aadt.toLocaleString() : (
                <div style={{ fontFamily: 'sans-serif', fontSize: 13, lineHeight: 1.6, minWidth: 160 }}>
                  <strong style={{ fontSize: 14 }}>{road}</strong><br />
                  <span style={{ fontSize: 16, fontWeight: 700, color }}>{s.aadt.toLocaleString()}</span>
                  {' '}<span style={{ color: '#555' }}>cars/day</span><br />
                  <span style={{ fontSize: 11, color: '#777' }}>{s.county} County &nbsp;·&nbsp; {s.station}</span>
                </div>
              )}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

interface Props {
  stations: Station[];
  showLabels: boolean;
  showStarbucks: boolean;
  onStarbucksLoadingChange: (v: boolean) => void;
  showBakeries: boolean;
  onBakeriesLoadingChange: (v: boolean) => void;
  fetchKeys: Record<CafeMode, number>;
  onFetchResult: (mode: string, added: number) => void;
  coffeeLocations: StarbucksLocation[];
  cafeLocations: StarbucksLocation[];
  census: NeighborhoodLayerProps;
}

export default function MapView({
  stations, showLabels,
  showStarbucks, onStarbucksLoadingChange,
  showBakeries, onBakeriesLoadingChange,
  fetchKeys, onFetchResult,
  coffeeLocations, cafeLocations,
  census,
}: Props) {
  return (
    <MapContainer center={[29.74, -95.62]} zoom={11} style={{ width: '100%', height: 'calc(100vh - 52px)' }}>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Map">
          <TileLayer url={OSM_URL} attribution={OSM_ATTR} maxZoom={19} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer url={SAT_URL} attribution={SAT_ATTR} maxZoom={19} />
        </LayersControl.BaseLayer>
      </LayersControl>

      <TrafficLayer stations={stations} showLabels={showLabels} />

      <StarbucksLayer mode="starbucks" show={showStarbucks} onLoadingChange={onStarbucksLoadingChange}
        fetchKey={fetchKeys.starbucks} onFetchResult={n => onFetchResult('starbucks', n)} />
      <StarbucksLayer mode="bakeries" show={showBakeries} onLoadingChange={onBakeriesLoadingChange}
        fetchKey={fetchKeys.bakeries} onFetchResult={n => onFetchResult('bakeries', n)} />

      <StaticPoiLayer locations={coffeeLocations} badgeClass="cafe-badge"       badgeLetter="C"  popupColor="#795548" />
      <StaticPoiLayer locations={cafeLocations}   badgeClass="cafe-other-badge" badgeLetter="Ca" popupColor="#5C6BC0" />

      <NeighborhoodLayer {...census} />

      <LegendControl />
    </MapContainer>
  );
}
