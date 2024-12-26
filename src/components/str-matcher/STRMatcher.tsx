"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { markerGroups, markers } from '@/utils/constants';
import { parseCSVData } from '@/utils/dataProcessing';
import { sortOptions } from '@/utils/markerSort';
import { markerCountOptions } from '@/utils/constants';
import { DatabaseManager } from '@/utils/storage/indexedDB';
import { useWorker } from '@/hooks/useWorker';
import { exportMatches } from './ExportTools';
import type { STRProfile, STRMatch, HistoryItem, MarkerCount } from '@/utils/constants';

import STRMarkerGrid from './STRMarkerGrid';
import DatabaseInput from './DatabaseInput';
import MatchesTable from './MatchesTable';
import SearchHistory from './SearchHistory';
import DataRepositories from './DataRepositories';
import LoadedKits from './LoadedKits';

interface WorkerResponse {
  type: 'progress' | 'complete';
  data: STRMatch[];
  progress?: number;
}

interface WorkerParams {
  query: STRProfile;
  database: STRProfile[];
  markerCount: MarkerCount;
  maxDistance: number;
  maxMatches: number;
}

const STRMatcher: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [database, setDatabase] = useState<STRProfile[]>([]);
  const [query, setQuery] = useState<STRProfile | null>(null);
  const [matches, setMatches] = useState<STRMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [markerCount, setMarkerCount] = useState<MarkerCount>(37);
  const [maxDistance, setMaxDistance] = useState(25);
  const [maxMatches, setMaxMatches] = useState(200);
  const [kitNumber, setKitNumber] = useState('');
  const [searchHistory, setSearchHistory] = useState<HistoryItem[]>([]);
  const [markerSortOrder, setMarkerSortOrder] = useState<'default' | 'mutation_rate'>('mutation_rate');

  const { execute: executeMatching } = useWorker<WorkerParams, WorkerResponse>({
    onProgress: (progress) => {
      setProgress(progress);
    }
  });

  useEffect(() => {
    setMounted(true);
    const loadSavedProfiles = async () => {
      try {
        const dbManager = new DatabaseManager();
        await dbManager.init();
        const savedProfiles = await dbManager.getProfiles();
        if (savedProfiles.length > 0) {
          setDatabase(savedProfiles);
        }
      } catch (error) {
        console.error('Error loading saved profiles:', error);
      }
    };
    loadSavedProfiles();
  }, []);

  const loadDataFromUrl = async (url: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const text = await response.text();
      const profiles = await parseCSVData(text, (progress) => setProgress(progress));

      setDatabase(prev => {
        const existing = new Set(prev.map(p => p.kitNumber));
        return [...prev, ...profiles.filter(p => !existing.has(p.kitNumber))];
      });

    } catch (error) {
      console.error('Load error:', error instanceof Error ? error.message : String(error));
      setError(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleFindMatches = async () => {
    console.log("Starting handleFindMatches with:", {
      queryExists: !!query,
      queryKit: query?.kitNumber,
      databaseSize: database.length,
      markerCount,
      maxDistance,
      initialState: {
        loading,
        error,
        matchesCount: matches.length
      }
    });
  
    if (!query || !database.length) {
      console.log("Validation failed:", {query: !!query, databaseSize: database.length});
      setError("Kit number and database required");
      return;
    }
  
    setLoading(true);
    setError(null);
    setMatches([]);
  
    try {
      console.log("Preparing marker ranges");
      const currentRange = markerGroups[markerCount];
      const endMarkerIndex = {
        12: currentRange.indexOf('DYS389ii'),
        37: currentRange.indexOf('DYS438'),
        67: currentRange.indexOf('DYS492'),
        111: currentRange.length - 1
      }[markerCount];
  
      const markersInRange: Record<string, string> = {};
      for (let i = 0; i <= endMarkerIndex; i++) {
        const marker = currentRange[i];
        if (query.markers[marker]) {
          markersInRange[marker] = query.markers[marker];
        }
      }
  
      console.log("Prepared query:", {
        markersCount: Object.keys(markersInRange).length,
        markers: markersInRange,
        queryKit: query.kitNumber 
      });
  
      const compareQuery = {
        ...query,
        markers: markersInRange,
      };
  
      console.log("Executing worker");
  
      const workerResponse = await executeMatching({
        query: compareQuery,
        database: database.filter(p => p.kitNumber !== query.kitNumber),
        markerCount,
        maxDistance,
        maxMatches
      });
  
      console.log("Worker raw response:", workerResponse);
  
      if (!workerResponse) {
        console.error("No response from worker");
        throw new Error("No response from worker");
      }
  
      console.log("Worker response details:", {
        type: workerResponse.type,
        hasData: !!workerResponse.data,
        dataLength: workerResponse.data?.length,
        firstMatch: workerResponse.data?.[0]
      });
  
      if (workerResponse.type === 'complete' && Array.isArray(workerResponse.data)) {
        const matches = workerResponse.data.map(match => ({
          profile: {
            kitNumber: match.profile.kitNumber,
            name: match.profile.name || '',
            country: match.profile.country || '',
            haplogroup: match.profile.haplogroup || '',
            markers: {...match.profile.markers}
          },
          distance: match.distance,
          comparedMarkers: match.comparedMarkers,
          identicalMarkers: match.identicalMarkers,
          percentIdentical: match.percentIdentical,
          hasAllRequiredMarkers: match.hasAllRequiredMarkers
        }));
  
        console.log("Processed matches:", {
          count: matches.length,
          firstMatch: matches[0],
          sampleMarkers: matches[0]?.profile.markers
        });
  
        setMatches(matches);
      } else {
        console.error("Invalid worker response:", workerResponse);
        throw new Error("Invalid response format from worker");
      }
  
    } catch (error) {
      console.error("Error in handleFindMatches:", {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        state: {
          query: !!query,
          database: database.length,
          markerCount,
          currentState: {
            loading,
            error,
            matchesCount: matches.length
          }
        }
      });
      setError(error instanceof Error ? error.message : 'Unknown error');
      setMatches([]); 
    } finally {
      setLoading(false);
    }
  };

  const populateFromKitNumber = (selectedKitNumber: string) => {
    if (!selectedKitNumber) {
      setError('Please enter Kit Number');
      return;
    }
  
    const selectedProfile = database.find(profile => profile.kitNumber === selectedKitNumber);
    if (!selectedProfile) {
      setError('Kit Number not found in database');
      return;
    }
  
    setQuery(selectedProfile);
    setKitNumber(selectedKitNumber);
    
    if (!searchHistory.some(item => item.kitNumber === selectedKitNumber)) {
      setSearchHistory(prev => [{
        ...selectedProfile,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]);
    }
  
    const grid = document.querySelector('div[class*="overflow-x-auto"]');
    if (grid) {
      markers.forEach(marker => {
        const input = grid.querySelector(`input[id="${marker}"]`) as HTMLInputElement;
        if (input) {
          input.value = selectedProfile.markers[marker] || '';
        }
      });
    }
  
    handleFindMatches();
  };

  const resetMarkers = () => {
    markers.forEach(marker => {
      const input = document.getElementById(marker) as HTMLInputElement;
      if (input) input.value = '';
    });
    setQuery(null);
    setMatches([]);
    setKitNumber('');
  };

  const handleRemoveMatch = (matchKitNumber: string) => {
    setDatabase(prev => prev.filter(p => p.kitNumber !== matchKitNumber));
    setMatches(prev => prev.filter(m => m.profile.kitNumber !== matchKitNumber));
  };

  if (!mounted) return null;

  return (
    <div className="p-4 max-w-[1800px] mx-auto">
      <div className="flex gap-4">
        <div className="w-64 flex-none flex flex-col gap-4">
          <LoadedKits 
            profiles={database}
            onKitNumberClick={populateFromKitNumber}
          />
          {searchHistory.length > 0 && (
            <SearchHistory 
              history={searchHistory}
              onKitNumberClick={populateFromKitNumber}
            />
          )}
        </div>
        <div className="flex-1">
          <DataRepositories onLoadData={loadDataFromUrl} setDatabase={setDatabase} />
          
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>STR Haplotype Matcher</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {loading && progress > 0 && (
                <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              <div className="grid grid-cols-[300px,1fr] gap-8">
                <DatabaseInput 
                  onDataLoaded={setDatabase}
                  onError={setError}
                  onKitNumberClick={populateFromKitNumber}
                  recordCount={database.length}
                />
                
                <div className="space-y-4">
                  <div className="flex items-end gap-4">
                    <div>
                      <label className="block mb-2 font-medium">Kit Number</label>
                      <input 
                        type="text"
                        className="w-48 p-2 border rounded"
                        value={kitNumber}
                        onChange={(e) => setKitNumber(e.target.value)}
                        placeholder="Enter Kit Number"
                      />
                    </div>
                    
                    <button
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                      onClick={() => populateFromKitNumber(kitNumber)}
                      disabled={!kitNumber || loading}
                    >
                      Populate Markers
                    </button>

                    <button
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                      onClick={resetMarkers}
                    >
                      Reset
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-4 items-end">
                    <div>
                      <label className="block mb-2">Markers for comparison</label>
                      <select 
                        className="p-2 border rounded min-w-[100px]"
                        value={markerCount}
                        onChange={(e) => setMarkerCount(parseInt(e.target.value) as MarkerCount)}
                      >
                        {markerCountOptions.map(count => (
                          <option key={count} value={count}>{count}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-2">Marker order</label>
                      <select
                        className="p-2 border rounded min-w-[180px]"
                        value={markerSortOrder}
                        onChange={(e) => setMarkerSortOrder(e.target.value as 'default' | 'mutation_rate')}
                      >
                        {sortOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2">Max Genetic Distance</label>
                      <input
                        type="number"
                        className="p-2 border rounded w-24"
                        value={maxDistance}
                        onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block mb-2">Max Matches</label>
                      <input
                        type="number"
                        className="p-2 border rounded w-24"
                        value={maxMatches}
                        onChange={(e) => setMaxMatches(Math.max(1, parseInt(e.target.value) || 200))}
                        min="1"
                      />
                    </div>

                    <button
                      className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={handleFindMatches}
                      disabled={loading || !kitNumber || database.length === 0}
                    >
                      {loading ? 'Searching...' : 'Find Matches'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <STRMarkerGrid
                  initialMarkers={query?.markers || {}}
                  onMarkerChange={(marker, value) => {
                    if (query) {
                      setQuery({
                        ...query,
                        markers: { ...query.markers, [marker]: value }
                      });
                    }
                  }}
                />
              </div>

              {matches.length > 0 && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => exportMatches(matches, { format: 'csv', includeHaplogroups: true })}
                    className="px-4 py-2 bg-green-500 text-white rounded"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => exportMatches(matches, { format: 'jpg', includeHaplogroups: true })}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                  >
                    Export JPG
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {matches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Found {matches.length} matches</CardTitle>
              </CardHeader>
              <CardContent>
                <MatchesTable 
                  matches={matches} 
                  query={query}
                  onKitNumberClick={populateFromKitNumber}
                  onRemoveMatch={handleRemoveMatch}
                  sortOrder={markerSortOrder}
                  selectedMarkerCount={markerCount}
                  onFindMatches={handleFindMatches}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default STRMatcher;