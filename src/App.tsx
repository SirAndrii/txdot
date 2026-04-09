import { useState, lazy, Suspense } from 'react';
import { useTrafficData } from './hooks/useTrafficData';
import { usePOI } from './hooks/usePOI';
import { useCafeExplorer } from './hooks/useCafeExplorer';
import { useCensus } from './hooks/useCensus';
import FilterPanel from './components/FilterPanel';
import CafePanel from './components/CafePanel';
import NeighborhoodPanel from './components/NeighborhoodPanel';

// bundle-dynamic-imports: Leaflet is heavy — split it into a separate chunk
const MapView = lazy(() => import('./components/MapView'));

export default function App() {
  const [panelOpen, setPanelOpen] = useState(true);

  const traffic = useTrafficData();
  const poi = usePOI();
  const cafe = useCafeExplorer();
  const census = useCensus();

  return (
    <>
      <header>
        <div className="header-brand">
          <div className="header-accent" />
          <h1>West Houston Traffic Map</h1>
        </div>
        <div className="header-meta">
          <span className="header-pill">{traffic.filteredStations.length.toLocaleString()} stations visible</span>
          <div className="header-dot" />
          <span className="header-pill">Harris &amp; Fort Bend Counties</span>
          <div className="header-dot" />
          <span className="header-pill">TxDOT 2024 · Hover for details</span>
        </div>
      </header>

      <div className="panel-wrapper">
        {panelOpen ? (
          <div className="panel-stack">
            <FilterPanel
              dataset={traffic.dataset} onDatasetChange={traffic.setDataset}
              minFilter={traffic.minFilter} onMinChange={traffic.setMinFilter}
              maxFilter={traffic.maxFilter} onMaxChange={traffic.setMaxFilter}
              showLabels={traffic.showLabels} onShowLabelsChange={traffic.setShowLabels}
              showStarbucks={poi.showStarbucks} onShowStarbucksChange={poi.setShowStarbucks} starbucksLoading={poi.starbucksLoading}
              showBakeries={poi.showBakeries} onShowBakeriesChange={poi.setShowBakeries} bakeriesLoading={poi.bakeriesLoading}
              buildMode={poi.buildMode} onBuildModeChange={poi.setBuildMode}
              fetchStatus={poi.fetchStatus} onFetchArea={poi.fetchArea}
              stationCount={traffic.filteredStations.length}
            />
            <CafePanel
              showCoffee={cafe.showCoffee} onShowCoffeeChange={cafe.setShowCoffee}
              showCafeType={cafe.showCafeType} onShowCafeTypeChange={cafe.setShowCafeType}
              minReviews={cafe.minReviews} onMinReviewsChange={cafe.setMinReviews}
              locationCount={cafe.coffeeLocations.length + cafe.cafeLocations.length}
            />
            <NeighborhoodPanel
              show={census.showCensus} onShowChange={census.setShowCensus} loading={census.censusLoading}
              showIncome={census.showIncome} onShowIncomeChange={census.setShowIncome}
              hiddenIncomeBuckets={census.hiddenIncomeBuckets} onToggleIncomeBucket={census.toggleIncomeBucket}
              showDensity={census.showDensity} onShowDensityChange={census.setShowDensity}
              hiddenDensityBuckets={census.hiddenDensityBuckets} onToggleDensityBucket={census.toggleDensityBucket}
              andMode={census.andMode} onAndModeChange={census.setAndMode}
            />
          </div>
        ) : null}
        <button
          className={`panel-toggle-btn${panelOpen ? '' : ' collapsed'}`}
          onClick={() => setPanelOpen(p => !p)}
        >
          {panelOpen ? '↙ Hide panel' : '☰ Show filters'}
        </button>
      </div>

      <Suspense fallback={<div className="map-loading">Loading map…</div>}>
        <MapView
          stations={traffic.filteredStations} showLabels={traffic.showLabels}
          showStarbucks={poi.showStarbucks} onStarbucksLoadingChange={poi.setStarbucksLoading}
          showBakeries={poi.showBakeries} onBakeriesLoadingChange={poi.setBakeriesLoading}
          fetchKeys={poi.fetchKeys} onFetchResult={poi.reportFetchResult}
          coffeeLocations={cafe.coffeeLocations} cafeLocations={cafe.cafeLocations}
          census={census.censusProps}
        />
      </Suspense>
    </>
  );
}
