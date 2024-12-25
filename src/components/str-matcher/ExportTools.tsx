import html2canvas from 'html2canvas';
import type { STRMatch } from '@/utils/constants';

interface ExportOptions {
  format: 'csv' | 'jpg';
  includeHaplogroups: boolean;
}

export const exportMatches = async (matches: STRMatch[], options: ExportOptions) => {
  if (options.format === 'csv') {
    const headers = ['Kit Number', 'Name', 'Country', 'Haplogroup', 'Genetic Distance'];
    const rows = matches.map(match => [
      match.profile.kitNumber,
      match.profile.name || '',
      match.profile.country || '',
      match.profile.haplogroup || '',
      match.distance.toString()
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'str_matches.csv';
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  if (options.format === 'jpg') {
    const table = document.querySelector('.matches-table');
    if (!table) return;
    const canvas = await html2canvas(table as HTMLElement);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.9);
    a.download = 'str_matches.jpg';
    a.click();
  }
};