'use client';

import { useState, useMemo } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DateRange = {
  start: Date;
  end: Date;
  label: string;
};

export type DateRangePreset = '7d' | '30d' | '90d' | '1y' | 'ytd' | 'all' | 'custom';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const PRESETS: { key: DateRangePreset; label: string; getRange: () => DateRange }[] = [
  {
    key: '7d',
    label: 'Last 7 days',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return { start, end, label: 'Last 7 days' };
    },
  },
  {
    key: '30d',
    label: 'Last 30 days',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return { start, end, label: 'Last 30 days' };
    },
  },
  {
    key: '90d',
    label: 'Last 90 days',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 90);
      return { start, end, label: 'Last 90 days' };
    },
  },
  {
    key: '1y',
    label: 'Last 12 months',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setFullYear(start.getFullYear() - 1);
      return { start, end, label: 'Last 12 months' };
    },
  },
  {
    key: 'ytd',
    label: 'Year to date',
    getRange: () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), 0, 1);
      return { start, end, label: 'Year to date' };
    },
  },
  {
    key: 'all',
    label: 'All time',
    getRange: () => {
      const end = new Date();
      const start = new Date(2020, 0, 1); // Project start
      return { start, end, label: 'All time' };
    },
  },
];

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const displayValue = useMemo(() => {
    if (value.label && value.label !== 'Custom') {
      return value.label;
    }
    return `${formatDate(value.start)} - ${formatDate(value.end)}`;
  }, [value]);

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
          'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
          'hover:bg-gray-50 dark:hover:bg-gray-800',
          'text-sm font-medium text-gray-700 dark:text-gray-300'
        )}
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span>{displayValue}</span>
        <ChevronDown className={cn('w-4 h-4 text-gray-500 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-[200px]">
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                onClick={() => {
                  onChange(preset.getRange());
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm transition-colors',
                  value.label === preset.label
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function getDefaultDateRange(): DateRange {
  return PRESETS.find(p => p.key === '30d')!.getRange();
}
