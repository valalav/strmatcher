"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { HistoryItem } from '@/utils/constants';

interface SearchHistoryProps {
  history: HistoryItem[];
  onKitNumberClick: (kitNumber: string) => void;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({ history, onKitNumberClick }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Search History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-64 overflow-y-auto max-h-[600px]">
          {history.map((item, index) => (
            <div key={index} className="p-2 border-b last:border-b-0 hover:bg-gray-50">
              <button
                onClick={() => onKitNumberClick(item.kitNumber)}
                className="text-blue-500 hover:text-blue-700 font-medium"
              >
                {item.kitNumber}
              </button>
              <div className="mt-1 text-xs text-gray-600">
                {item.name && <div>{item.name}</div>}
                {item.country && <div>{item.country}</div>}
                {item.haplogroup && <div>Haplogroup: {item.haplogroup}</div>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchHistory;