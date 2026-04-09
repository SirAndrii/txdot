import type { Dataset } from '../types';
import type { CafeMode } from '../utils/starbucksCache';

interface Props {
  dataset: Dataset;
  onDatasetChange: (d: Dataset) => void;
  minFilter: number;
  onMinChange: (v: number) => void;
  maxFilter: number;
  onMaxChange: (v: number) => void;
  showLabels: boolean;
  onShowLabelsChange: (v: boolean) => void;
  showStarbucks: boolean;
  onShowStarbucksChange: (v: boolean) => void;
  starbucksLoading: boolean;
  showBakeries: boolean;
  onShowBakeriesChange: (v: boolean) => void;
  bakeriesLoading: boolean;
  buildMode: boolean;
  onBuildModeChange: (v: boolean) => void;
  fetchStatus: Record<CafeMode, number | null>;
  onFetchArea: (mode: CafeMode) => void;
  stationCount: number;
}

function fmt(n: number) { return n.toLocaleString(); }

function statusLabel(status: number | null) {
  if (status === null) return '';
  if (status === -1) return ' ⚠ failed';
  if (status === 0) return ' ✓ no new';
  return ` +${status} new`;
}

function POICheckbox({ checked, loading, onChange, label, badgeClass }: {
  checked: boolean;
  loading: boolean;
  onChange: (v: boolean) => void;
  label: string;
  badgeClass: string;
}) {
  const letter = badgeClass === 'sbux-s-badge' ? 'S' : badgeClass === 'cafe-badge' ? 'C' : 'B';
  return (
    <label>
      <input type="checkbox" checked={checked} disabled={loading} onChange={e => onChange(e.target.checked)} />
      {' '}<span className={`poi-badge-inline ${badgeClass}`}>{letter}</span>{' '}
      {loading ? 'Loading…' : label}
      {loading && <span className="sbux-spinner"> ⏳</span>}
    </label>
  );
}

const AADT_MAX = 80_000;
const AADT_STEP = 1_000;

export default function FilterPanel({
  dataset, onDatasetChange,
  minFilter, onMinChange,
  maxFilter, onMaxChange,
  showLabels, onShowLabelsChange,
  showStarbucks, onShowStarbucksChange, starbucksLoading,
  showBakeries, onShowBakeriesChange, bakeriesLoading,
  buildMode, onBuildModeChange,
  fetchStatus, onFetchArea,
  stationCount,
}: Props) {
  return (
    <div id="filter-control" className="control-panel leaflet-control">
      <b>Data Source</b>
      <div className="radio-group">
        <label>
          <input type="radio" name="dataset" value="embedded"
            checked={dataset === 'embedded'} onChange={() => onDatasetChange('embedded')} />
          {' '}Embedded (308)
        </label>
        <label>
          <input type="radio" name="dataset" value="v2"
            checked={dataset === 'v2'} onChange={() => onDatasetChange('v2')} />
          {' '}Full TxDOT (994)
        </label>
      </div>

      <hr className="panel-divider" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <b style={{ marginBottom: 0 }}>Points of Interest</b>
        <button className={`build-mode-btn${buildMode ? ' active' : ''}`} onClick={() => onBuildModeChange(!buildMode)}>
          {buildMode ? '🗺 Building…' : '🗺 Build map'}
        </button>
      </div>

      {buildMode && <p className="build-mode-hint">Pan the map, then click Fetch to save POIs for that area.</p>}

      <POICheckbox checked={showStarbucks} loading={starbucksLoading} onChange={onShowStarbucksChange} label="Starbucks" badgeClass="sbux-s-badge" />
      {buildMode && showStarbucks && (
        <button className="fetch-btn" disabled={starbucksLoading} onClick={() => onFetchArea('starbucks')}>
          Fetch area{statusLabel(fetchStatus.starbucks)}
        </button>
      )}

      <POICheckbox checked={showBakeries} loading={bakeriesLoading} onChange={onShowBakeriesChange} label="Bakeries &amp; patisseries" badgeClass="bakery-badge" />
      {buildMode && showBakeries && (
        <button className="fetch-btn" disabled={bakeriesLoading} onClick={() => onFetchArea('bakeries')}>
          Fetch area{statusLabel(fetchStatus.bakeries)}
        </button>
      )}

      <hr className="panel-divider" />

      <div className="aadt-header">
        <b>Traffic Filter (AADT)</b>
        <label className="labels-toggle">
          <input type="checkbox" checked={showLabels} onChange={e => onShowLabelsChange(e.target.checked)} />
          {' '}Labels
        </label>
      </div>
      <div className="slider-container">
        <label htmlFor="minSlider">Min</label>
        <input id="minSlider" type="range" min={0} max={AADT_MAX} step={AADT_STEP} value={minFilter}
          onChange={e => onMinChange(Math.min(parseInt(e.target.value), maxFilter))} />
      </div>
      <div className="slider-container" style={{ marginBottom: 4 }}>
        <label htmlFor="maxSlider">Max</label>
        <input id="maxSlider" type="range" min={0} max={AADT_MAX} step={AADT_STEP} value={maxFilter}
          onChange={e => onMaxChange(Math.max(parseInt(e.target.value), minFilter))} />
      </div>
      <div className="range-display">
        <span>{fmt(minFilter)} – {fmt(maxFilter)}</span>
        <span>{stationCount} station{stationCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
