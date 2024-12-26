import { useRef, useEffect, useState, useMemo } from 'react';

interface VirtualizationOptions {
  items: any[];
  rowHeight: number;
  overscan?: number;
}

export function useVirtualization({ 
  items, 
  rowHeight, 
  overscan = 3 
}: VirtualizationOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      setHeight(entries[0].contentRect.height);
    });

    observer.observe(container);
    
    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };
    
    container.addEventListener('scroll', handleScroll);
    
    return () => {
      observer.disconnect();
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const virtualItems = useMemo(() => {
    if (!height) return [];

    const start = Math.floor(scrollTop / rowHeight);
    const visibleCount = Math.ceil(height / rowHeight);
    const startIndex = Math.max(0, start - overscan);
    const endIndex = Math.min(items.length, start + visibleCount + overscan);

    return Array.from({ length: endIndex - startIndex }, (_, index) => {
      const virtualIndex = startIndex + index;
      return {
        index: virtualIndex,
        start: virtualIndex * rowHeight,
        size: rowHeight,
        item: items[virtualIndex]
      };
    });
  }, [items, height, scrollTop, rowHeight, overscan]);

  const totalSize = items.length * rowHeight;

  return {
    containerRef,
    virtualItems,
    totalSize
  };
}