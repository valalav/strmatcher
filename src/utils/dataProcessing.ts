import { markers, palindromes } from './constants';
import Papa from 'papaparse';
import type { STRProfile } from './constants';

const valueCache = new Map<string, string>();

// Очистка значения от лишних символов
export function cleanValue(value: string | number | null | undefined): string {
  if (!value) return '';
  
  const key = String(value);
  if (valueCache.has(key)) {
    return valueCache.get(key)!;
  }

  const cleaned = String(value)
    .trim()
    .replace(/\u00a0/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, '');

  if (valueCache.size > 10000) valueCache.clear();
  valueCache.set(key, cleaned);
  return cleaned;
}

// Обработка палиндромных маркеров
function processPalindromicMarker(value: string, marker: string): string {
  if (!(marker in palindromes)) return value;

  const values = value.split(/[-,]/);
  if (values.length !== palindromes[marker as keyof typeof palindromes]) {
    return value;
  }

  return values
    .map(v => cleanValue(v))
    .sort((a, b) => Number(a) - Number(b))
    .join('-');
}

// Парсинг CSV данных
export function parseCSVData(
  text: string,
  onProgress?: (progress: number) => void
): Promise<STRProfile[]> {
  return new Promise((resolve, reject) => {
    try {
      const lines = text.split('\n').length;
      const profiles: STRProfile[] = [];
      let currentLine = 0;

      Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => {
          const cleanHeader = header
            .trim()
            .replace(/^﻿/, '')
            .replace(/[^\x20-\x7E]/g, '')
            .replace(/\s+/g, ' ');

          return cleanHeader === 'KitNumber' || cleanHeader === 'Kit_Number'
            ? 'Kit Number'
            : cleanHeader;
        },
        step: (results: Papa.ParseStepResult<Record<string, string>>) => {
          try {
            if (results.data && typeof results.data === 'object' && 'Kit Number' in results.data) {
              const cleanString = (value: string | undefined) =>
                value ? value.replace(/\s+/g, ' ').trim() : undefined;
              const profile: STRProfile = {
                kitNumber: cleanString('Kit Number' in results.data ? results.data['Kit Number'] : undefined) ?? '',
                name: cleanString('Name' in results.data ? results.data['Name'] : undefined) ?? '',
                country: cleanString('Country' in results.data ? results.data['Country'] : undefined) ?? '',
                haplogroup: cleanString('Haplogroup' in results.data ? results.data['Haplogroup'] : undefined) ?? '',
                markers: {},
              };

              let hasMarkers = false;
              markers.forEach((marker) => {
                if (marker in results.data && results.data[marker]) {
                  const value = results.data[marker];
                  const cleanedValue = cleanString(value);
                  if (cleanedValue) {
                    profile.markers[marker] = processPalindromicMarker(
                      cleanedValue,
                      marker
                    );
                    hasMarkers = true;
                  }
                }
              });

              if (hasMarkers) {
                profiles.push(profile);
              }
            }

            currentLine++;
            if (onProgress) {
              onProgress((currentLine / lines) * 100);
            }
          } catch (error: unknown) {
            console.warn('Error processing row:', error);
          }
        },
        complete: () => {
          if (profiles.length === 0) {
            reject(new Error('No valid profiles found in the data'));
          } else {
            resolve(profiles);
          }
        },
        error: (error: Error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        },
      });
    } catch (error) {
      reject(error);
    }
  });
}
export class ProfileIndex {
  private index = new Map<string, Map<string, Set<string>>>();

  constructor(profiles: STRProfile[]) {
    this.buildIndex(profiles);
  }

  private buildIndex(profiles: STRProfile[]) {
    profiles.forEach((profile) => {
      Object.entries(profile.markers).forEach(([marker, value]) => {
        if (!this.index.has(marker)) {
          this.index.set(marker, new Map());
        }
        
        const markerIndex = this.index.get(marker);
        if (markerIndex) {
          if (!markerIndex.has(value)) {
            markerIndex.set(value, new Set());
          }
          
          const valueSet = markerIndex.get(value);
          if (valueSet) {
            valueSet.add(profile.kitNumber);
          }
        }
      });
    });
  }

  findMatchingProfiles(marker: string, value: string): Set<string> {
    const markerMap = this.index.get(marker);
    if (!markerMap) return new Set();
    const valueSet = markerMap.get(value);
    return valueSet || new Set();
  }

  getMarkerValues(marker: string): string[] {
    const markerMap = this.index.get(marker);
    return markerMap ? Array.from(markerMap.keys()) : [];
  }
}

// Кэширование результатов
const resultCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export function getCachedResult<T>(key: string, compute: () => T): T {
  const cached = resultCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  const result = compute();
  resultCache.set(key, { data: result, timestamp: Date.now() });
  return result;
}

// Очистка кэша
export function clearCache() {
  valueCache.clear();
  resultCache.clear();
}
