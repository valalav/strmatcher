"use client";

import React, { useState, useRef, useEffect } from 'react';

interface MarkerFilterProps {
 values: string[];
 onFilterChange: (values: string[]) => void;
}

const MarkerFilter: React.FC<MarkerFilterProps> = ({ 
 values, 
 onFilterChange 
}) => {
 console.log('MarkerFilter render:', {
   valuesCount: values.length
 });

 const [isOpen, setIsOpen] = useState<boolean>(false);
 const [selectedValues, setSelectedValues] = useState<string[]>([]);
 const filterRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
   function handleClickOutside(event: MouseEvent) {
     if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
       console.log('Closing filter dropdown (clicked outside)');
       setIsOpen(false);
     }
   }

   document.addEventListener('mousedown', handleClickOutside);
   
   return () => {
     document.removeEventListener('mousedown', handleClickOutside);
   };
 }, []);

 useEffect(() => {
   console.log('Selected values changed:', selectedValues);
   onFilterChange(selectedValues);
 }, [selectedValues, onFilterChange]);

 const handleValueToggle = (value: string) => {
   console.log('Toggling value:', value);
   
   const newValues = selectedValues.includes(value)
     ? selectedValues.filter(v => v !== value)
     : [...selectedValues, value];

   console.log('New selected values:', newValues);
   setSelectedValues(newValues);
 };

 const uniqueValues = React.useMemo(() => {
   const unique = Array.from(new Set(values)).sort((a, b) => Number(a) - Number(b));
   console.log('Computed unique values:', unique);
   return unique;
 }, [values]);

 return (
   <div ref={filterRef} className="relative">
     <button
       onClick={() => {
         console.log('Toggle dropdown');
         setIsOpen(!isOpen);
       }}
       className={`w-full p-1 text-xs border rounded hover:bg-gray-50 ${
         selectedValues.length > 0 ? 'bg-blue-50' : ''
       }`}
       type="button"
     >
       {selectedValues.length > 0 
         ? `${selectedValues.length} selected` 
         : 'Filter'}
     </button>

     {isOpen && (
       <div className="absolute top-full left-0 z-10 w-48 max-h-48 overflow-y-auto bg-white border rounded shadow-lg">
         {uniqueValues.map(value => (
           <label 
             key={value} 
             className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
           >
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

// Мемоизация компонента
export default React.memo(MarkerFilter, (prevProps, nextProps) => {
 // Сравниваем только массивы values
 return (
   prevProps.values.length === nextProps.values.length &&
   prevProps.values.every((value, index) => value === nextProps.values[index])
 );
});