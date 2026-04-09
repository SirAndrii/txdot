import { useState, useCallback, useMemo } from 'react';
import type { NeighborhoodLayerProps } from '../components/NeighborhoodLayer';

function toggleSet(prev: ReadonlySet<number>, idx: number): Set<number> {
  const next = new Set(prev);
  next.has(idx) ? next.delete(idx) : next.add(idx);
  return next;
}

export interface CensusState {
  showCensus: boolean;
  setShowCensus: (v: boolean) => void;
  censusLoading: boolean;
  showIncome: boolean;
  setShowIncome: (v: boolean) => void;
  showDensity: boolean;
  setShowDensity: (v: boolean) => void;
  hiddenIncomeBuckets: ReadonlySet<number>;
  toggleIncomeBucket: (idx: number) => void;
  hiddenDensityBuckets: ReadonlySet<number>;
  toggleDensityBucket: (idx: number) => void;
  andMode: boolean;
  setAndMode: (v: boolean) => void;
  censusProps: NeighborhoodLayerProps;
}

export function useCensus(): CensusState {
  const [showCensus, setShowCensus] = useState(false);
  const [censusLoading, setCensusLoading] = useState(false);
  const [showIncome, setShowIncome] = useState(true);
  const [showDensity, setShowDensity] = useState(false);
  const [hiddenIncomeBuckets, setHiddenIncomeBuckets] = useState<ReadonlySet<number>>(new Set());
  const [hiddenDensityBuckets, setHiddenDensityBuckets] = useState<ReadonlySet<number>>(new Set());
  const [andMode, setAndMode] = useState(false);

  const toggleIncomeBucket = useCallback(
    (idx: number) => setHiddenIncomeBuckets(prev => toggleSet(prev, idx)),
    [],
  );
  const toggleDensityBucket = useCallback(
    (idx: number) => setHiddenDensityBuckets(prev => toggleSet(prev, idx)),
    [],
  );

  // rerender-memo: stable object reference so MapView doesn't re-render unnecessarily
  const censusProps = useMemo<NeighborhoodLayerProps>(
    () => ({
      show: showCensus,
      showIncome,
      showDensity,
      hiddenIncomeBuckets,
      hiddenDensityBuckets,
      andMode,
      onLoadingChange: setCensusLoading,
    }),
    [showCensus, showIncome, showDensity, hiddenIncomeBuckets, hiddenDensityBuckets, andMode],
  );

  return {
    showCensus, setShowCensus,
    censusLoading,
    showIncome, setShowIncome,
    showDensity, setShowDensity,
    hiddenIncomeBuckets, toggleIncomeBucket,
    hiddenDensityBuckets, toggleDensityBucket,
    andMode, setAndMode,
    censusProps,
  };
}
