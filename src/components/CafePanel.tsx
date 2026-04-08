interface Props {
  showCoffee: boolean;
  onShowCoffeeChange: (v: boolean) => void;
  showCafeType: boolean;
  onShowCafeTypeChange: (v: boolean) => void;
  minReviews: number;
  onMinReviewsChange: (v: number) => void;
  locationCount: number;
}

const REVIEWS_MAX = 1000;
const STEP = 25;

export default function CafePanel({
  showCoffee,
  onShowCoffeeChange,
  showCafeType,
  onShowCafeTypeChange,
  minReviews,
  onMinReviewsChange,
  locationCount,
}: Props) {
  return (
    <div className="control-panel leaflet-control">
      <b>Cafe Explorer</b>

      <label>
        <input
          type="checkbox"
          checked={showCoffee}
          onChange={e => onShowCoffeeChange(e.target.checked)}
        />
        {' '}
        <span className="poi-badge-inline cafe-badge">C</span>
        {' '}Coffee shops
      </label>

      <label>
        <input
          type="checkbox"
          checked={showCafeType}
          onChange={e => onShowCafeTypeChange(e.target.checked)}
        />
        {' '}
        <span className="poi-badge-inline cafe-other-badge">Ca</span>
        {' '}Cafes &amp; more
      </label>

      <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #ddd' }} />

      <b>Min. reviews</b>
      <div className="slider-container">
        <input
          type="range"
          min={0}
          max={REVIEWS_MAX}
          step={STEP}
          value={minReviews}
          onChange={e => onMinReviewsChange(parseInt(e.target.value))}
        />
        <div className="slider-values">
          <span>{minReviews === REVIEWS_MAX ? `${REVIEWS_MAX}+` : minReviews}</span>
          <span>{locationCount} location{locationCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}
