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
  console.log('MatchesTable mounted with:', {
    matches: matches?.length,
    queryKit: query?.kitNumber,
    sortOrder,
    markerCount: selectedMarkerCount
  });

  const [filters, setFilters] = useState({
    kitNumber: '',
    name: '',
    country: '',
    haplogroup: ''
  });

  const [markerFilters, setMarkerFilters] = useState<Record<string, boolean>>({});
  const [excludedMarkers, setExcludedMarkers] = useState<string[]>([]);

  console.log('Current filters:', {
    textFilters: filters,
    markerFilters,
    excludedMarkers
  });

  const relevantMarkers = markerGroups[selectedMarkerCount];
  console.log('Relevant markers:', relevantMarkers);

  const orderedMarkers = sortOrder === "default"
    ? relevantMarkers
    : getOrderedMarkers(sortOrder).filter(marker => relevantMarkers.includes(marker));
  
  console.log('Ordered markers:', {
    type: sortOrder,
    count: orderedMarkers.length
  });

  const visibleMarkers = orderedMarkers.filter(marker => {
    console.log(`Processing marker ${marker}`);
    const queryValue = query?.markers[marker];
    if (!queryValue) {
      console.log(`No query value for ${marker}`);
      return false;
    }

    return matches.some(match => {
      const matchValue = match.profile.markers[marker];
      if (!matchValue) {
        console.log(`No match value for ${marker} in kit ${match.profile.kitNumber}`);
        return false;
      }

      const diff = calculateMarkerDifference(queryValue, matchValue, marker);
      return diff !== 0;
    });
  }).filter(marker => !excludedMarkers.includes(marker));

  const handleMarkerExclude = (marker: string) => {
    console.log('Excluding marker:', marker);
    setExcludedMarkers(prev => [...prev, marker]);
  };

  const handleMarkerInclude = (marker: string) => {
    console.log('Including marker:', marker);
    setExcludedMarkers(prev => prev.filter(m => m !== marker));
  };
