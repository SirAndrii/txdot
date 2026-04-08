import type { Dataset } from '../types';

type CafeMode = 'starbucks' | 'cafes' | 'bakeries';

interface Props {
  dataset: Dataset;
  onDatasetChange: (d: Dataset) => void;
  minFilter: number;
  maxFilter: number;
  onMinChange: (v: number) => void;
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
  onFetchArea: (mode: CafeMode) => void;
  fetchStatus: Record<CafeMode, number | null>;
  markerCount: number;
}

function fmt(n: number) {
  return n.toLocaleString();
}

function POICheckbox({
  checked,
  loading,
  onChange,
  label,
  badgeClass,
}: {
  checked: boolean;
  loading: boolean;
  onChange: (v: boolean) => void;
  label: string;
  badgeClass: string;
}) {
  return (
    <label>
      <input
        type="checkbox"
        checked={checked}
        disabled={loading}
        onChange={e => onChange(e.target.checked)}
      />
      {' '}
      <span className={`poi-badge-inline ${badgeClass}`}>{badgeClass === 'sbux-s-badge' ? 'S' : badgeClass === 'cafe-badge' ? 'C' : 'B'}</span>
      {' '}
      {loading ? 'Loading…' : label}
      {loading && <span className="sbux-spinner"> ⏳</span>}
    </label>
  );
}

function statusLabel(status: number | null) {
  if (status === null) return '';
  if (status === -1)   return ' ⚠ failed';
  if (status === 0)    return ' ✓ no new';
  return ` +${status} new`;
}

export default function FilterPanel({
  dataset,
  onDatasetChange,
  minFilter,
  maxFilter,
  onMinChange,
  onMaxChange,
  showLabels,
  onShowLabelsChange,
  showStarbucks,
  onShowStarbucksChange,
  starbucksLoading,
  showBakeries,
  onShowBakeriesChange,
  bakeriesLoading,
  buildMode,
  onBuildModeChange,
  onFetchArea,
  fetchStatus,
  markerCount,
}: Props) {
  const AADT_MAX = 80000;
  const STEP = 1000;

  function handleMinSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Math.min(parseInt(e.target.value), maxFilter);
    onMinChange(val);
  }

  function handleMaxSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Math.max(parseInt(e.target.value), minFilter);
    onMaxChange(val);
  }

  return (
    <div id="filter-control" className="control-panel leaflet-control">
      <b>Data Source</b>
      <div className="radio-group">
        <label>
          <input
            type="radio"
            name="dataset"
            value="embedded"
            checked={dataset === 'embedded'}
            onChange={() => onDatasetChange('embedded')}
          />
          {' '}Embedded (308)
        </label>
        <label>
          <input
            type="radio"
            name="dataset"
            value="v2"
            checked={dataset === 'v2'}
            onChange={() => onDatasetChange('v2')}
          />
          {' '}Full TxDOT (994)
        </label>
      </div>

      <hr className="panel-divider" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <b style={{ marginBottom: 0 }}>Points of Interest</b>
        <button
          onClick={() => onBuildModeChange(!buildMode)}
          className={`build-mode-btn${buildMode ? ' active' : ''}`}
        >
          {buildMode ? '🗺 Building…' : '🗺 Build map'}
        </button>
      </div>

      {buildMode && (
        <p className="build-mode-hint">
          Pan the map, then click Fetch to save POIs for that area.
        </p>
      )}

      <POICheckbox checked={showStarbucks} loading={starbucksLoading} onChange={onShowStarbucksChange} label="Starbucks" badgeClass="sbux-s-badge" />
      {buildMode && showStarbucks && <button className="fetch-btn" disabled={starbucksLoading} onClick={() => onFetchArea('starbucks')}>Fetch area{statusLabel(fetchStatus.starbucks)}</button>}

      <POICheckbox checked={showBakeries} loading={bakeriesLoading} onChange={onShowBakeriesChange} label="Bakeries &amp; patisseries" badgeClass="bakery-badge" />
      {buildMode && showBakeries && <button className="fetch-btn" disabled={bakeriesLoading} onClick={() => onFetchArea('bakeries')}>Fetch area{statusLabel(fetchStatus.bakeries)}</button>}

      <hr className="panel-divider" />

      <div className="aadt-header">
        <b>Traffic Filter (AADT)</b>
        <label className="labels-toggle">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={e => onShowLabelsChange(e.target.checked)}
          />
          {' '}Labels
        </label>
      </div>
      <div className="slider-container">
        <label htmlFor="minSlider">Min</label>
        <input
          id="minSlider"
          type="range"
          min={0}
          max={AADT_MAX}
          step={STEP}
          value={minFilter}
          onChange={handleMinSlider}
        />
      </div>
      <div className="slider-container" style={{ marginBottom: 4 }}>
        <label htmlFor="maxSlider">Max</label>
        <input
          id="maxSlider"
          type="range"
          min={0}
          max={AADT_MAX}
          step={STEP}
          value={maxFilter}
          onChange={handleMaxSlider}
        />
      </div>
      <div className="range-display">
        <span>{fmt(minFilter)} – {fmt(maxFilter)}</span>
        <span>{markerCount} station{markerCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
