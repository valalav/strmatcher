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

 if (!query?.markers || !database?.length || !markerCount) {
   return [];
 }

 const matches: STRMatch[] = [];

 try {
   database.forEach((profile, index) => {
     if (!profile?.markers || profile.kitNumber === query.kitNumber) {
       return;
     }

     const result = calculateGeneticDistance(query.markers, profile.markers, markerCount);
     
     if (!result.hasAllRequiredMarkers) {
       return;
     }

     if (result.distance <= maxDistance) {
       matches.push({
         profile,
         distance: result.distance,
         comparedMarkers: result.comparedMarkers,
         identicalMarkers: result.identicalMarkers,
         percentIdentical: result.percentIdentical,
         hasAllRequiredMarkers: result.hasAllRequiredMarkers
       });
     }

     if (index % 100 === 0) {
       const progress = Math.round((index / database.length) * 100);
       self.postMessage({ type: 'progress', progress });
     }
   });

   return matches
     .sort((a, b) => a.distance - b.distance)
     .slice(0, maxMatches);

 } catch (error) {
   console.error('Error in findMatches:', error);
   return [];
 }
};

self.onmessage = (event: MessageEvent<WorkerParams>) => {
 const { query, database, markerCount, maxDistance, maxMatches } = event.data;
 
 try {
   const matches = findMatches(query, database, markerCount, maxDistance, maxMatches);
   
   if (!matches) {
     self.postMessage({
       type: 'complete',
       data: []
     });
     return;
   }

   const processedMatches = matches.map(match => ({
     profile: {
       kitNumber: match.profile.kitNumber,
       name: match.profile.name || '',
       country: match.profile.country || '',
       haplogroup: match.profile.haplogroup || '',
       markers: match.profile.markers
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
   });
   
 } catch (error) {
   self.postMessage({
     type: 'error',
     message: error instanceof Error ? error.message : 'Unknown error in worker'
   });
 }
};