"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { STRProfile } from '@/utils/constants';

interface LoadedKitsProps {
  profiles: STRProfile[];
  onKitNumberClick: (kitNumber: string) => void;
}

const LoadedKits: React.FC<LoadedKitsProps> = ({ profiles, onKitNumberClick }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProfiles = profiles
    .filter(profile => {
      if (!searchTerm) return true;
      if (!profile || !profile.kitNumber) return false;
      
      const searchLower = searchTerm.toLowerCase();
      const kitNumber = profile.kitNumber.toLowerCase();
      const name = profile.name?.toLowerCase() || '';
      
      return kitNumber.includes(searchLower) || name.includes(searchLower);
    })
    .slice(0, 1000);

  return (
    <Card className="h-screen">
      <CardHeader>
        <CardTitle>Loaded Kits ({profiles.length})</CardTitle>
        <input
          type="text"
          placeholder="Search kits..."
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-y-auto h-[calc(100vh-180px)]">
          {filteredProfiles.map(profile => {
            if (!profile || !profile.kitNumber) return null;
            
            return (
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadedKits;