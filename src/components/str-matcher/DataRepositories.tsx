"use client";

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Search } from 'lucide-react';
import ExcelJS from 'exceljs';
import { selectUserSettings, addCustomRepository } from '@/store/userProfile';
import type { STRProfile, Repository } from '@/utils/constants';
import { DatabaseManager } from '@/utils/storage/indexedDB';
import { processLargeFile } from '@/utils/chunkProcessor';
import { parseCSVData } from '@/utils/dataProcessing';

const DEFAULT_REPOS = [
  {
    id: 'aadna',
    name: 'AADNA.ru Database',
    description: 'Основная база данных Y-DNA',
    category: 'Y-DNA',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTp8VNm5yS63RiflBpMY4b8d4RBTPecjU_RrC10EDcgSitcQxRtt1QbeN67g8bYOyqB088GLOTHIG5g/pub?gid=90746110&single=true&output=csv',
    type: 'google_sheet' as const,
  },
  {
    id: 'G',
    name: 'G Database',
    description: 'База данных для гаплогруппы G',
    category: 'Y-DNA',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSOBSOYSNmI7X0vbDNa8qXCloT18ONgs1r9kht_gO62RcMqHuirFZWh-aAl45EOBr_2X-r285ZG4bnf/pub?gid=886727200&single=true&output=csv',
    type: 'google_sheet' as const,
  },
  {
    id: 'r1a',
    name: 'R1a Database',
    description: 'База данных для гаплогруппы R1a',
    category: 'Y-DNA',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRU8tnVM0DyHCYmpdQhKAdyjiwc1Q0GYDb1EOBEZu_YPvmEvfQZPSZAsZo2Cvkk3R6qMElcTVKNjNYZ/pub?gid=1094141657&single=true&output=csv',
    type: 'google_sheet' as const,
  },
  {
    id: 'J2',
    name: 'J2 Database',
    description: 'База данных для гаплогруппы J2',
    category: 'Y-DNA',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQdOZKzZjPnAo2WsmK86PymoWNxGm2Dc1kEMGAbtw5kWHPDURgN9e5PRR3x9_ag-CdAntzcSJRddbOS/pub?gid=1964163364&single=true&output=csv',
    type: 'google_sheet' as const,
  },
  {
    id: 'J1',
    name: 'J1 Database',
    description: 'База данных для гаплогруппы J1',
    category: 'Y-DNA',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSf-FRmBHW8hnCopHADt54LApuvyuhpeImR-5xZPRHY_Ca91H8t_uPPgtrN0cIOZHzamN0zjwxV60cX/pub?gid=1814447974&single=true&output=csv',
    type: 'google_sheet' as const,
  },
  {
    id: 'E',
    name: 'E Database',
    description: 'База данных для гаплогруппы E',
    category: 'Y-DNA',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTvc9oN1jumSux4OBv8MUEzCJyabastzp06C7tuEwv_Ud_DW60ISrVI1D-gKjWs6JibefG8D_pQfIyI/pub?gid=1307961167&single=true&output=csv',
    type: 'google_sheet' as const,
  },
  {
    id: 'I',
    name: 'I Database',
    description: 'База данных для гаплогруппы I',
    category: 'Y-DNA',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRasrJA3vR1vJineI98GIvmNBL6UXxdpLbJ-k0Qb_60ukvGn9ZDkopG3FDKm0GJg8M8i7r5vK__qsI-/pub?gid=1455355483&single=true&output=csv',
    type: 'google_sheet' as const,
  },
  {
    id: 'Others',
    name: 'Others Database',
    description: 'База данных для гаплогруппы Others',
    category: 'Y-DNA',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSs84tXzDaQzQHjfG4TlR7ARTaE_iU12cgKzjxg7GaQPHRkbisVHRJ8ywx7ldkKV4hyI5pBwYVlYwLz/pub?gid=65836825&single=true&output=csv',
    type: 'google_sheet' as const,
  },
  {
    id: 'r1b',
    name: 'R1b Database',
    description: 'База данных для гаплогруппы R1b',
    category: 'Y-DNA',
    type: 'chunked_json' as const,
    chunks: 16,
    url: '/chunk_0.json'
  },
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

  const [newRepo, setNewRepo] = useState({
    name: '',
    description: '',
    category: '',
    url: '',
    type: 'google_sheet' as const,
  });

  useEffect(() => {
    setRepositories([
      ...DEFAULT_REPOS,
      ...(userSettings.customRepositories as Repository[]),
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
      const cleanProfile = (profile: Partial<STRProfile>) => {
        const kitNumber = cleanKey(profile?.markers?.['Kit Number'] || profile?.markers?.KitNumber || '');
        return {
          ...profile,
          kitNumber,
          markers: {
            ...profile.markers,
            ['Kit Number']: kitNumber,
          },
        };
      };

      for (let i = 0; i < chunks; i++) {
        console.log(`Loading chunk ${i}...`);
        const response = await fetch(`/chunk_${i}.json`);

        if (!response.ok) {
          console.warn(`Failed to load chunk ${i}: ${response.statusText}`);
          continue;
        }

        const chunkData = await response.json();
        const chunkDataCleaned = chunkData.map(cleanProfile);

        const validProfiles = chunkDataCleaned
          .filter((profile: Partial<STRProfile>) => {
            if (!profile.kitNumber || typeof profile.kitNumber !== 'string') {
              console.warn('Skipping profile without kitNumber:', profile);
              return false;
            }
            if (processedKits.has(profile.kitNumber)) {
              return false;
            }
            processedKits.add(profile.kitNumber);
            return true;
          })
          .map((profile: Partial<STRProfile>) => ({
            kitNumber: profile.kitNumber,
            name: profile.name || 'Unknown',
            country: profile.country || 'Unknown',
            haplogroup: profile.haplogroup || 'Unknown',
            markers: profile.markers || {},
          }));

        console.log(`Processed valid profiles: ${validProfiles.length}`);

        const batchSize = 50;
        for (let j = 0; j < validProfiles.length; j += batchSize) {
          const batch = validProfiles.slice(j, j + batchSize);
          await dbManager.saveProfiles(batch);
        }

        setProgress(((i + 1) / chunks) * 100);
        console.log(`Loading progress: ${Math.round(((i + 1) / chunks) * 100)}%`);

        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const allProfiles = await dbManager.getProfiles();
      console.log(`Load complete. Total profiles saved: ${allProfiles.length}`);
      setDatabase(allProfiles);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error loading database:', error.message);
        setError(`Error loading database: ${error.message}`);
      } else {
        console.error('Error loading database:', error);
        setError(`Error loading database: Unknown error`);
      }
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
          markers: {},
        };

        for (let col = 5; col <= worksheet.columnCount; col++) {
          const markerName = worksheet.getRow(1).getCell(col).text.trim();
          const value = row.getCell(col).text.trim();
          if (value) {
            profile.markers[markerName] = value;
          }
        }

        profiles.push(profile);

        if (profiles.length >= 1000) {
          await dbManager.saveProfiles(profiles);
          profiles.length = 0;
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      processedRows++;
      setProgress((processedRows / totalRows) * 100);

      if (processedRows % 1000 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
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

      let profiles: STRProfile[] = [];

      if (file.name.endsWith('.xlsx')) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        profiles = await processExcelFile(workbook.worksheets[0], dbManager);
      } else {
        profiles = await processLargeFile(file, setProgress, dbManager);
      }

      setDatabase(profiles);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error processing file:', error.message);
        setError(`Failed to process file: ${error.message}`);
      } else {
        console.error('Error processing file:', error);
        setError('Failed to process file: Unknown error');
      }
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
        const repo = repositories.find((r) => r.id === repoId);
        if (repo) {
          if (repo.type === 'chunked_json' && repo.id === 'r1b') {
            await loadChunkedDatabase(repo.chunks || 0);
          } else if (repo.url) {
            const response = await fetch(repo.url);
            if (!response.ok) {
              throw new Error(`Failed to load from ${repo.name}`);
            }
            const text = await response.text();
            const profiles = await parseCSVData(text, (progress) => setProgress(progress));
            await dbManager.saveProfiles(profiles);
          }
        }
      }

      const allProfiles = await dbManager.getProfiles();
      setDatabase(allProfiles);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error loading repositories:', error.message);
        setError(`Failed to load repositories: ${error.message}`);
      } else {
        console.error('Error loading repositories:', error);
        setError('Failed to load repositories: Unknown error');
      }
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };
  const addRepository = () => {
    if (!newRepo.name || !newRepo.url) return;

    const repository: Repository = {
      ...newRepo,
      id: Date.now().toString(),
    };

    dispatch(addCustomRepository(repository));

    setNewRepo({
      name: '',
      description: '',
      category: '',
      url: '',
      type: 'google_sheet',
    });

    setIsAdding(false);
  };

  const filteredRepos = repositories.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRepository = (id: string) => {
    setSelectedRepos((prev) =>
      prev.includes(id)
        ? prev.filter((repoId) => repoId !== id)
        : [...prev, id]
    );
  };

  const handleLoadRepository = async (repo: Repository) => {
    if (repo.type === 'chunked_json' && repo.id === 'r1b') {
      await loadChunkedDatabase(repo.chunks || 0);
    } else if (repo.url) {
      await onLoadData(repo.url, repo.type);
    }
  };

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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Загрузка... {Math.round(progress)}%</p>
          </div>
        )}

        {isAdding && (
          <div className="space-y-4 p-4 border rounded mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Название</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newRepo.name}
                onChange={(e) =>
                  setNewRepo((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Описание</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newRepo.description}
                onChange={(e) =>
                  setNewRepo((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Категория</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newRepo.category}
                onChange={(e) =>
                  setNewRepo((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newRepo.url}
                onChange={(e) =>
                  setNewRepo((prev) => ({ ...prev, url: e.target.value }))
                }
              />
            </div>
            <button
              onClick={addRepository}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Добавить
            </button>
          </div>
        )}

        <div className="grid grid-cols-5 gap-4">
          {filteredRepos.map((repo) => (
            <div key={repo.id} className="p-2 border rounded hover:bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => handleLoadRepository(repo)}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                  disabled={loading}
                >
                  Загрузить
                </button>
                <div className="font-medium truncate">{repo.name}</div>
              </div>
              <Checkbox
                checked={selectedRepos.includes(repo.id)}
                onCheckedChange={() => toggleRepository(repo.id)}
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