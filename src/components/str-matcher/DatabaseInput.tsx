"use client";

import React from 'react';
import type { STRProfile } from '@/utils/constants';
import { parseCSVData } from '@/utils/dataProcessing';

interface DatabaseInputProps {
  onDataLoaded: (data: STRProfile[]) => void;
  onError: (error: string | null) => void;
  onKitNumberClick: (kitNumber: string) => void;
  recordCount: number;
}

const DatabaseInput: React.FC<DatabaseInputProps> = ({ 
  onDataLoaded, 
  onError, 
  recordCount 
}) => {
  const handleDatabaseInput = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const text = event.target.value;
      if (!text.trim()) {
        onError('Please paste data into the database input');
        return;
      }

      const results = await parseCSVData(text);

      if (!results.length) {
        onError('No valid data found');
        return;
      }

      onDataLoaded(results);
      onError(null);
      event.target.value = ''; // Очищаем поле после успешной загрузки
    } catch (e: unknown) {
      console.error('Parse error:', e);
      onError('Error parsing database: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div className="flex items-end gap-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="font-medium">Database Input</label>
          <span className="text-sm text-gray-500">{recordCount} records loaded</span>
        </div>
        <textarea 
          className="w-64 h-24 p-2 border rounded font-mono text-sm resize-none"
          onChange={handleDatabaseInput}
          placeholder="Paste database here"
        />
      </div>
    </div>
  );
};

export default DatabaseInput;