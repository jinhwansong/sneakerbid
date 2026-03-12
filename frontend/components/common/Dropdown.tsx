'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/util/cn';
import { Button } from '@/components/common/Button';

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  options: readonly DropdownOption[];
  value: string;
  onSelect: (value: string) => void;
  className?: string;
  width?: string;
}

export default function Dropdown({ 
  options, 
  value, 
  onSelect, 
  className,
  width = 'w-40' 
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div
      className={cn('relative group', className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Button
        variant="ghost"
        size="sm"
        className="h-10 gap-1.5 text-sm font-bold text-text-main"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {selectedOption?.label || '선택'}
        <ChevronDown size={16} className={cn('text-text-muted transition-transform', isOpen && 'rotate-180')} />
      </Button>
      
      {/* Dropdown Menu Container with Bridge for Hover */}
      <div className={cn(
        'absolute right-0 top-full pt-2 transition-all z-20',
        isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none',
        width
      )}>
        <div className="bg-bg-main border border-border-main rounded-2xl shadow-xl overflow-hidden">
          {options.map((opt) => (
            <Button
              key={opt.value}
              variant="ghost"
              size="md"
              fullWidth
              onClick={() => onSelect(opt.value)}
              className={cn(
                'justify-start px-5 py-3 text-xs rounded-none',
                value === opt.value
                  ? 'bg-bg-sub text-brand-primary'
                  : 'text-text-sub hover:bg-bg-sub hover:text-text-main'
              )}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
