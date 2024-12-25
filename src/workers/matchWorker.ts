import { STRProfile, STRMatch, MarkerCount } from '@/utils/constants';
import { calculateGeneticDistance } from '@/utils/calculations';

// Типы данных для входящего сообщения
interface WorkerParams {
  query: STRProfile;
  database: STRProfile[];
  markerCount: MarkerCount;
  maxDistance: number;
  maxMatches: number;
}

// Типы данных для выходящего сообщения
export interface WorkerResponse {
  type: 'progress' | 'complete' | 'error';
  data?: STRMatch[];
  progress?: number;
  message?: string;
}

// Функция для безопасной сериализации матча
const serializeMatch = (match: STRMatch) => {
  try {
    return {
      kitNumber: match.profile.kitNumber || 'Unknown',
      distance: match.distance,
      haplogroup: match.profile.haplogroup || 'Unknown',
      name: match.profile.name || 'Unknown',
      country: match.profile.country || 'Unknown',
      // Удалите markerDifferences, если его нет в интерфейсе
    };
  } catch (error) {
    console.error('Error serializing match:', error);
    return null;
  }
};

// Функция для поиска совпадений
const findMatches = (
  query: STRProfile,
  database: STRProfile[],
  markerCount: MarkerCount,
  maxDistance: number,
  maxMatches: number
): STRMatch[] => {
  // Валидация входных параметров
  if (!query || !database || !markerCount) {
    console.error('Invalid input parameters');
    return [];
  }

  const matches: STRMatch[] = [];
  const totalProfiles = database.length;

  // Защита от пустой базы данных
  if (totalProfiles === 0) {
    console.warn('Empty database');
    return [];
  }

  try {
    database.forEach((profile, index) => {
      // Пропускаем профили без маркеров или совпадающие с запросом
      if (!profile.markers || profile.kitNumber === query.kitNumber) {
        return;
      }

      // Рассчитываем генетическое расстояние
      const result = calculateGeneticDistance(query.markers, profile.markers, markerCount);

      // Если расстояние в пределах допустимого, добавляем в результаты
      if (result.distance <= maxDistance) {
        matches.push({
          profile,
          ...result,
        });
      }

      // Отправляем прогресс выполнения
      if (index % 100 === 0) {
        const progress = Math.round((index / totalProfiles) * 100);
        self.postMessage({ type: 'progress', progress });
      }
    });

    // Сортируем результаты по расстоянию и ограничиваем количество
    matches.sort((a, b) => a.distance - b.distance);
    const limitedMatches = matches.slice(0, maxMatches);

    console.log(`Found ${limitedMatches.length} matches out of ${matches.length} total`);

    return limitedMatches;
  } catch (error) {
    console.error('Error in findMatches:', error);
    return [];
  }
};

// Обработчик сообщений от главного потока
self.onmessage = (event: MessageEvent<WorkerParams>) => {
  console.log('Worker received data:', JSON.stringify({
    queryKitNumber: event.data.query.kitNumber,
    databaseSize: event.data.database.length,
    maxDistance: event.data.maxDistance,
    maxMatches: event.data.maxMatches
  }));

  const { query, database, markerCount, maxDistance, maxMatches } = event.data;

  try {
    // Выполняем поиск совпадений
    const matches = findMatches(query, database, markerCount, maxDistance, maxMatches);

    // Сериализуем результаты с дополнительной безопасностью
    const safeMatches = matches
      .map(serializeMatch)
      .filter(match => match !== null);

    console.log('Safe Matches:', {
      totalMatches: safeMatches.length,
      firstMatch: safeMatches[0]
    });

    // Отправляем результат обратно
    self.postMessage({ 
      type: 'complete', 
      data: safeMatches 
    });
  } catch (error) {
    console.error('Unhandled error in worker:', error);
    self.postMessage({ 
      type: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};