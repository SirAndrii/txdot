import {
  incomeColor, densityColor,
  INCOME_LABELS, DENSITY_LABELS,
  INCOME_SAMPLES, DENSITY_SAMPLES,
} from './NeighborhoodLayer';

interface Props {
  show: boolean;
  onShowChange: (v: boolean) => void;
  loading: boolean;
  showIncome: boolean;
  onShowIncomeChange: (v: boolean) => void;
  hiddenIncomeBuckets: ReadonlySet<number>;
  onToggleIncomeBucket: (idx: number) => void;
  showDensity: boolean;
  onShowDensityChange: (v: boolean) => void;
  hiddenDensityBuckets: ReadonlySet<number>;
  onToggleDensityBucket: (idx: number) => void;
  andMode: boolean;
  onAndModeChange: (v: boolean) => void;
}

function LegendGroup({ label, active, onActiveChange, samples, colorFn, labels, hiddenBuckets, onToggleBucket }: {
  label: string;
  active: boolean;
  onActiveChange: (v: boolean) => void;
  samples: readonly number[];
  colorFn: (v: number) => string;
  labels: readonly string[];
  hiddenBuckets: ReadonlySet<number>;
  onToggleBucket: (idx: number) => void;
}) {
  return (
    <div className="nbhd-group">
      <label className="nbhd-group-header">
        <input type="checkbox" checked={active} onChange={e => onActiveChange(e.target.checked)} />
        {' '}{label}
      </label>
      {active && (
        <div className="nbhd-legend">
          {labels.map((lbl, idx) => {
            const hidden = hiddenBuckets.has(idx);
            return (
              <button key={lbl} className={`nbhd-legend-row${hidden ? ' nbhd-hidden' : ''}`}
                onClick={() => onToggleBucket(idx)} title={hidden ? 'Click to show' : 'Click to hide'}>
                <span className="nbhd-swatch" style={{ background: hidden ? '#e0e0e0' : colorFn(samples[idx]) }} />
                <span className="nbhd-legend-label">{lbl}</span>
                {hidden && <span className="nbhd-hidden-icon">✕</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function NeighborhoodPanel({
  show, onShowChange, loading,
  showIncome, onShowIncomeChange, hiddenIncomeBuckets, onToggleIncomeBucket,
  showDensity, onShowDensityChange, hiddenDensityBuckets, onToggleDensityBucket,
  andMode, onAndModeChange,
}: Props) {
  return (
    <div className="control-panel leaflet-control">
      <div className="nbhd-header">
        <b>Census Tracts</b>
        <label className="labels-toggle">
          <input type="checkbox" checked={show} disabled={loading} onChange={e => onShowChange(e.target.checked)} />
          {loading ? ' Loading…' : ' Show'}
          {loading && <span className="sbux-spinner"> ⏳</span>}
        </label>
      </div>

      {show && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 6px' }}>
            <p className="nbhd-hint" style={{ margin: 0 }}>Click a bracket to hide tracts.</p>
            <label className="labels-toggle" title="Show only tracts matching both income AND density">
              <input type="checkbox" checked={andMode} onChange={e => onAndModeChange(e.target.checked)} />
              {' '}AND
            </label>
          </div>
          <LegendGroup label="Median income" active={showIncome} onActiveChange={onShowIncomeChange}
            samples={INCOME_SAMPLES} colorFn={incomeColor} labels={INCOME_LABELS}
            hiddenBuckets={hiddenIncomeBuckets} onToggleBucket={onToggleIncomeBucket} />
          <LegendGroup label="Pop. density" active={showDensity} onActiveChange={onShowDensityChange}
            samples={DENSITY_SAMPLES} colorFn={densityColor} labels={DENSITY_LABELS}
            hiddenBuckets={hiddenDensityBuckets} onToggleBucket={onToggleDensityBucket} />
        </>
      )}
    </div>
  );
}
