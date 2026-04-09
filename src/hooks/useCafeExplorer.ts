import { useState, useMemo, useEffect } from 'react';
import type { StarbucksLocation } from '../types';

// Hoisted per js-hoist-regexp: avoid recreating RegExp on every filter call
const COFFEE_RE = /coffee|espresso/i;

function isCoffeeLocation(cats: string[] | undefined): boolean {
  return (cats ?? []).some(c => COFFEE_RE.test(c));
}

export interface CafeExplorerState {
  showCoffee: boolean;
  setShowCoffee: (v: boolean) => void;
  showCafeType: boolean;
  setShowCafeType: (v: boolean) => void;
  minReviews: number;
  setMinReviews: (v: number) => void;
  coffeeLocations: StarbucksLocation[];
  cafeLocations: StarbucksLocation[];
}

export function useCafeExplorer(): CafeExplorerState {
  const [showCoffee, setShowCoffee] = useState(false);
  const [showCafeType, setShowCafeType] = useState(false);
  const [minReviews, setMinReviews] = useState(0);

  // bundle-conditional: delay loading the large espresso dataset until the user
  // activates the Cafe Explorer (both toggles default to off)
  const [espressoData, setEspressoData] = useState<StarbucksLocation[] | null>(null);

  useEffect(() => {
    if ((showCoffee || showCafeType) && !espressoData) {
      import('../data/espresso').then(m => {
        setEspressoData(m.default as StarbucksLocation[]);
      });
    }
  }, [showCoffee, showCafeType, espressoData]);

  // rerender-derived-state-no-effect: derive during render, not via effects
  const coffeeLocations = useMemo<StarbucksLocation[]>(() => {
    if (!showCoffee || !espressoData) return [];
    return espressoData.filter(loc => isCoffeeLocation(loc.categories) && (loc.reviews ?? 0) >= minReviews);
  }, [showCoffee, espressoData, minReviews]);

  const cafeLocations = useMemo<StarbucksLocation[]>(() => {
    if (!showCafeType || !espressoData) return [];
    return espressoData.filter(loc => !isCoffeeLocation(loc.categories) && (loc.reviews ?? 0) >= minReviews);
  }, [showCafeType, espressoData, minReviews]);

  return {
    showCoffee, setShowCoffee,
    showCafeType, setShowCafeType,
    minReviews, setMinReviews,
    coffeeLocations,
    cafeLocations,
  };
}

