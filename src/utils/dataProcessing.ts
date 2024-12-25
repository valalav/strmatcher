import { markers, palindromes } from './constants';
import Papa from 'papaparse';
import type { STRProfile } from './constants';

const valueCache = new Map<string, string>();

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

export function parseCSVData(text: string, onProgress?: (progress: number) => void): Promise<STRProfile[]> {
  return new Promise((resolve, reject) => {
    try {
      const lines = text.split('\n').length;
      const profiles: STRProfile[] = [];
      let currentLine = 0;

      Papa.parse(text, {
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
        step: (results) => {
          try {
            if (results.data['Kit Number']) {
              const cleanString = (value: string | undefined) =>
                value ? value.replace(/\s+/g, ' ').trim() : undefined;

              const profile: STRProfile = {
                kitNumber: cleanString(results.data['Kit Number']),
                name: cleanString(results.data['Name']),
                country: cleanString(results.data['Country']),
                haplogroup: cleanString(results.data['Haplogroup']),
                markers: {}
              };

              let hasMarkers = false;
              markers.forEach(marker => {
                if (results.data[marker]) {
                  const value = results.data[marker];
                  profile.markers[marker] = processPalindromicMarker(
                    cleanString(value),
                    marker
                  );
                  hasMarkers = true;
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
          } catch (error) {
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
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export class ProfileIndex {
  private index: Map<string, Map<string, Set<string>>> = new Map();

  constructor(profiles: STRProfile[]) {
    this.buildIndex(profiles);
  }

  private buildIndex(profiles: STRProfile[]) {
    profiles.forEach(profile => {
      Object.entries(profile.markers).forEach(([marker, value]) => {
        if (!this.index.has(marker)) {
          this.index.set(marker, new Map());
        }
        
        const markerIndex = this.index.get(marker)!;
        if (!markerIndex.has(value)) {
          markerIndex.set(value, new Set());
        }
        
        markerIndex.get(value)!.add(profile.kitNumber);
      });
    });
  }

  findMatchingProfiles(marker: string, value: string): Set<string> {
    return this.index.get(marker)?.get(value) || new Set();
  }

  getMarkerValues(marker: string): string[] {
    return Array.from(this.index.get(marker)?.keys() || []);
  }
}

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

export function clearCache() {
  valueCache.clear();
  resultCache.clear();
}