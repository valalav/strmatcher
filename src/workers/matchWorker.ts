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

// Обработчик сообщений от главного потока
self.onmessage = (event: MessageEvent<WorkerParams>) => {
  console.log('Worker received data:', event.data);

  const { query, database, markerCount, maxDistance, maxMatches } = event.data;

  try {
    // Выполняем поиск совпадений
    const matches = findMatches(query, database, markerCount, maxDistance, maxMatches);

    // Отправляем результат обратно
    self.postMessage({ type: 'complete', data: matches });
  } catch (error) {
    console.error('Error in worker:', error);
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
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
  const matches: STRMatch[] = [];
  const totalProfiles = database.length;

  database.forEach((profile, index) => {
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
      const progress = (index / totalProfiles) * 100;
      self.postMessage({ type: 'progress', progress });
    }
  });

  // Сортируем результаты по расстоянию и ограничиваем количество
  matches.sort((a, b) => a.distance - b.distance);
  return matches.slice(0, maxMatches);
};
