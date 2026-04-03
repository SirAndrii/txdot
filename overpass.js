// Overpass API — Starbucks layer

const STARBUCKS_ICON = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iIzAwQzYzNyIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSIxMiIgeT0iMTUiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TPC90ZXh0Pjwvc3ZnPg==',
  iconSize: [20, 20],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

let _starbucksMarkers = [];
let starbucksLoaded = false;
let starbucksData = [];

function add_starbucksMarkers() {
  remove_starbucksMarkers();

  starbucksData.forEach(s => {
    const addr = s.address || 'Houston, TX';
    const marker = L.marker([s.lat, s.lon], { icon: STARBUCKS_ICON })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:sans-serif;font-size:12px;min-width:180px;">
          <strong style="font-size:13px;color:#00C637;">&#9749; ${s.name}</strong><br>
          <span style="color:#666;font-size:11px;">${addr}</span>
        </div>`,
        { maxWidth: 260 }
      );
    _starbucksMarkers.push(marker);
  });
}

function remove_starbucksMarkers() {
  _starbucksMarkers.forEach(m => map.removeLayer(m));
  _starbucksMarkers = [];
}

function _loadFromCache() {
  try {
    const raw = localStorage.getItem(STARBUCKS_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > STARBUCKS_CACHE_TTL) {
      localStorage.removeItem(STARBUCKS_CACHE_KEY);
      return null;
    }
    return cached.data;
  } catch (e) { return null; }
}

function _saveToCache(data) {
  try {
    localStorage.setItem(STARBUCKS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
  } catch (e) { console.warn('[Starbucks] localStorage save failed:', e); }
}

function _setLoading(loading) {
  const checkbox = document.getElementById('showStarbucks');
  const label = checkbox.parentElement;
  checkbox.disabled = loading;
  const span = label.querySelector('.sbux-label');
  if (span) span.textContent = loading ? ' Loading...' : ' Show Starbucks';
  let spinner = label.querySelector('.sbux-spinner');
  if (loading && !spinner) {
    spinner = document.createElement('span');
    spinner.className = 'sbux-spinner';
    spinner.textContent = ' ⏳';
    label.appendChild(spinner);
  } else if (!loading && spinner) {
    spinner.remove();
  }
}

function fetchStarbucks() {
  // 1. Already loaded this session
  if (starbucksLoaded) {
    add_starbucksMarkers();
    return;
  }

  // 2. Check localStorage cache (24h TTL)
  const cached = _loadFromCache();
  if (cached) {
    console.log('[Starbucks] Loaded', cached.length, 'locations from localStorage cache');
    starbucksData = cached;
    starbucksLoaded = true;
    add_starbucksMarkers();
    return;
  }

  // 3. Fetch from Overpass API
  _setLoading(true);

  const b = map.getBounds().pad(0.05);
  const bbox = `${b.getSouth().toFixed(5)},${b.getWest().toFixed(5)},${b.getNorth().toFixed(5)},${b.getEast().toFixed(5)}`;
  const query =
    `[out:json][timeout:15][bbox:${bbox}];` +
    `(node["name"~"Starbucks",i];way["name"~"Starbucks",i];);` +
    `out center tags;`;

  console.log('[Starbucks] Fetching from Overpass API, bbox:', bbox);

  fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query)
  })
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(json => {
      console.log('[Starbucks] Overpass returned', json.elements.length, 'elements');
      starbucksData = json.elements
        .filter(e => e.lat || (e.center && e.center.lat))
        .map(e => {
          const lat = e.center ? e.center.lat : e.lat;
          const lon = e.center ? e.center.lon : e.lon;
          const tags = e.tags || {};
          const street  = tags['addr:street'] || '';
          const housenr = tags['addr:housenumber'] || '';
          const city    = tags['addr:city'] || 'Houston';
          const address = [housenr, street, city].filter(Boolean).join(', ') || 'TX';
          return { lat, lon, name: tags.name || 'Starbucks', address };
        });

      starbucksLoaded = true;
      _saveToCache(starbucksData);
      add_starbucksMarkers();
    })
    .catch(err => {
      console.error('[Starbucks] Overpass API failed:', err.message, err);
      if (typeof starbucksLocations !== 'undefined') {
        starbucksData = starbucksLocations;
        starbucksLoaded = true;
        add_starbucksMarkers();
      }
    })
    .finally(() => {
      _setLoading(false);
    });
}

function toggleStarbucks() {
  showStarbucks = !showStarbucks;
  if (showStarbucks) {
    fetchStarbucks();
  } else {
    remove_starbucksMarkers();
  }
}
