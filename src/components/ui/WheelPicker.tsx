'use client';

import { useRef, useEffect } from 'react';

interface WheelPickerProps {
  items: (string | number)[];
  value: string | number;
  onChange: (value: string | number) => void;
  unit?: string;
}

export function WheelPicker({ items, value, onChange, unit }: WheelPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 44; // Altura de cada linha em px

  // Rolar até o item selecionado inicialmente
  useEffect(() => {
    if (containerRef.current) {
      const index = items.indexOf(value);
      if (index !== -1) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    }
  }, []);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    if (items[index] !== undefined && items[index] !== value) {
      onChange(items[index]);
    }
  };

  return (
    <div className="relative h-[132px] w-20 select-none overflow-hidden text-center">
      {/* Linhas de destaque central (visor) */}
      <div className="pointer-events-none absolute left-0 right-0 top-[44px] h-[44px] border-b-2 border-t-2 border-blue-500/80 bg-blue-500/10" />

      {/* Container com scroll snap vertical */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="no-scrollbar h-full overflow-y-scroll"
        style={{
          scrollSnapType: 'y mandatory',
          paddingTop: '44px',
          paddingBottom: '44px',
        }}
      >
        {items.map((item) => {
          const isSelected = item === value;
          return (
            <div
              key={item.toString()}
              onClick={() => {
                onChange(item);
                const index = items.indexOf(item);
                if (containerRef.current) {
                  containerRef.current.scrollTo({
                    top: index * itemHeight,
                    behavior: 'smooth',
                  });
                }
              }}
              className={`flex h-[44px] cursor-pointer items-center justify-center text-lg font-bold transition-all ${
                isSelected ? 'scale-110 text-2xl text-white' : 'text-sm text-gray-500 opacity-40'
              }`}
              style={{ scrollSnapAlign: 'center' }}
            >
              {typeof item === 'number' && item < 10 ? `0${item}` : item}
              {unit && isSelected && <span className="ml-1 text-xs font-normal text-blue-400">{unit}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}