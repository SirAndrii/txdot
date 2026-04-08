import { useState, useMemo, useCallback } from 'react';
import MapView from './components/MapView';
import FilterPanel from './components/FilterPanel';
import CafePanel from './components/CafePanel';
import type { Dataset, Station } from './types';
import espressoData from './data/espresso';

import embeddedData from '../data.json';
import v2Data from '../data_v2.json';

const embedded = embeddedData as Station[];
const v2 = v2Data as Station[];

type CafeMode = 'starbucks' | 'cafes' | 'bakeries';

function isCoffeeLocation(cats: string[] | undefined): boolean {
  return (cats ?? []).some(c => /coffee|espresso/i.test(c));
}

export default function App() {
  const [dataset, setDataset] = useState<Dataset>('embedded');
  const [minFilter, setMinFilter] = useState(4000);
  const [maxFilter, setMaxFilter] = useState(40000);
  const [showLabels, setShowLabels] = useState(false);
  const [showStarbucks, setShowStarbucks] = useState(false);
  const [starbucksLoading, setStarbucksLoading] = useState(false);
  const [showBakeries, setShowBakeries] = useState(false);
  const [bakeriesLoading, setBakeriesLoading] = useState(false);

  const [buildMode, setBuildMode] = useState(false);
  const [fetchKeys, setFetchKeys] = useState<Record<CafeMode, number>>({ starbucks: 0, cafes: 0, bakeries: 0 });
  const [fetchStatus, setFetchStatus] = useState<Record<CafeMode, number | null>>({ starbucks: null, cafes: null, bakeries: null });

  // Cafe panel state
  const [showCoffee, setShowCoffee] = useState(false);
  const [showCafeType, setShowCafeType] = useState(false);
  const [minReviews, setMinReviews] = useState(0);

  const allStations = dataset === 'embedded' ? embedded : v2;
  const filteredStations = useMemo(
    () => allStations.filter(s => s.aadt >= minFilter && s.aadt <= maxFilter),
    [allStations, minFilter, maxFilter],
  );

  const coffeeLocations = useMemo(() => {
    if (!showCoffee) return [];
    return espressoData.filter(loc => isCoffeeLocation(loc.categories) && (loc.reviews ?? 0) >= minReviews);
  }, [showCoffee, minReviews]);

  const cafeLocations = useMemo(() => {
    if (!showCafeType) return [];
    return espressoData.filter(loc => !isCoffeeLocation(loc.categories) && (loc.reviews ?? 0) >= minReviews);
  }, [showCafeType, minReviews]);

  const handleStarbucksLoadingChange = useCallback((loading: boolean) => { setStarbucksLoading(loading); }, []);
  const handleBakeriesLoadingChange  = useCallback((loading: boolean) => { setBakeriesLoading(loading); }, []);

  const handleFetchArea = useCallback((mode: CafeMode) => {
    setFetchStatus(prev => ({ ...prev, [mode]: null }));
    setFetchKeys(prev => ({ ...prev, [mode]: prev[mode] + 1 }));
  }, []);

  const handleFetchResult = useCallback((mode: string, added: number) => {
    setFetchStatus(prev => ({ ...prev, [mode]: added }));
  }, []);

  return (
    <>
      <header>
        <h1>West Houston Traffic — Cinco Ranch / Katy to Uptown (2024 AADT)</h1>
        <span>
          308 stations (≤80,000 AADT) &nbsp;·&nbsp; Harris &amp; Fort Bend Counties &nbsp;·&nbsp;
          TxDOT data &nbsp;·&nbsp; Hover for details
        </span>
      </header>

      <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 1000, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <FilterPanel
          dataset={dataset} onDatasetChange={setDataset}
          minFilter={minFilter} maxFilter={maxFilter} onMinChange={setMinFilter} onMaxChange={setMaxFilter}
          showLabels={showLabels} onShowLabelsChange={setShowLabels}
          showStarbucks={showStarbucks} onShowStarbucksChange={setShowStarbucks} starbucksLoading={starbucksLoading}
          showBakeries={showBakeries} onShowBakeriesChange={setShowBakeries} bakeriesLoading={bakeriesLoading}
          buildMode={buildMode} onBuildModeChange={setBuildMode}
          onFetchArea={handleFetchArea} fetchStatus={fetchStatus}
          markerCount={filteredStations.length}
        />
        <CafePanel
          showCoffee={showCoffee} onShowCoffeeChange={setShowCoffee}
          showCafeType={showCafeType} onShowCafeTypeChange={setShowCafeType}
          minReviews={minReviews} onMinReviewsChange={setMinReviews}
          locationCount={coffeeLocations.length + cafeLocations.length}
        />
      </div>

      <MapView
        stations={filteredStations} showLabels={showLabels}
        showStarbucks={showStarbucks} onStarbucksLoadingChange={handleStarbucksLoadingChange}
        showBakeries={showBakeries} onBakeriesLoadingChange={handleBakeriesLoadingChange}
        fetchKeys={fetchKeys} onFetchResult={handleFetchResult}
        coffeeLocations={coffeeLocations}
        cafeLocations={cafeLocations}
      />
    </>
  );
}
