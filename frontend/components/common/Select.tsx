'use client';

import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/util/cn';
import { useClickOutside } from '@/hooks/useClickOutside';

interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const Select = ({
  label,
  options,
  value,
  onChange,
  error,
  required,
  placeholder,
  className,
  disabled,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find((opt) => opt.value === value);

  useClickOutside(containerRef, () => setIsOpen(false));

  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={cn('space-y-3 w-full', className)} ref={containerRef}>
      {label && (
        <label className="text-[13px] font-bold text-text-main block">
          {label} {required && <span className="text-status-urgent">*</span>}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full h-12 px-4 bg-bg-sub/50 hover:bg-bg-sub border border-transparent rounded-xl outline-none transition-all flex items-center justify-between text-sm font-bold text-text-main disabled:opacity-50 disabled:cursor-not-allowed',
            isOpen && 'border-brand-primary/30 bg-bg-sub',
            error && 'border-status-urgent',
            !selectedOption && 'text-text-muted font-medium'
          )}
        >
          <span>{selectedOption ? selectedOption.label : placeholder || '선택하세요'}</span>
          <ChevronDown 
            size={16} 
            strokeWidth={2.5} 
            className={cn('text-text-muted transition-transform duration-200', isOpen && 'rotate-180')} 
          />
        </button>

        {/* Custom Options List (Dropdown Style) */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-bg-main border border-border-main rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-60 overflow-y-auto scrollbar-hide">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    'w-full text-left px-5 py-3 text-xs font-bold transition-colors',
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
        )}
      </div>
      
      {error && <p className="text-[11px] text-status-urgent font-medium">{error}</p>}
    </div>
  );
};
