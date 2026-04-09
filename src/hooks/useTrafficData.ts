import { useState, useMemo, useEffect } from 'react';
import type { Dataset, Station } from '../types';
import embeddedData from '../data/embedded.json';

// Eagerly load the default (small) dataset; v2 is split into a separate chunk
const embedded = embeddedData as Station[];

export interface TrafficData {
  dataset: Dataset;
  setDataset: (d: Dataset) => void;
  minFilter: number;
  setMinFilter: (v: number) => void;
  maxFilter: number;
  setMaxFilter: (v: number) => void;
  showLabels: boolean;
  setShowLabels: (v: boolean) => void;
  filteredStations: Station[];
  v2Loading: boolean;
}

export function useTrafficData(): TrafficData {
  const [dataset, setDataset] = useState<Dataset>('embedded');
  const [minFilter, setMinFilter] = useState(4_000);
  const [maxFilter, setMaxFilter] = useState(50_000);
  const [showLabels, setShowLabels] = useState(false);

  // bundle-conditional: only load the full dataset when the user activates it
  const [v2Stations, setV2Stations] = useState<Station[] | null>(null);
  const [v2Loading, setV2Loading] = useState(false);

  useEffect(() => {
    if (dataset === 'v2' && !v2Stations && !v2Loading) {
      setV2Loading(true);
      import('../data/v2.json').then(m => {
        setV2Stations(m.default as Station[]);
        setV2Loading(false);
      });
    }
  }, [dataset, v2Stations, v2Loading]);

  const allStations = useMemo(() => {
    if (dataset === 'v2') return v2Stations ?? embedded;
    return embedded;
  }, [dataset, v2Stations]);

  const filteredStations = useMemo(
    () => allStations.filter(s => s.aadt >= minFilter && s.aadt <= maxFilter),
    [allStations, minFilter, maxFilter],
  );

  return { dataset, setDataset, minFilter, setMinFilter, maxFilter, setMaxFilter, showLabels, setShowLabels, filteredStations, v2Loading };
}

