'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onSelect: (value: string) => void;
  className?: string;
  width?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ 
  options, 
  value, 
  onSelect, 
  className,
  width = 'w-40' 
}) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn('relative group', className)}>
      <button className="flex items-center gap-1.5 text-sm font-bold text-text-main cursor-pointer h-10">
        {selectedOption?.label || '선택'}
        <ChevronDown size={16} className="text-text-muted transition-transform group-hover:rotate-180" />
      </button>
      
      {/* Dropdown Menu Container with Bridge for Hover */}
      <div className={cn(
        'absolute right-0 top-full pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all z-20',
        width
      )}>
        <div className="bg-bg-main border border-border-main rounded-2xl shadow-xl overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className={cn(
                'w-full px-5 py-3 text-left text-xs font-bold transition-colors cursor-pointer',
                value === opt.value
                  ? 'bg-bg-sub text-brand-primary'
                  : 'text-text-sub hover:bg-bg-sub hover:text-text-main'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
