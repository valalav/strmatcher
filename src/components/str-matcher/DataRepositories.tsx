"use client";

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Search } from 'lucide-react';
import ExcelJS from 'exceljs';
import { selectUserSettings, addCustomRepository } from '@/store/userProfile';
import type { STRProfile } from '@/utils/constants';
import { DatabaseManager } from '@/utils/storage/indexedDB';
import { processLargeFile } from '@/utils/chunkProcessor';
import { parseCSVData } from '@/utils/dataProcessing';

type RepositoryType = 'google_sheet' | 'chunked_json';

interface Repository {
  id: string;
  name: string;
  description?: string;
  category?: string;
  url?: string;
  type: RepositoryType;
  chunks?: number;
}

const DEFAULT_REPOS: Repository[] = [
  {
    id: 'aadna',
    name: 'AADNA.ru Database',
    description: 'Основная база данных Y-DNA',
    category: 'Y-DNA',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTp8VNm5yS63RiflBpMY4b8d4RBTPecjU_RrC10EDcgSitcQxRtt1QbeN67g8bYOyqB088GLOTHIG5g/pub?gid=90746110&single=true&output=csv',
    type: 'google_sheet'
  },
  {
    id: 'G',
    name: 'G Database',
    description: 'База данных для гаплогруппы G',
    category: 'Y-DNA',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSOBSOYSNmI7X0vbDNa8qXCloT18ONgs1r9kht_gO62RcMqHuirFZWh-aAl45EOBr_2X-r285ZG4bnf/pub?gid=886727200&single=true&output=csv',
    type: 'google_sheet'
  },
  {
    id: 'r1a',
    name: 'R1a Database',
    description: 'База данных для гаплогруппы R1a',
    category: 'Y-DNA',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRU8tnVM0DyHCYmpdQhKAdyjiwc1Q0GYDb1EOBEZu_YPvmEvfQZPSZAsZo2Cvkk3R6qMElcTVKNjNYZ/pub?gid=1094141657&single=true&output=csv',
    type: 'google_sheet'
  },
  {
    id: 'J2',
    name: 'J2 Database',
    description: 'База данных для гаплогруппы J2',
    category: 'Y-DNA',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQdOZKzZjPnAo2WsmK86PymoWNxGm2Dc1kEMGAbtw5kWHPDURgN9e5PRR3x9_ag-CdAntzcSJRddbOS/pub?gid=1964163364&single=true&output=csv',
    type: 'google_sheet'
  },
  {
    id: 'J1',
    name: 'J1 Database',
    description: 'База данных для гаплогруппы J1',
    category: 'Y-DNA',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSf-FRmBHW8hnCopHADt54LApuvyuhpeImR-5xZPRHY_Ca91H8t_uPPgtrN0cIOZHzamN0zjwxV60cX/pub?gid=1814447974&single=true&output=csv',
    type: 'google_sheet'
  },
  {
    id: 'E',
    name: 'E Database',
    description: 'База данных для гаплогруппы E',
    category: 'Y-DNA',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTvc9oN1jumSux4OBv8MUEzCJyabastzp06C7tuEwv_Ud_DW60ISrVI1D-gKjWs6JibefG8D_pQfIyI/pub?gid=1307961167&single=true&output=csv',
    type: 'google_sheet'
  },
  {
    id: 'I',
    name: 'I Database',
    description: 'База данных для гаплогруппы I',
    category: 'Y-DNA',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRasrJA3vR1vJineI98GIvmNBL6UXxdpLbJ-k0Qb_60ukvGn9ZDkopG3FDKm0GJg8M8i7r5vK__qsI-/pub?gid=1455355483&single=true&output=csv',
    type: 'google_sheet'
  },
  {
    id: 'Others',
    name: 'Others Database',
    description: 'База данных для гаплогруппы Others',
    category: 'Y-DNA',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSs84tXzDaQzQHjfG4TlR7ARTaE_iU12cgKzjxg7GaQPHRkbisVHRJ8ywx7ldkKV4hyI5pBwYVlYwLz/pub?gid=65836825&single=true&output=csv',
    type: 'google_sheet'
  },
  {
    id: 'r1b',
    name: 'R1b Database',
    description: 'База данных для гаплогруппы R1b',
    category: 'Y-DNA',
    type: 'chunked_json',
    chunks: 16
  }
];

interface DataRepositoriesProps {
  onLoadData: (url: string, type: string, sheetName?: string) => Promise<void>;
  setDatabase: (profiles: STRProfile[]) => void;
}

const DataRepositories: React.FC<DataRepositoriesProps> = ({ onLoadData, setDatabase }) => {
  const dispatch = useDispatch();
  const userSettings = useSelector(selectUserSettings);
  
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [newRepo, setNewRepo] = useState<Repository>({
    id: '',
    name: '',
    description: '',
    category: '',
    url: '',
    type: 'google_sheet'
  });
  useEffect(() => {
    setRepositories([
      ...DEFAULT_REPOS,
      ...userSettings.customRepositories.map(repo => ({
        ...repo,
        type: repo.type as RepositoryType
      }))
    ]);
  }, [userSettings.customRepositories]);

  const loadChunkedDatabase = async (chunks: number) => {
    setLoading(true);
    setProgress(0);
  
    try {
      const dbManager = new DatabaseManager();
      await dbManager.init();
      await dbManager.clearProfiles();
  
      const processedKits = new Set<string>();
  
      const cleanKey = (key: string) => key.replace(/^\uFEFF/, '');
      const cleanProfile = (profile: STRProfile) => ({
        ...profile,
        kitNumber: cleanKey(profile?.markers?.['Kit Number'] || profile?.markers?.KitNumber || ''),
        markers: {
          ...profile.markers,
          'Kit Number': cleanKey(profile?.markers?.['Kit Number'] || profile?.markers?.KitNumber || '')
        }
      });
  
      for (let i = 0; i < chunks; i++) {
        console.log(`Загружаем чанк ${i}...`);
        const response = await fetch(`/chunk_${i}.json`);
  
        if (!response.ok) {
          console.warn(`Не удалось загрузить чанк ${i}: ${response.statusText}`);
          continue;
        }
  
        const chunkData = await response.json();
        const validProfiles = chunkData
          .map(cleanProfile)
          .filter((profile: STRProfile) => {
            if (!profile.kitNumber || typeof profile.kitNumber !== 'string') return false;
            if (processedKits.has(profile.kitNumber)) return false;
            processedKits.add(profile.kitNumber);
            return true;
          })
          .map((profile: STRProfile) => ({
            kitNumber: profile.kitNumber,
            name: profile.name || 'Unknown',
            country: profile.country || 'Unknown',
            haplogroup: profile.haplogroup || 'Unknown',
            markers: profile.markers || {}
          }));
  
        console.log(`Обработано профилей: ${validProfiles.length}`);
        
        const batchSize = 50;
        for (let j = 0; j < validProfiles.length; j += batchSize) {
          await dbManager.saveProfiles(validProfiles.slice(j, j + batchSize));
        }
  
        setProgress(((i + 1) / chunks) * 100);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
  
      const allProfiles = await dbManager.getProfiles();
      setDatabase(allProfiles);
  
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      setError(`Ошибка загрузки: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const processExcelFile = async (
    worksheet: ExcelJS.Worksheet, 
    dbManager: DatabaseManager
  ): Promise<STRProfile[]> => {
    const profiles: STRProfile[] = [];
    const uniqueKits = new Set<string>();
    const totalRows = worksheet.rowCount;
    let processedRows = 0;

    for (let rowNumber = 2; rowNumber <= totalRows; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const kitNumber = row.getCell(1).text.trim();

      if (kitNumber && !uniqueKits.has(kitNumber)) {
        uniqueKits.add(kitNumber);
        
        const profile: STRProfile = {
          kitNumber,
          name: row.getCell(2).text.trim() || '',
          country: row.getCell(3).text.trim() || '',
          haplogroup: row.getCell(4).text.trim() || '',
          markers: {}
        };

        for (let col = 5; col <= worksheet.columnCount; col++) {
          const markerName = worksheet.getRow(1).getCell(col).text.trim();
          const value = row.getCell(col).text.trim();
          if (value) profile.markers[markerName] = value;
        }

        profiles.push(profile);

        if (profiles.length >= 1000) {
          await dbManager.saveProfiles(profiles.splice(0));
        }
      }

      processedRows++;
      setProgress((processedRows / totalRows) * 100);
      if (processedRows % 1000 === 0) await new Promise(r => setTimeout(r, 0));
    }

    if (profiles.length > 0) {
      await dbManager.saveProfiles(profiles);
    }

    return await dbManager.getProfiles();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      const dbManager = new DatabaseManager();
      await dbManager.init();

      const profiles = file.name.endsWith('.xlsx')
        ? await processExcelFile(
            await new ExcelJS.Workbook().xlsx.load(await file.arrayBuffer()).then(wb => wb.worksheets[0]),
            dbManager
          )
        : await processLargeFile(file, setProgress, dbManager);

      setDatabase(profiles);
    } catch (error) {
      setError(`Ошибка обработки файла: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleLoadSelected = async () => {
    setLoading(true);
    setError(null);
    try {
      const dbManager = new DatabaseManager();
      await dbManager.init();
  
      for (const repoId of selectedRepos) {
        const repo = repositories.find(r => r.id === repoId);
        if (!repo) continue;

        if (repo.type === 'chunked_json' && repo.id === 'r1b') {
          await loadChunkedDatabase(repo.chunks || 0);
        } else if (repo.url) {
          const response = await fetch(repo.url);
          if (!response.ok) throw new Error(`Failed to load from ${repo.name}`);
          const profiles = await parseCSVData(await response.text(), setProgress);
          await dbManager.saveProfiles(profiles);
        }
      }
  
      setDatabase(await dbManager.getProfiles());
    } catch (error) {
      setError(`Ошибка загрузки: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const addRepository = () => {
    if (!newRepo.name || !newRepo.url) return;
    const repoWithUrl = { ...newRepo, url: newRepo.url || '', type: 'google_sheet' as const };
    dispatch(addCustomRepository(repoWithUrl));
    setNewRepo({
      id: '',
      name: '',
      description: '',
      category: '',
      url: '',
      type: 'google_sheet'
    });
    setIsAdding(false);
  };

  const filteredRepos = repositories.filter(repo => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Источники данных</CardTitle>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer disabled:opacity-50"
              aria-disabled={loading}
            >
              Загрузить файл
            </label>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={loading}
            >
              {isAdding ? 'Отмена' : 'Добавить источник'}
            </button>
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Поиск источников..."
            className="w-full pl-8 pr-4 py-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded">{error}</div>
        )}

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            <p className="mt-2">Загрузка... {Math.round(progress)}%</p>
          </div>
        )}

        {isAdding && (
          <div className="space-y-4 p-4 border rounded mb-4">
            {[
              { label: 'Название', key: 'name' },
              { label: 'Описание', key: 'description' },
              { label: 'Категория', key: 'category' },
              { label: 'URL', key: 'url' }
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={newRepo[key as keyof typeof newRepo] || ''}
                  onChange={e => setNewRepo(prev => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}
            <button
              onClick={addRepository}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Добавить
            </button>
          </div>
        )}

        <div className="grid grid-cols-5 gap-4">
          {filteredRepos.map(repo => (
            <div key={repo.id} className="p-2 border rounded hover:bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => repo.type === 'chunked_json' && repo.id === 'r1b'
                    ? loadChunkedDatabase(repo.chunks || 0)
                    : repo.url && onLoadData(repo.url, repo.type)}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                  disabled={loading}
                >
                  Загрузить
                </button>
                <div className="font-medium truncate">{repo.name}</div>
              </div>
              <Checkbox
                checked={selectedRepos.includes(repo.id)}
                onCheckedChange={() => setSelectedRepos(prev => 
                  prev.includes(repo.id)
                    ? prev.filter(id => id !== repo.id)
                    : [...prev, repo.id]
                )}
              />
            </div>
          ))}
        </div>

        {selectedRepos.length > 0 && (
          <div className="mt-4">
            <button
              onClick={handleLoadSelected}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              disabled={loading}
            >
              Загрузить выбранные ({selectedRepos.length})
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataRepositories;