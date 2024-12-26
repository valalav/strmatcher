import { STRProfile, STRMatch, MarkerCount } from '@/utils/constants';
import { calculateGeneticDistance } from '@/utils/calculations';

interface WorkerParams {
 query: STRProfile;
 database: STRProfile[];
 markerCount: MarkerCount; 
 maxDistance: number;
 maxMatches: number;
}

export interface WorkerResponse {
 type: 'progress' | 'complete' | 'error';
 data?: STRMatch[];
 progress?: number;
 message?: string;
}

const findMatches = (
  query: STRProfile,
  database: STRProfile[],
  markerCount: MarkerCount,
  maxDistance: number,
  maxMatches: number
): STRMatch[] => {

  console.log('Starting findMatches with:', {
    queryKit: query.kitNumber,
    databaseSize: database.length,
    markerCount,
    maxDistance
  });

  if (!query?.markers || !database?.length || !markerCount) {
    console.log('Invalid input parameters');
    return [];
  }

  const matches: STRMatch[] = [];

  try {
    database.forEach((profile, index) => {
      if (!profile?.markers || profile.kitNumber === query.kitNumber) {
        return;
      }

      const result = calculateGeneticDistance(query.markers, profile.markers, markerCount);
      
      if (result.distance <= maxDistance) {
        matches.push({
          profile: {
            kitNumber: profile.kitNumber,
            name: profile.name || '',
            country: profile.country || '',
            haplogroup: profile.haplogroup || '',
            markers: profile.markers
          },
          distance: result.distance,
          comparedMarkers: result.comparedMarkers,
          identicalMarkers: result.identicalMarkers,
          percentIdentical: result.percentIdentical,
          hasAllRequiredMarkers: result.hasAllRequiredMarkers
        });
      }

      if (index % 100 === 0) {
        self.postMessage({ type: 'progress', progress: Math.round((index / database.length) * 100) });
      }
    });

    console.log('Found matches:', matches.length);

    const sortedMatches = matches
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxMatches);

    console.log('Sorted and limited matches:', sortedMatches.length);

    return sortedMatches;

  } catch (error) {
    console.error('Error in findMatches:', error);
    return [];
  }
};

self.onmessage = (event: MessageEvent<WorkerParams>) => {
  console.log('Worker received:', {
    queryKit: event.data.query.kitNumber,
    databaseSize: event.data.database.length,
    markerCount: event.data.markerCount,
  });

  const { query, database, markerCount, maxDistance, maxMatches } = event.data;
  
  try {
    const matches = findMatches(query, database, markerCount, maxDistance, maxMatches);
    
    if (!matches || !matches.length) {
      console.log('No matches found');
      self.postMessage({
        type: 'complete',
        data: []
      });
      return;
    }

    console.log('Sending matches back:', matches.length);

    self.postMessage({
      type: 'complete',
      data: matches
    });
    
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

self.onmessage = (event: MessageEvent<WorkerParams>) => {
  const { query, database, markerCount, maxDistance, maxMatches } = event.data;
  
  try {
    const matches = findMatches(query, database, markerCount, maxDistance, maxMatches);
    
    if (!matches || !matches.length) {
      self.postMessage({
        type: 'complete',
        data: []
      } as WorkerResponse);
      return;
    }

    const processedMatches: STRMatch[] = matches.map(match => ({
      profile: {
        kitNumber: match.profile.kitNumber,
        name: match.profile.name || '',
        country: match.profile.country || '',
        haplogroup: match.profile.haplogroup || '',
        markers: match.profile.markers || {}
      },
      distance: match.distance,
      comparedMarkers: match.comparedMarkers,
      identicalMarkers: match.identicalMarkers, 
      percentIdentical: match.percentIdentical,
      hasAllRequiredMarkers: match.hasAllRequiredMarkers
    }));

    self.postMessage({
      type: 'complete',
      data: processedMatches
    } as WorkerResponse);
    
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error in worker'
    } as WorkerResponse);
  }
};