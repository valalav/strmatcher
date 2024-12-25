"use client";

import React, { useState, useEffect } from 'react';
import { markers } from '@/utils/constants';

interface STRMarkerGridProps {
  onMarkerChange?: (marker: string, value: string) => void;
  initialMarkers?: Record<string, string>;
}

const STRMarkerGrid: React.FC<STRMarkerGridProps> = ({ onMarkerChange, initialMarkers }) => {
  const [markerValues, setMarkerValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialMarkers) {
      setMarkerValues(initialMarkers);
      Object.entries(initialMarkers).forEach(([marker, value]) => {
        const input = document.getElementById(marker) as HTMLInputElement;
        if (input) {
          input.value = value;
        }
      });
    }
  }, [initialMarkers]);

  const handleInputChange = (marker: string, value: string) => {
    const newValues = { ...markerValues, [marker]: value };
    setMarkerValues(newValues);
    if (onMarkerChange) {
      onMarkerChange(marker, value);
    }
  };

  const renderMarkerGrid = () => {
    const rows = [];
    for (let i = 0; i < markers.length; i += 20) {
      const row = markers.slice(i, i + 20).map(marker => (
        <td key={marker} className="p-1 border">
          <div className="bg-gray-100 p-1 text-sm font-medium mb-1">{marker}</div>
          <input
            id={marker}
            className="w-full p-1 border rounded text-sm"
            defaultValue={markerValues[marker] || ''}
            onChange={(e) => handleInputChange(marker, e.target.value)}
          />
        </td>
      ));
      rows.push(<tr key={i}>{row}</tr>);
    }
    return rows;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <tbody>{renderMarkerGrid()}</tbody>
      </table>
    </div>
  );
};

export default STRMarkerGrid;