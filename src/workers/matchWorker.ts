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

  console.log('Worker findMatches started:', {
    queryKit: query.kitNumber,
    queryMarkers: Object.keys(query.markers).length,
    databaseSize: database.length,
    markerCount,
    maxDistance
  });

  if (!query?.markers || !database?.length || !markerCount) {
    console.error('Invalid input parameters:', {
      hasMarkers: !!query?.markers,
      databaseLength: database?.length,
      markerCount
    });
    return [];
  }

  const matches: STRMatch[] = [];

  try {
    database.forEach((profile, index) => {
      if (!profile?.markers || profile.kitNumber === query.kitNumber) {
        console.log('Skipping profile:', {
          hasMarkers: !!profile?.markers,
          kitNumber: profile?.kitNumber,
          index
        });
        return;
      }

      const result = calculateGeneticDistance(query.markers, profile.markers, markerCount);
      console.log('Distance calculated:', {
        kit: profile.kitNumber,
        distance: result.distance,
        compared: result.comparedMarkers,
        identical: result.identicalMarkers,
        maxDistance
      });

      if (result.distance <= maxDistance) {
        const match: STRMatch = {
          profile: {
            kitNumber: profile.kitNumber,
            name: profile.name || '',
            country: profile.country || '',
            haplogroup: profile.haplogroup || '',
            markers: {...profile.markers} // Создаем копию маркеров
          },
          distance: result.distance,
          comparedMarkers: result.comparedMarkers,
          identicalMarkers: result.identicalMarkers,
          percentIdentical: result.percentIdentical,
          hasAllRequiredMarkers: result.hasAllRequiredMarkers
        };

        console.log('Added match:', {
          kit: match.profile.kitNumber,
          distance: match.distance,
          markers: Object.keys(match.profile.markers).length
        });

        matches.push(match);
      }

      if (index % 100 === 0) {
        self.postMessage({ type: 'progress', progress: Math.round((index / database.length) * 100) });
      }
    });

    console.log('Total matches found:', matches.length);

    const sortedMatches = matches
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxMatches);

    console.log('After sorting and limiting:', {
      before: matches.length,
      after: sortedMatches.length,
      firstMatch: sortedMatches[0]?.profile.kitNumber,
      lastMatch: sortedMatches[sortedMatches.length - 1]?.profile.kitNumber
    });

    return sortedMatches;

  } catch (error) {
    console.error('Error in findMatches:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return [];
  }
};

self.onmessage = (event: MessageEvent<WorkerParams>) => {
  console.log('Worker received message:', {
    queryKit: event.data.query.kitNumber,
    databaseSize: event.data.database.length,
    markerCount: event.data.markerCount
  });

  const { query, database, markerCount, maxDistance, maxMatches } = event.data;
  
  try {
    const matches = findMatches(query, database, markerCount, maxDistance, maxMatches);
    
    if (!matches || !matches.length) {
      console.log('No matches found, sending empty array');
      self.postMessage({
        type: 'complete',
        data: [],
      } as WorkerResponse);
      return;
    }

    console.log('Preparing response:', {
      matchesFound: matches.length,
      firstMatchKit: matches[0]?.profile.kitNumber,
      firstMatchDistance: matches[0]?.distance
    });

    const processedMatches = matches.map(match => ({
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

    console.log('Sending final response:', {
      matchesCount: processedMatches.length,
      firstProcessedMatch: processedMatches[0]
    });

    self.postMessage({
      type: 'complete',
      data: processedMatches
    } as WorkerResponse);
    
  } catch (error) {
    console.error('Worker error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error in worker'
    } as WorkerResponse);
  }
};