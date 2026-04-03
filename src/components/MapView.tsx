import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  LayersControl,
  CircleMarker,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { Station } from '../types';
import StarbucksLayer from './StarbucksLayer';

// Fix default Leaflet icon paths broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const SAT_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SAT_ATTR = 'Tiles &copy; Esri';

function getColor(aadt: number): string {
  if (aadt > 30000) return '#1D9E75';
  if (aadt > 15000) return '#EFC427';
  return '#E24B4A';
}

function getRadius(aadt: number): number {
  if (aadt > 30000) return 8;
  if (aadt > 15000) return 6;
  return 4;
}

// ── Legend Leaflet control ────────────────────────────────────────────────────
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
    const legend = new LegendCtrl({ position: 'bottomright' });
    legend.addTo(map);
    return () => {
      legend.remove();
    };
  }, [map]);
  return null;
}

// ── Traffic markers ───────────────────────────────────────────────────────────
interface TrafficLayerProps {
  stations: Station[];
  showLabels: boolean;
}

function TrafficLayer({ stations, showLabels }: TrafficLayerProps) {
  return (
    <>
      {stations.map(s => {
        const color = getColor(s.aadt);
        const road = s.road === '-' ? 'Unnamed road' : s.road;
        return (
          // key includes showLabels so Tooltip remounts when permanent changes
          <CircleMarker
            key={`${s.station}-${showLabels}`}
            center={[s.lat, s.lon]}
            radius={getRadius(s.aadt)}
            pathOptions={{
              fillColor: color,
              color: '#fff',
              weight: 1.5,
              opacity: 1,
              fillOpacity: 0.88,
            }}
          >
            <Tooltip
              permanent={showLabels}
              sticky={!showLabels}
              direction={showLabels ? 'bottom' : 'top'}
              offset={showLabels ? [0, 8] : [0, 0]}
              className={showLabels ? 'traffic-label' : undefined}
              opacity={0.97}
            >
              {showLabels ? (
                s.aadt.toLocaleString()
              ) : (
                <div style={{ fontFamily: 'sans-serif', fontSize: 13, lineHeight: 1.6, minWidth: 160 }}>
                  <strong style={{ fontSize: 14 }}>{road}</strong>
                  <br />
                  <span style={{ fontSize: 16, fontWeight: 700, color }}>
                    {s.aadt.toLocaleString()}
                  </span>{' '}
                  <span style={{ color: '#555' }}>cars/day</span>
                  <br />
                  <span style={{ fontSize: 11, color: '#777' }}>
                    {s.county} County &nbsp;·&nbsp; {s.station}
                  </span>
                </div>
              )}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

// ── MapView ───────────────────────────────────────────────────────────────────
interface MapViewProps {
  stations: Station[];
  showLabels: boolean;
  showStarbucks: boolean;
  onStarbucksLoadingChange: (loading: boolean) => void;
  showCafes: boolean;
  onCafesLoadingChange: (loading: boolean) => void;
  showBakeries: boolean;
  onBakeriesLoadingChange: (loading: boolean) => void;
}

export default function MapView({
  stations,
  showLabels,
  showStarbucks,
  onStarbucksLoadingChange,
  showCafes,
  onCafesLoadingChange,
  showBakeries,
  onBakeriesLoadingChange,
}: MapViewProps) {
  return (
    <MapContainer
      center={[29.74, -95.62]}
      zoom={11}
      style={{ width: '100%', height: 'calc(100vh - 52px)' }}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Map">
          <TileLayer url={OSM_URL} attribution={OSM_ATTR} maxZoom={19} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer url={SAT_URL} attribution={SAT_ATTR} maxZoom={19} />
        </LayersControl.BaseLayer>
      </LayersControl>

      <TrafficLayer stations={stations} showLabels={showLabels} />
      <StarbucksLayer mode="starbucks" show={showStarbucks} onLoadingChange={onStarbucksLoadingChange} />
      <StarbucksLayer mode="cafes" show={showCafes} onLoadingChange={onCafesLoadingChange} />
      <StarbucksLayer mode="bakeries" show={showBakeries} onLoadingChange={onBakeriesLoadingChange} />
      <LegendControl />
    </MapContainer>
  );
}
