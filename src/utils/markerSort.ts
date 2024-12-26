import { markers } from './constants';

// Порядковые номера по стабильности (1 - самый стабильный)
const stabilityOrder: Record<string, number> = {
  // 1-20
  'DYS472': 1,
  'DYS436': 2,
  'DYS425': 3,
  'DYS568': 4,
  'DYS490': 5,
  'DYS426': 6,
  'DYS455': 7,
  'DYS632': 8,
  'DYS494': 9,
  'DYS450': 10,
  'DYS435': 11,
  'DYS593': 12,
  'DYS640': 13,
  'DYS492': 14,
  'DYS641': 15,
  'DYS594': 16,
  'DYS726': 17,
  'DYS388': 18,
  'DYS636': 19,
  'DYS638': 20,
  // 21-40
  'DYS454': 21,
  'DYS575': 22,
  'DYS462': 23,
  'DYS434': 24,
  'DYS590': 25,
  'DYS438': 26,
  'DYS392': 27,
  'DYS459a': 28,
  'DYF395S1a': 29,
  'DYF395S1b': 30,
  'DYS578': 31,
  'DYS617': 32,
  'DYS716': 33,
  'DYS445': 34,
  'DYS393': 35,
  'DYS717': 36,
  'DYS437': 37,
  'DYS589': 38,
  'DYS487': 39,
  'DYS389i': 40,
  // 41-60
  'DYS556': 41,
  'DYS531': 42,
  'DYS537': 43,
  'DYF406S1': 44,
  'DYS511': 45,
  'DYS572': 46,
  'DYS459b': 47,
  'DYS464a': 48,
  'DYS452': 49,
  'Y-GGAAT-1B07': 50,
  'DYS464b': 51,
  'DYS497': 52,
  'DYS587': 53,
  'DYS533': 54,
  'DYS540': 55,
  'DYS561': 56,
  'DYS448': 57,
  'DYS464d': 58,
  'DYS495': 59,
  'DYS461': 60,
  // 61-80
  'DYS520': 61,
  'DYS513': 62,
  'DYS485': 63,
  'DYS522': 64,
  'Y-GATA-H4': 65,
  'DYS525': 66,
  'DYS19': 67,
  'DYS444': 68,
  'DYS565': 69,
  'DYS460': 70,
  'DYS413a': 71,
  'DYS413b': 72,
  'DYS549': 73,
  'YCAIIa': 74,
  'DYS441': 75,
  'DYS390': 76,
  'DYS391': 77,
  'DYS635': 78,
  'DYS389ii': 79,
  'YCAIIb': 80,
  // 81-100
  'DYS464c': 81,
  'DYS463': 82,
  'DYS643': 83,
  'DYS607': 84,
  'DYS557': 85,
  'DYS385a': 86,
  'DYS446': 87,
  'DYS439': 88,
  'DYS505': 89,
  'DYS504': 90,
  'DYS510': 91,
  'DYS534': 92,
  'DYS447': 93,
  'Y-GATA-A10': 94,
  'DYS715': 95,
  'DYS532': 96,
  'DYS385b': 97,
  'DYS552': 98,
  'DYS650': 99,
  'DYS481': 100,
  // 101-111
  'DYS442': 101,
  'DYS456': 102,
  'DYS714': 103,
  'DYS570': 104,
  'DYS576': 105,
  'DYS458': 106,
  'DYS712': 107,
  'CDYa': 108,
  'DYS449': 109,
  'CDYb': 110,
  'DYS710': 111
};

// Получение порядка стабильности для маркера
function getMarkerStability(marker: string): number {
  return stabilityOrder[marker] || 999;
}

// Функция для получения маркеров в нужном порядке
export function getOrderedMarkers(order: 'default' | 'mutation_rate'): string[] {
  if (order === 'default') {
    return markers;
  }
  
  return [...markers].sort((a, b) => {
    const orderA = getMarkerStability(a);
    const orderB = getMarkerStability(b);
    return orderA - orderB;
  });
}

export const sortOptions = [
  { value: 'default', label: 'Стандартный порядок FTDNA' },
  { value: 'mutation_rate', label: 'По скорости мутации' }
];