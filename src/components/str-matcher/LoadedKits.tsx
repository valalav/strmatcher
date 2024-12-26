"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DatabaseManager } from '@/utils/storage/indexedDB';
import type { STRProfile } from '@/utils/constants';

interface LoadedKitsProps {
  onKitNumberClick: (kitNumber: string) => void;
}

const LoadedKits: React.FC<LoadedKitsProps> = ({ onKitNumberClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allProfiles, setAllProfiles] = useState<STRProfile[]>([]);
  const [visibleProfiles, setVisibleProfiles] = useState<STRProfile[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 50; // Количество профилей на одну загрузку

  const fetchFallbackData = async () => {
    try {
      console.log("Loading fallback data...");
      const response = await fetch('/fallback.json'); // Убедитесь, что файл доступен по этому пути
      if (!response.ok) {
        throw new Error(`Failed to fetch fallback data: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Fallback data loaded:", data);
      return data;
    } catch (error) {
      console.error("Error loading fallback data:", error);
      throw error;
    }
  };  

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const dbManager = new DatabaseManager();
        console.log("Initializing database...");
        await dbManager.init();
    
        console.log("Fetching profiles from database...");
        const profiles = await dbManager.getProfiles();
        console.log("Profiles fetched from database:", profiles);
    
        if (profiles.length === 0) {
          console.warn("No profiles found in the database. Loading from fallback...");
          const fallbackData = await fetchFallbackData();
          setAllProfiles(fallbackData);
          setVisibleProfiles(fallbackData.slice(0, limit));
        } else {
          setAllProfiles(profiles);
          setVisibleProfiles(profiles.slice(0, limit));
        }
    
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profiles:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setLoading(false);
      }
    };    
  
    fetchProfiles();
  }, []);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setVisibleProfiles(allProfiles.slice(0, limit));
      setOffset(0);
      return;
    }

    const filteredProfiles = allProfiles.filter(profile =>
      profile.kitNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setVisibleProfiles(filteredProfiles.slice(0, limit));
    setOffset(0);
  };

  const loadMore = () => {
    const nextOffset = offset + limit;
    const nextChunk = allProfiles.slice(nextOffset, nextOffset + limit);
    setVisibleProfiles(prev => [...prev, ...nextChunk]);
    setOffset(nextOffset);
  };

  if (loading) {
    return (
      <Card className="h-screen">
        <CardHeader>
          <CardTitle>Loading Kits...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading data from the database. Please wait...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-screen">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-screen">
      <CardHeader>
        <CardTitle>Loaded Kits ({allProfiles.length})</CardTitle>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search kits..."
            className="w-full p-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-y-auto h-[calc(100vh-180px)]">
          {visibleProfiles.map((profile) => (
            <div
              key={profile.kitNumber}
              className="p-2 border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => onKitNumberClick(profile.kitNumber)}
            >
              <div className="text-blue-500 hover:text-blue-700 font-medium">
                {profile.kitNumber}
              </div>
              {profile.name && (
                <div className="text-sm text-gray-600">{profile.name}</div>
              )}
            </div>
          ))}
          {visibleProfiles.length < allProfiles.length && (
            <button
              className="w-full p-2 bg-gray-300 hover:bg-gray-400 text-center"
              onClick={loadMore}
            >
              Load More
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadedKits;