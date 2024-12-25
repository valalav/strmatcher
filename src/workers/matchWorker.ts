import { STRProfile, MarkerCount } from '../utils/constants';
import { calculateGeneticDistance } from '../utils/calculations';

interface WorkerMessage {
  query: STRProfile;
  database: STRProfile[];
  markerCount: MarkerCount;
  maxDistance: number;
  maxMatches: number;
}

self.onmessage = function(e: MessageEvent<WorkerMessage>) {
  const { query, database, markerCount, maxDistance, maxMatches } = e.data;
  
  const queryMarkers = Object.entries(query.markers)
    .filter(([, value]) => value?.trim())
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  const results = database
    .map(profile => {
      if (profile.kitNumber === query.kitNumber) return null;

      const profileMarkers = Object.entries(profile.markers)
        .filter(([key]) => key in queryMarkers && profile.markers[key]?.trim())
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      const comparedMarkers = Object.keys(profileMarkers).length;
      if (comparedMarkers < Object.keys(queryMarkers).length) return null;

      const result = calculateGeneticDistance(queryMarkers, profileMarkers, markerCount);
      if (!result.hasAllRequiredMarkers || result.distance > maxDistance) return null;

      return {
        profile,
        ...result,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxMatches);

  self.postMessage({ type: 'complete', data: results });
};