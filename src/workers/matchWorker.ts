import { STRProfile, MarkerCount, markerGroups } from '../utils/constants';
import { calculateGeneticDistance } from '../utils/calculations';

declare const self: Worker & typeof globalThis;

interface WorkerMessage {
  query: STRProfile;
  database: STRProfile[];
  markerCount: MarkerCount;
  maxDistance: number;
  maxMatches: number;
}

interface WorkerResult {
  profile: STRProfile;
  distance: number;
  comparedMarkers: number;
  identicalMarkers: number;
  percentIdentical: number;
  hasAllRequiredMarkers: boolean;
}

type WorkerResponse = {
  type: 'complete';
  data: WorkerResult[];
} | {
  type: 'progress';
  progress: number;
} | {
  type: 'error';
  error: string;
};

self.onmessage = function(e: MessageEvent<WorkerMessage>) {
  console.log('Worker received message:', {
    queryKit: e.data.query.kitNumber,
    dbSize: e.data.database.length,
    markerCount: e.data.markerCount
  });

  const { query, database, markerCount, maxDistance, maxMatches } = e.data;
  
  try {
    const markersToCompare = markerGroups[markerCount];
    const maxIndex = {
      12: markersToCompare.indexOf('DYS389ii'),
      37: markersToCompare.indexOf('DYS438'),
      67: markersToCompare.indexOf('DYS492'),
      111: markersToCompare.length - 1
    }[markerCount];

    console.log('Using markers range:', {
      count: markerCount,
      maxIndex,
      markersSet: markersToCompare.slice(0, maxIndex + 1)
    });

    // Фильтруем маркеры запроса
    const queryMarkers = Object.entries(query.markers)
      .filter(([key, value]) => 
        value?.trim() && 
        markersToCompare.indexOf(key) <= maxIndex
      )
      .reduce<Record<string, string>>((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    console.log('Filtered query markers:', {
      total: Object.keys(query.markers).length,
      filtered: Object.keys(queryMarkers).length
    });

    let processedCount = 0;
    const totalProfiles = database.length;

    const results = database
      .map(profile => {
        processedCount++;
        if (processedCount % 100 === 0) {
          self.postMessage({
            type: 'progress',
            progress: (processedCount / totalProfiles) * 100
          });
        }

        if (profile.kitNumber === query.kitNumber) return null;

        // Фильтруем маркеры профиля
        const profileMarkers = Object.entries(profile.markers)
          .filter(([key, value]) => 
            key in queryMarkers && 
            value?.trim() &&
            markersToCompare.indexOf(key) <= maxIndex
          )
          .reduce<Record<string, string>>((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {});

        const comparedMarkers = Object.keys(profileMarkers).length;

        if (comparedMarkers < Object.keys(queryMarkers).length) {
          return null;
        }

        const result = calculateGeneticDistance(
          queryMarkers,
          profileMarkers,
          markerCount
        );

        if (!result.hasAllRequiredMarkers || result.distance > maxDistance) {
          return null;
        }

        console.log('Match found:', {
          kit: profile.kitNumber,
          distance: result.distance,
          compared: result.comparedMarkers,
          identical: result.identicalMarkers
        });

        return {
          profile: {
            ...profile,
            markers: profileMarkers
          },
          ...result
        };
      })
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxMatches);

    console.log('Search complete:', {
      totalMatches: results.length,
      firstMatch: results[0]?.profile.kitNumber,
      lastMatch: results[results.length - 1]?.profile.kitNumber,
      firstDistance: results[0]?.distance,
      lastDistance: results[results.length - 1]?.distance
    });

    self.postMessage({
      type: 'complete' as const,
      data: results
    });

  } catch (error) {
    console.error('Worker error:', error);
    
    self.postMessage({
      type: 'error' as const,
      error: error instanceof Error ? error.message : 'Unknown error in worker'
    });
  }
};