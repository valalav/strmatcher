import { STRProfile, STRMatch, MarkerCount } from '@/utils/constants';
import { calculateGeneticDistance } from '@/utils/calculations';

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

  console.log('Starting findMatches with:', {
    queryKit: query.kitNumber,
    databaseSize: database.length,
    markerCount,
    maxDistance 
  });

  if (!query?.markers || !database?.length || !markerCount) {
    console.warn('Invalid input parameters');
    return [];
  }

  const matches: STRMatch[] = [];

  try {
    database.forEach((profile, index) => {
      if (!profile?.markers) {
        return;
      }

      // Расчет расстояния
      const result = calculateGeneticDistance(query.markers, profile.markers, markerCount);

      // Проверка результата
      if (result.distance <= maxDistance && result.hasAllRequiredMarkers) {
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

      // Отправка прогресса
      if (index % 100 === 0) {
        self.postMessage({
          type: 'progress',
          progress: Math.round((index / database.length) * 100)
        });
      }
    });

    // Сортировка и лимит
    const sortedMatches = matches
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxMatches);

    console.log('Found matches:', matches.length);
    console.log('Sorted and limited matches:', sortedMatches.length);

    return sortedMatches;

  } catch (error) {
    console.error('Error in findMatches:', error);
    return [];
  }
};

self.onmessage = (event: MessageEvent<WorkerParams>) => {
  try {
    const { query, database, markerCount, maxDistance, maxMatches } = event.data;
    
    const matches = findMatches(query, database, markerCount, maxDistance, maxMatches);
    
    console.log('Worker sending matches:', {
      count: matches.length,
      firstMatch: matches[0] 
    });

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