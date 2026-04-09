import { useState, useCallback } from 'react';
import type { CafeMode } from '../utils/starbucksCache';

export interface POIState {
  showStarbucks: boolean;
  setShowStarbucks: (v: boolean) => void;
  starbucksLoading: boolean;
  setStarbucksLoading: (v: boolean) => void;
  showBakeries: boolean;
  setShowBakeries: (v: boolean) => void;
  bakeriesLoading: boolean;
  setBakeriesLoading: (v: boolean) => void;
  buildMode: boolean;
  setBuildMode: (v: boolean) => void;
  fetchKeys: Record<CafeMode, number>;
  fetchStatus: Record<CafeMode, number | null>;
  fetchArea: (mode: CafeMode) => void;
  reportFetchResult: (mode: string, added: number) => void;
}

export function usePOI(): POIState {
  const [showStarbucks, setShowStarbucks] = useState(false);
  const [starbucksLoading, setStarbucksLoading] = useState(false);
  const [showBakeries, setShowBakeries] = useState(false);
  const [bakeriesLoading, setBakeriesLoading] = useState(false);
  const [buildMode, setBuildMode] = useState(false);
  const [fetchKeys, setFetchKeys] = useState<Record<CafeMode, number>>({ starbucks: 0, cafes: 0, bakeries: 0 });
  const [fetchStatus, setFetchStatus] = useState<Record<CafeMode, number | null>>({ starbucks: null, cafes: null, bakeries: null });

  const fetchArea = useCallback((mode: CafeMode) => {
    setFetchStatus(prev => ({ ...prev, [mode]: null }));
    setFetchKeys(prev => ({ ...prev, [mode]: prev[mode] + 1 }));
  }, []);

  const reportFetchResult = useCallback((mode: string, added: number) => {
    setFetchStatus(prev => ({ ...prev, [mode]: added }));
  }, []);

  return {
    showStarbucks, setShowStarbucks,
    starbucksLoading, setStarbucksLoading,
    showBakeries, setShowBakeries,
    bakeriesLoading, setBakeriesLoading,
    buildMode, setBuildMode,
    fetchKeys,
    fetchStatus,
    fetchArea,
    reportFetchResult,
  };
}
