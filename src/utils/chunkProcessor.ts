import { STRProfile } from '@/utils/constants';
import { DatabaseManager } from './storage/indexedDB';

const CHUNK_READ_SIZE = 256 * 1024; // 256KB чтение

async function* readFileChunks(file: File): AsyncGenerator<string> {
  let position = 0;
  let readHeader = false;
  const decoder = new TextDecoder();

  while (position < file.size) {
    const chunk = file.slice(position, position + CHUNK_READ_SIZE);
    const buffer = await chunk.arrayBuffer();
    const text = decoder.decode(buffer, { stream: true });
    
    if (!readHeader) {
      const headerEnd = text.indexOf('\n');
      readHeader = true;
      yield text.slice(headerEnd + 1);
    } else {
      yield text;
    }
    
    position += CHUNK_READ_SIZE;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

export async function processLargeFile(
  file: File,
  onProgress: (progress: number) => void,
  dbManager: DatabaseManager
): Promise<STRProfile[]> {
  const CHUNK_SIZE = 50 * 1024;
  const profiles: STRProfile[] = [];
  let offset = 0;
  let header: string[] = [];
  const processedKits = new Set<string>();

  try {
    console.log(`Reading first part (headers)`);
    const firstChunk = await readChunk(file, 0, CHUNK_SIZE);
    const firstLines = firstChunk.split('\n');
    header = firstLines[0].split(',').map(h => h.trim());
    console.log(`Headers:`, header);
    offset = firstChunk.indexOf('\n') + 1;

    while (offset < file.size) {
      console.log(`Reading chunk at position ${offset}`);
      const chunk = await readChunk(file, offset, CHUNK_SIZE);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (!line.trim()) continue;

        const values = line.split(',');
        const kitNumber = values[0]?.trim();

        if (!kitNumber || processedKits.has(kitNumber)) continue;

        processedKits.add(kitNumber);
        
        const profile: STRProfile = {
          kitNumber,
          name: values[1]?.trim() || '',
          country: values[2]?.trim() || '',
          haplogroup: values[3]?.trim() || '',
          markers: {}
        };

        for (let i = 4; i < values.length && i < header.length; i++) {
          if (values[i]?.trim()) {
            profile.markers[header[i]] = values[i].trim();
          }
        }

        profiles.push(profile);

        if (profiles.length % 100 === 0) {
          console.log(`Saving 100 profiles to IndexedDB...`);
          await dbManager.saveProfiles(profiles.splice(0, 100));
          await new Promise(r => setTimeout(r, 10));
        }
      }

      offset += CHUNK_SIZE;
      onProgress((offset / file.size) * 100);

      await new Promise(r => setTimeout(r, 10));
    }

    if (profiles.length > 0) {
      await dbManager.saveProfiles(profiles);
    }    

    console.log(`Load complete. Getting all profiles from IndexedDB...`);
    return await dbManager.getProfiles();
  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  }
}

async function readChunk(file: File, offset: number, size: number): Promise<string> {
  const chunk = file.slice(offset, offset + size);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(chunk);
  });
}

export { readFileChunks };