import { useState, useMemo, useCallback } from 'react';
import MapView from './components/MapView';
import FilterPanel from './components/FilterPanel';
import type { Dataset, Station } from './types';

import embeddedData from '../data.json';
import v2Data from '../data_v2.json';

const embedded = embeddedData as Station[];
const v2 = v2Data as Station[];

export default function App() {
  const [dataset, setDataset] = useState<Dataset>('embedded');
  const [minFilter, setMinFilter] = useState(4000);
  const [maxFilter, setMaxFilter] = useState(40000);
  const [showLabels, setShowLabels] = useState(false);
  const [showStarbucks, setShowStarbucks] = useState(false);
  const [starbucksLoading, setStarbucksLoading] = useState(false);
  const [showCafes, setShowCafes] = useState(false);
  const [cafesLoading, setCafesLoading] = useState(false);
  const [showBakeries, setShowBakeries] = useState(false);
  const [bakeriesLoading, setBakeriesLoading] = useState(false);

  const allStations = dataset === 'embedded' ? embedded : v2;

  const filteredStations = useMemo(
    () => allStations.filter(s => s.aadt >= minFilter && s.aadt <= maxFilter),
    [allStations, minFilter, maxFilter],
  );

  const handleStarbucksLoadingChange = useCallback((loading: boolean) => {
    setStarbucksLoading(loading);
  }, []);

  const handleCafesLoadingChange = useCallback((loading: boolean) => {
    setCafesLoading(loading);
  }, []);

  const handleBakeriesLoadingChange = useCallback((loading: boolean) => {
    setBakeriesLoading(loading);
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

      <FilterPanel
        dataset={dataset}
        onDatasetChange={setDataset}
        minFilter={minFilter}
        maxFilter={maxFilter}
        onMinChange={setMinFilter}
        onMaxChange={setMaxFilter}
        showLabels={showLabels}
        onShowLabelsChange={setShowLabels}
        showStarbucks={showStarbucks}
        onShowStarbucksChange={setShowStarbucks}
        starbucksLoading={starbucksLoading}
        showCafes={showCafes}
        onShowCafesChange={setShowCafes}
        cafesLoading={cafesLoading}
        showBakeries={showBakeries}
        onShowBakeriesChange={setShowBakeries}
        bakeriesLoading={bakeriesLoading}
        markerCount={filteredStations.length}
      />

      <MapView
        stations={filteredStations}
        showLabels={showLabels}
        showStarbucks={showStarbucks}
        onStarbucksLoadingChange={handleStarbucksLoadingChange}
        showCafes={showCafes}
        onCafesLoadingChange={handleCafesLoadingChange}
        showBakeries={showBakeries}
        onBakeriesLoadingChange={handleBakeriesLoadingChange}
      />
    </>
  );
}
