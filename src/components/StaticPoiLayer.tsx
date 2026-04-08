import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { StarbucksLocation } from '../types';

interface Props {
  locations: StarbucksLocation[];
  badgeClass: string;
  badgeLetter: string;
  popupColor: string;
}

function makePopup(s: StarbucksLocation, color: string): string {
  const stars = s.rating
    ? `${'★'.repeat(Math.round(s.rating))}${'☆'.repeat(5 - Math.round(s.rating))} ${s.rating.toFixed(1)}${s.reviews ? ` (${s.reviews.toLocaleString()})` : ''}`
    : '';
  const phone   = s.phone   ? `<br/><a href="tel:${s.phone}" style="color:#2563eb;font-size:11px;">${s.phone}</a>` : '';
  const website = s.website ? `<br/><a href="${s.website}" target="_blank" rel="noopener" style="color:#2563eb;font-size:11px;">Website</a>` : '';
  const gmaps   = s.googleUrl ? ` · <a href="${s.googleUrl}" target="_blank" rel="noopener" style="color:#2563eb;font-size:11px;">Google Maps</a>` : '';
  return `<div style="font-family:sans-serif;font-size:12px;min-width:180px;">
    <strong style="font-size:13px;color:${color};">${s.name}</strong><br/>
    <span style="color:#666;font-size:11px;">${s.address}</span>
    ${stars ? `<br/><span style="font-size:11px;color:#f5a623;">${stars}</span>` : ''}
    ${phone}${website}${gmaps}
  </div>`;
}

export default function StaticPoiLayer({ locations, badgeClass, badgeLetter, popupColor }: Props) {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const icon = L.divIcon({
      html: `<div class="${badgeClass}">${badgeLetter}</div>`,
      className: 'sbux-div-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -14],
    });

    locations.forEach(s => {
      const m = L.marker([s.lat, s.lon], { icon })
        .addTo(map)
        .bindPopup(makePopup(s, popupColor), { maxWidth: 280 });
      markersRef.current.push(m);
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
    };
  }, [locations, map, badgeClass, badgeLetter, popupColor]);

  return null;
}
