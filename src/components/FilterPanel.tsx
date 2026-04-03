import type { Dataset } from '../types';

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
  markerCount: number;
}

function fmt(n: number) {
  return n.toLocaleString();
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

      <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #ddd' }} />

      <label>
        <input
          type="checkbox"
          checked={showLabels}
          onChange={e => onShowLabelsChange(e.target.checked)}
        />
        {' '}Show traffic numbers
      </label>

      <label>
        <input
          type="checkbox"
          checked={showStarbucks}
          disabled={starbucksLoading}
          onChange={e => onShowStarbucksChange(e.target.checked)}
        />
        <span className="sbux-label">{starbucksLoading ? ' Loading…' : ' Show Starbucks'}</span>
        {starbucksLoading && <span className="sbux-spinner"> ⏳</span>}
      </label>

      <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #ddd' }} />

      <b>Filter by Traffic (AADT)</b>
      <div className="slider-container">
        <label htmlFor="minSlider">Minimum:</label>
        <input
          id="minSlider"
          type="range"
          min={0}
          max={AADT_MAX}
          step={STEP}
          value={minFilter}
          onChange={handleMinSlider}
        />
        <div className="slider-values">
          <span>{fmt(minFilter)}</span>
          <span>{markerCount} station{markerCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="slider-container">
        <label htmlFor="maxSlider">Maximum:</label>
        <input
          id="maxSlider"
          type="range"
          min={0}
          max={AADT_MAX}
          step={STEP}
          value={maxFilter}
          onChange={handleMaxSlider}
        />
        <div className="slider-values">
          <span>{fmt(maxFilter)}</span>
        </div>
      </div>
    </div>
  );
}
