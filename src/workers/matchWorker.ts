import { STRProfile, STRMatch, MarkerCount } from '@/utils/constants';
import { calculateGeneticDistance } from '@/utils/calculations';

export interface WorkerResponse {
  type: 'progress' | 'complete' | 'error';
  data?: STRMatch[];
  progress?: number;
  error?: string;
}

interface WorkerParams {
  query: STRProfile;
  database: STRProfile[];
  markerCount: MarkerCount; 
  maxDistance: number;
  maxMatches: number;
}

const findMatches = (
  query: STRProfile,
  database: STRProfile[],
  markerCount: MarkerCount,
  maxDistance: number,
  maxMatches: number
): STRMatch[] => {
  
  console.log('Worker starting match search with params:', {
    queryKit: query.kitNumber,
    dbSize: database.length,
    markers: markerCount,
    maxDist: maxDistance,
    maxMatches
  });

  if (!query?.markers || !database?.length || !markerCount) {
    console.error('Invalid input params:', {
      hasMarkers: !!query?.markers,
      dbLength: database?.length,
      markerCount
    });
    return [];
  }

  const matches: STRMatch[] = [];

  try {
    let processedCount = 0;
    
    database.forEach((profile) => {
      processedCount++;
      
      if (processedCount % 100 === 0) {
        console.log(`Processed ${processedCount}/${database.length} profiles`);
      }

      if (!profile?.markers || profile.kitNumber === query.kitNumber) {
        return;
      }

      const result = calculateGeneticDistance(query.markers, profile.markers, markerCount);
      
      console.log('Distance calculation:', {
        kit: profile.kitNumber,
        distance: result.distance,
        compared: result.comparedMarkers,
        identical: result.identicalMarkers
      });

      if (result.distance <= maxDistance) {
        const match: STRMatch = {
          profile: {
            kitNumber: profile.kitNumber,
            name: profile.name || '',
            country: profile.country || '',
            haplogroup: profile.haplogroup || '',
            markers: {...profile.markers}
          },
          distance: result.distance,
          comparedMarkers: result.comparedMarkers,
          identicalMarkers: result.identicalMarkers,
          percentIdentical: result.percentIdentical,
          hasAllRequiredMarkers: result.hasAllRequiredMarkers
        };

        console.log('Found match:', {
          kit: match.profile.kitNumber,
          distance: match.distance,
          identical: match.identicalMarkers
        });

        matches.push(match);
      }
    });

    const sortedMatches = matches
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxMatches);

    console.log('Match search complete:', {
      totalFound: matches.length,
      afterSort: sortedMatches.length,
      firstMatch: sortedMatches[0]?.profile.kitNumber,
      lastMatch: sortedMatches[sortedMatches.length-1]?.profile.kitNumber
    });

    return sortedMatches;

  } catch (error) {
    console.error('Error in findMatches:', error);
    return [];
  }
};

self.onmessage = (event: MessageEvent<WorkerParams>) => {
  console.log('Worker received message:', {
    queryKit: event.data.query.kitNumber,
    dbSize: event.data.database.length
  });

  const { query, database, markerCount, maxDistance, maxMatches } = event.data;
  
  try {
    const matches = findMatches(query, database, markerCount, maxDistance, maxMatches);

    console.log('Preparing worker response:', {
      matchCount: matches.length,
      first: matches[0]?.profile.kitNumber
    });

    const response: WorkerResponse = {
      type: 'complete' as const,
      data: matches
    };

    self.postMessage(response);

  } catch (error) {
    console.error('Worker error:', error);
    
    self.postMessage({
      type: 'error' as const,
      error: error instanceof Error ? error.message : 'Unknown error in worker'
    });
  }
};