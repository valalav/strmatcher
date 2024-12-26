"use client";

import React, { useState } from "react";
import type { STRMatch, STRProfile, MarkerCount } from "@/utils/constants";
import { calculateMarkerDifference, calculateMarkerRarity } from "@/utils/calculations";
import { getOrderedMarkers } from "@/utils/markerSort";
import { markerGroups } from "@/utils/constants";

interface MatchesTableProps {
  matches: STRMatch[];
  query: STRProfile | null;
  onKitNumberClick: (kitNumber: string) => void;
  onRemoveMatch: (kitNumber: string) => void;
  sortOrder?: "default" | "mutation_rate";
  selectedMarkerCount: MarkerCount;
  onFindMatches: () => void;
}

const MatchesTable: React.FC<MatchesTableProps> = ({
  matches,
  query,
  onKitNumberClick,
  onRemoveMatch,
  sortOrder = "default",
  selectedMarkerCount,
  onFindMatches,
}) => {
  const [filters, setFilters] = useState({
    kitNumber: '',
    name: '',
    country: '',
    haplogroup: ''
  });

  const [markerFilters, setMarkerFilters] = useState<Record<string, boolean>>({});

  const relevantMarkers = markerGroups[selectedMarkerCount];
  const orderedMarkers = sortOrder === "default"
    ? relevantMarkers
    : getOrderedMarkers(sortOrder).filter(marker => relevantMarkers.includes(marker));

  const visibleMarkers = orderedMarkers.filter(marker => {
    const queryValue = query?.markers[marker];
    if (!queryValue) return false;

    return matches.some(match => {
      const matchValue = match.profile.markers[marker];
      if (!matchValue) return false;

      const diff = calculateMarkerDifference(queryValue, matchValue, marker);
      return diff !== 0;
    });
  });

  const filteredMatches = matches.filter(match => {
    const kitMatch = match.profile.kitNumber.toLowerCase().includes(filters.kitNumber.toLowerCase());
    const nameMatch = (match.profile.name || '').toLowerCase().includes(filters.name.toLowerCase());
    const countryMatch = (match.profile.country || '').toLowerCase().includes(filters.country.toLowerCase());
    const haploMatch = (match.profile.haplogroup || '').toLowerCase().includes(filters.haplogroup.toLowerCase());

    const markerMatch = Object.entries(markerFilters).every(([marker, isChecked]) => {
      if (!isChecked) return true;

      const queryValue = query?.markers[marker];
      const matchValue = match.profile.markers[marker];

      if (!queryValue || !matchValue) return false;

      const diff = calculateMarkerDifference(queryValue, matchValue, marker);
      return diff === 0;
    });

    return kitMatch && nameMatch && countryMatch && haploMatch && markerMatch;
  });

  if (!matches.length || !query) return null;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 w-8">-</th>
            <th className="border p-2 w-24">Kit</th>
            <th className="border p-2 w-32">Name</th>
            <th className="border p-2 w-24">Country</th>
            <th className="border p-2 w-24">Haplo</th>
            <th className="border p-2 w-16">GD</th>
            <th className="border p-2 w-16">STR</th>
            <th className="border p-2 w-16">%</th>
            {visibleMarkers.map(marker => (
              <th key={marker} className="p-0 border w-8 relative">
                <div className="h-24">
                  <div className="absolute -rotate-90 origin-left whitespace-nowrap text-xs" style={{left: '50%', bottom: '8px'}}>
                    {marker}
                  </div>
                </div>
              </th>
            ))}
          </tr>
          <tr>
            <th className="border p-1"></th>
            {Object.keys(filters).map(key => (
              <th key={key} className="border p-1">
                <input
                  type="text"
                  className="w-full p-1 text-xs border rounded"
                  placeholder={`Filter ${key}`}
                  value={filters[key as keyof typeof filters]}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    [key]: e.target.value
                  }))}
                />
              </th>
            ))}
            <th className="border p-1" colSpan={3}></th>
            {visibleMarkers.map(marker => (
              <th key={marker} className="border p-1 w-8">
                <input
                  type="checkbox"
                  className="w-3 h-3"
                  checked={markerFilters[marker] || false}
                  onChange={(e) => setMarkerFilters(prev => ({
                    ...prev,
                    [marker]: e.target.checked
                  }))}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="bg-gray-50">
            <td className="border p-2"></td>
            <td className="border p-2 font-bold">{query.kitNumber}</td>
            <td className="border p-2">{query.name || "-"}</td>
            <td className="border p-2">{query.country || "-"}</td>
            <td className="border p-2">{query.haplogroup || "-"}</td>
            <td className="border p-2 text-center">-</td>
            <td className="border p-2 text-center">-</td>
            <td className="border p-2 text-center">-</td>
            {visibleMarkers.map(marker => (
              <td key={marker} className="border p-0 w-8 h-8">
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '32px', // Минимальная высота
                    height: 'auto',    // Автоматическая высота
                    wordBreak: 'break-word' // Разбивка длинных слов
                  }}
                >
                  {query.markers[marker] || ""}
                </div>
              </td>
            ))}
          </tr>

          {filteredMatches.map(match => (
            <tr key={match.profile.kitNumber} className="hover:bg-gray-50">
              <td className="border p-2">
                <button
                  onClick={() => onRemoveMatch(match.profile.kitNumber)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </td>
              <td className="border p-2">
                <button
                  onClick={() => onKitNumberClick(match.profile.kitNumber)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  {match.profile.kitNumber}
                </button>
              </td>
              <td className="border p-2">{match.profile.name || "-"}</td>
              <td className="border p-2">{match.profile.country || "-"}</td>
              <td className="border px-2 py-1 text-left adaptive-cell">
                {match.profile.haplogroup ? (
                  <a
                    href={`https://www.yfull.com/tree/${match.profile.haplogroup}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    {match.profile.haplogroup}
                  </a>
                ) : "-"}
              </td>
              <td className="border p-2 text-center">
                <a
                  href={`https://discover.familytreedna.com/y-dna/${match.profile.haplogroup}/classic`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                >
                  {Math.round(match.distance)}
                </a>
              </td>
              <td className="border p-2 text-center">{match.comparedMarkers}</td>
              <td className="border p-2 text-center">{match.percentIdentical.toFixed(1)}%</td>
              {visibleMarkers.map(marker => {
                const queryValue = query.markers[marker];
                const matchValue = match.profile.markers[marker];

                if (!queryValue || !matchValue) {
                  return <td key={marker} className="border p-0 w-8 h-8"></td>;
                }

                const diff = calculateMarkerDifference(queryValue, matchValue, marker);
                const { rarityStyle } = calculateMarkerRarity(matches, marker, matchValue, queryValue);

                return (
                  <td key={marker} className="border p-0 w-8 h-8">
                    <div style={{
                      ...rarityStyle,
                      width: '100%',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {diff !== 0 && !isNaN(diff) && (
                        <span className={diff === 1 ? 'text-gray-600' : 'text-red-600'}>
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onFindMatches}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Find Matches
        </button>
      </div>
    </div>
  );
};

export default React.memo(MatchesTable);