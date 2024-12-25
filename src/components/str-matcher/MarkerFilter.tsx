"use client";

import React, { useState, useRef, useEffect } from 'react';

interface MarkerFilterProps {
  values: string[];
  onFilterChange: (values: string[]) => void;
}

const MarkerFilter: React.FC<MarkerFilterProps> = ({ values, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleValueToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    setSelectedValues(newValues);
    onFilterChange(newValues);
  };

  const uniqueValues = Array.from(new Set(values)).sort((a, b) => 
    Number(a) - Number(b)
  );

  return (
    <div ref={filterRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-1 text-xs border rounded hover:bg-gray-50 ${
          selectedValues.length > 0 ? 'bg-blue-50' : ''
        }`}
      >
        {selectedValues.length > 0 ? `${selectedValues.length} selected` : 'Filter'}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 z-10 w-48 max-h-48 overflow-y-auto bg-white border rounded shadow-lg">
          {uniqueValues.map(value => (
            <label key={value} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedValues.includes(value)}
                onChange={() => handleValueToggle(value)}
                className="mr-2"
              />
              <span className="text-sm">{value}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarkerFilter;