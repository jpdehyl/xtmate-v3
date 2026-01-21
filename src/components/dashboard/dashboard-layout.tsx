'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar showCommandCenter={true} />

      {/* Main content with sidebar offset */}
      <main className={cn(
        'transition-all duration-300 ease-out',
        'ml-[72px] lg:ml-[260px]', // Collapsed on mobile, expanded on desktop
      )}>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
