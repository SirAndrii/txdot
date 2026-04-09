import { useState, useMemo, useCallback } from 'react';
import type { Dataset, Station, StarbucksLocation } from './types';
import type { CafeMode } from './utils/starbucksCache';
import type { NeighborhoodLayerProps } from './components/NeighborhoodLayer';
import espressoData from './data/espresso';
import embeddedData from '../data.json';
import v2Data from '../data_v2.json';
import MapView from './components/MapView';
import FilterPanel from './components/FilterPanel';
import CafePanel from './components/CafePanel';
import NeighborhoodPanel from './components/NeighborhoodPanel';

const embedded = embeddedData as Station[];
const v2       = v2Data      as Station[];

function isCoffeeLocation(cats: string[] | undefined) {
  return (cats ?? []).some(c => /coffee|espresso/i.test(c));
}

function toggleSet(prev: ReadonlySet<number>, idx: number): Set<number> {
  const next = new Set(prev);
  next.has(idx) ? next.delete(idx) : next.add(idx);
  return next;
}

export default function App() {
  const [panelOpen, setPanelOpen] = useState(true);

  // ── Traffic ────────────────────────────────────────────────────────────────
  const [dataset,    setDataset]    = useState<Dataset>('embedded');
  const [minFilter,  setMinFilter]  = useState(4_000);
  const [maxFilter,  setMaxFilter]  = useState(40_000);
  const [showLabels, setShowLabels] = useState(false);

  const allStations = dataset === 'embedded' ? embedded : v2;
  const filteredStations = useMemo(
    () => allStations.filter(s => s.aadt >= minFilter && s.aadt <= maxFilter),
    [allStations, minFilter, maxFilter],
  );

  // ── POI ────────────────────────────────────────────────────────────────────
  const [showStarbucks,    setShowStarbucks]    = useState(false);
  const [starbucksLoading, setStarbucksLoading] = useState(false);
  const [showBakeries,     setShowBakeries]     = useState(false);
  const [bakeriesLoading,  setBakeriesLoading]  = useState(false);
  const [buildMode,        setBuildMode]        = useState(false);
  const [fetchKeys,   setFetchKeys]   = useState<Record<CafeMode, number>>({ starbucks: 0, cafes: 0, bakeries: 0 });
  const [fetchStatus, setFetchStatus] = useState<Record<CafeMode, number | null>>({ starbucks: null, cafes: null, bakeries: null });

  const fetchArea = useCallback((mode: CafeMode) => {
    setFetchStatus(prev => ({ ...prev, [mode]: null }));
    setFetchKeys(prev  => ({ ...prev, [mode]: prev[mode] + 1 }));
  }, []);

  const reportFetchResult = useCallback((mode: string, added: number) => {
    setFetchStatus(prev => ({ ...prev, [mode]: added }));
  }, []);

  // ── Cafe explorer ──────────────────────────────────────────────────────────
  const [showCoffee,   setShowCoffee]   = useState(false);
  const [showCafeType, setShowCafeType] = useState(false);
  const [minReviews,   setMinReviews]   = useState(0);

  const coffeeLocations = useMemo<StarbucksLocation[]>(() => {
    if (!showCoffee) return [];
    return espressoData.filter(loc => isCoffeeLocation(loc.categories) && (loc.reviews ?? 0) >= minReviews);
  }, [showCoffee, minReviews]);

  const cafeLocations = useMemo<StarbucksLocation[]>(() => {
    if (!showCafeType) return [];
    return espressoData.filter(loc => !isCoffeeLocation(loc.categories) && (loc.reviews ?? 0) >= minReviews);
  }, [showCafeType, minReviews]);

  // ── Census tracts ──────────────────────────────────────────────────────────
  const [showCensus,    setShowCensus]    = useState(false);
  const [censusLoading, setCensusLoading] = useState(false);
  const [showIncome,    setShowIncome]    = useState(true);
  const [showDensity,   setShowDensity]   = useState(false);
  const [hiddenIncomeBuckets,  setHiddenIncomeBuckets]  = useState<ReadonlySet<number>>(new Set());
  const [hiddenDensityBuckets, setHiddenDensityBuckets] = useState<ReadonlySet<number>>(new Set());
  const [andMode, setAndMode] = useState(false);

  const toggleIncomeBucket  = useCallback((idx: number) => setHiddenIncomeBuckets(prev  => toggleSet(prev, idx)), []);
  const toggleDensityBucket = useCallback((idx: number) => setHiddenDensityBuckets(prev => toggleSet(prev, idx)), []);

  const censusProps: NeighborhoodLayerProps = {
    show: showCensus, showIncome, showDensity,
    hiddenIncomeBuckets, hiddenDensityBuckets,
    andMode,
    onLoadingChange: setCensusLoading,
  };

  return (
    <>
      <header>
        <div className="header-brand">
          <div className="header-accent" />
          <h1>West Houston Traffic Map</h1>
        </div>
        <div className="header-meta">
          <span className="header-pill">{filteredStations.length.toLocaleString()} stations visible</span>
          <div className="header-dot" />
          <span className="header-pill">Harris &amp; Fort Bend Counties</span>
          <div className="header-dot" />
          <span className="header-pill">TxDOT 2024 · Hover for details</span>
        </div>
      </header>

      <div className="panel-wrapper">
        {panelOpen && (
          <div className="panel-stack">
            <FilterPanel
              dataset={dataset} onDatasetChange={setDataset}
              minFilter={minFilter} onMinChange={setMinFilter}
              maxFilter={maxFilter} onMaxChange={setMaxFilter}
              showLabels={showLabels} onShowLabelsChange={setShowLabels}
              showStarbucks={showStarbucks} onShowStarbucksChange={setShowStarbucks} starbucksLoading={starbucksLoading}
              showBakeries={showBakeries} onShowBakeriesChange={setShowBakeries} bakeriesLoading={bakeriesLoading}
              buildMode={buildMode} onBuildModeChange={setBuildMode}
              fetchStatus={fetchStatus} onFetchArea={fetchArea}
              stationCount={filteredStations.length}
            />
            <CafePanel
              showCoffee={showCoffee} onShowCoffeeChange={setShowCoffee}
              showCafeType={showCafeType} onShowCafeTypeChange={setShowCafeType}
              minReviews={minReviews} onMinReviewsChange={setMinReviews}
              locationCount={coffeeLocations.length + cafeLocations.length}
            />
            <NeighborhoodPanel
              show={showCensus} onShowChange={setShowCensus} loading={censusLoading}
              showIncome={showIncome} onShowIncomeChange={setShowIncome}
              hiddenIncomeBuckets={hiddenIncomeBuckets} onToggleIncomeBucket={toggleIncomeBucket}
              showDensity={showDensity} onShowDensityChange={setShowDensity}
              hiddenDensityBuckets={hiddenDensityBuckets} onToggleDensityBucket={toggleDensityBucket}
              andMode={andMode} onAndModeChange={setAndMode}
            />
          </div>
        )}
        <button
          className={`panel-toggle-btn${panelOpen ? '' : ' collapsed'}`}
          onClick={() => setPanelOpen(p => !p)}
        >
          {panelOpen ? '↙ Hide panel' : '☰ Show filters'}
        </button>
      </div>

      <MapView
        stations={filteredStations} showLabels={showLabels}
        showStarbucks={showStarbucks} onStarbucksLoadingChange={setStarbucksLoading}
        showBakeries={showBakeries} onBakeriesLoadingChange={setBakeriesLoading}
        fetchKeys={fetchKeys} onFetchResult={reportFetchResult}
        coffeeLocations={coffeeLocations} cafeLocations={cafeLocations}
        census={censusProps}
      />
    </>
  );
}
