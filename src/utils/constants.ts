export const markers = [
  "DYS393", "DYS390", "DYS19", "DYS391", "DYS385", 
  "DYS426", "DYS388", "DYS439", "DYS389i", "DYS392", 
  "DYS389ii", "DYS458", "DYS459", "DYS455", "DYS454", 
  "DYS447", "DYS437", "DYS448", "DYS449", "DYS464",
  "DYS460", "Y-GATA-H4", "YCAII", "DYS456", "DYS607",
  "DYS576", "DYS570", "CDY", "DYS442", "DYS438", 
  "DYS531", "DYS578", "DYF395S1", "DYS590", "DYS537",
  "DYS641", "DYS472", "DYF406S1", "DYS511", "DYS425",
  "DYS413", "DYS557", "DYS594", "DYS436", "DYS490",
  "DYS534", "DYS450", "DYS444", "DYS481", "DYS520",
  "DYS446", "DYS617", "DYS568", "DYS487", "DYS572",
  "DYS640", "DYS492", "DYS565", "DYS710", "DYS485",
  "DYS632", "DYS495", "DYS540", "DYS714", "DYS716",
  "DYS717", "DYS505", "DYS556", "DYS549", "DYS589",
  "DYS522", "DYS494", "DYS533", "DYS636", "DYS575",
  "DYS638", "DYS462", "DYS452", "DYS445", "Y-GATA-A10",
  "DYS463", "DYS441", "Y-GGAAT-1B07", "DYS525", "DYS712",
  "DYS593", "DYS650", "DYS532", "DYS715", "DYS504",
  "DYS513", "DYS561", "DYS552", "DYS726", "DYS635",
  "DYS587", "DYS643", "DYS497", "DYS510", "DYS434",
  "DYS461", "DYS435"
];

export const markerCountOptions = [12, 37, 67, 111] as const;

export const markerGroups = {
  12: markers.slice(0, 12),
  37: markers.slice(0, 37),
  67: markers.slice(0, 67),
  111: markers
} as const;

export type MarkerCount = keyof typeof markerGroups;

export const defaultMaxDistance: Record<MarkerCount, number> = {
  12: 5,
  37: 25,
  67: 35,
  111: 50
};

export const palindromes = {
  "DYS385": 2,
  "DYS464": 4,
  "DYS459": 2,
  "YCAII": 2,
  "CDY": 2,
  "DYF395S1": 2,
  "DYS413": 2
} as const;

export type MarkerSortOrder = 'default' | 'mutation_rate';

export interface MarkerSortOption {
  value: MarkerSortOrder;
  label: string;
}

export interface STRProfile {
  kitNumber: string;
  name?: string;
  country?: string;
  haplogroup?: string;
  markers: Record<string, string>;
}

export interface STRMatch {
  profile: STRProfile;
  distance: number;
  comparedMarkers: number;
  identicalMarkers: number;
  percentIdentical: number;
  hasAllRequiredMarkers: boolean;
}

export interface HistoryItem extends STRProfile {
  timestamp: Date;
}

export interface Repository {
  id: string;
  name: string;
  description?: string;
  category?: string;
  url: string;
  type: 'google_sheet' | 'excel' | 'other';
  sheetName?: string;
}

export { 
  markers, 
  markerGroups, 
  markerCountOptions,
  defaultMaxDistance,
  palindromes
};