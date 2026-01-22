'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarWidgetProps {
  className?: string;
}

export function CalendarWidget({ className }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const days: Array<{ day: number; isCurrentMonth: boolean; isToday: boolean }> = [];
    
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = 
        i === today.getDate() && 
        month === today.getMonth() && 
        year === today.getFullYear();
      
      days.push({
        day: i,
        isCurrentMonth: true,
        isToday,
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    return days;
  }, [currentDate, today]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className={cn('rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm', className)}>
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Calendar</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToToday}
            className="text-sm font-medium text-gray-900 dark:text-white hover:text-pd-gold transition-colors"
          >
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <button
              key={index}
              className={cn(
                'aspect-square flex items-center justify-center text-sm rounded-lg transition-colors',
                day.isCurrentMonth
                  ? 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  : 'text-gray-300 dark:text-gray-600',
                day.isToday && 'bg-pd-gold text-white hover:bg-pd-gold-dark font-semibold'
              )}
            >
              {day.day}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
