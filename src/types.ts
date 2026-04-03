export interface Station {
  lat: number;
  lon: number;
  road: string;
  aadt: number;
  county: string;
  station: string;
}

export interface StarbucksLocation {
  lat: number;
  lon: number;
  name: string;
  address: string;
}

export type Dataset = 'embedded' | 'v2';
