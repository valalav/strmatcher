import { markerGroups, palindromes } from './constants';
import type { STRMatch, MarkerCount } from './constants';

// Нормализация значения маркера
export function normalizeMarkerValue(value: string | number): number {
  if (typeof value === 'undefined' || value === null || value === '') return NaN;
  return parseInt(String(value).trim());
}

// Подсчет разницы между значениями маркеров
export function calculateMarkerDifference(value1: string, value2: string, marker: string): number {
  const isPalindromic = marker in palindromes;

  if (!isPalindromic) {
    const val1 = normalizeMarkerValue(value1);
    const val2 = normalizeMarkerValue(value2);
    if (isNaN(val1) || isNaN(val2)) return NaN;
    const diff = Math.abs(val1 - val2);
    return Math.min(diff, 2);
  }

  const vals1 = value1.split('-');
  const vals2 = value2.split('-');
  if (vals1.length !== vals2.length) return NaN;

  let totalDiff = 0;
  for (let i = 0; i < vals1.length; i++) {
    const val1 = parseInt(vals1[i]);
    const val2 = parseInt(vals2[i]);
    if (isNaN(val1) || isNaN(val2)) return NaN;
    totalDiff += Math.abs(val1 - val2);
  }
  return Math.min(totalDiff, 2);
}

export interface GeneticDistanceResult {
  distance: number;
  comparedMarkers: number;
  identicalMarkers: number;
  percentIdentical: number;
  hasAllRequiredMarkers: boolean;
}

// Подсчет количества доступных маркеров
function countAvailableMarkers(profile: Record<string, string>, range: string[]): number {
  let count = 0;
  for (const marker of range) {
    if (profile[marker]?.trim()) {
      if (palindromes[marker]) {
        count++;
      } else {
        count++;
      }
    }
  }
  return count;
}

// Подсчет генетической дистанции
export function calculateGeneticDistance(
  profile1: Record<string, string>,
  profile2: Record<string, string>, 
  selectedMarkerCount: MarkerCount
): GeneticDistanceResult {
  const markersToCompare = markerGroups[selectedMarkerCount];
  let totalDistance = 0;
  let identicalCount = 0;

  const maxIndex = {
    12: markersToCompare.indexOf('DYS389ii'),
    37: markersToCompare.indexOf('DYS438'),
    67: markersToCompare.indexOf('DYS492'),
    111: markersToCompare.length - 1
  }[selectedMarkerCount];

  let comparedCount = 0;
  for (let i = 0; i <= maxIndex; i++) {
    const marker = markersToCompare[i];
    const value1 = profile1[marker]?.trim();
    const value2 = profile2[marker]?.trim();

    if (!value1 || !value2) continue;

    const diff = calculateMarkerDifference(value1, value2, marker);
    if (isNaN(diff)) continue;

    comparedCount++;
    totalDistance += diff;
    if (diff === 0) identicalCount++;
  }

  const minRequired = {
    12: 10,
    37: 25,
    67: 25,
    111: 25
  }[selectedMarkerCount];

  return {
    distance: totalDistance,
    comparedMarkers: comparedCount,
    identicalMarkers: identicalCount,
    percentIdentical: comparedCount > 0 ? (identicalCount / comparedCount) * 100 : 0,
    hasAllRequiredMarkers: comparedCount >= minRequired
  };
}

export interface MarkerRarityResult {
  rarity: number;
  rarityStyle: React.CSSProperties | null;
}

// Подсчет редкости маркера
export function calculateMarkerRarity(
  matches: STRMatch[],
  marker: string,
  value: string,
  queryValue: string
): MarkerRarityResult {
  if (!value || value !== queryValue) {
    return { rarity: 0, rarityStyle: null };
  }

  const matchingRecords = matches.filter(match => 
    match.profile.markers[marker] === queryValue
  );

  const percentage = (matchingRecords.length / matches.length) * 100;

  if (matches.length < 20) {
    return { rarity: percentage, rarityStyle: null };
  }

  let backgroundColor: string;
  if (percentage <= 4) {
    backgroundColor = '#800000';
  } else if (percentage <= 8) {
    backgroundColor = '#B22222';
  } else if (percentage <= 12) {
    backgroundColor = '#DC3545';
  } else if (percentage <= 20) {
    backgroundColor = '#F08080';
  } else if (percentage <= 33) {
    backgroundColor = '#FFB6C1';
  } else {
    return { rarity: percentage, rarityStyle: null };
  }

  return {
    rarity: percentage,
    rarityStyle: {
      backgroundColor,
      color: backgroundColor === '#FFB6C1' ? '#000000' : '#FFFFFF'
    }
  };
}