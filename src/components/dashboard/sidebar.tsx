'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  BarChart3,
  FileText,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  User,
  LineChart,
  Mail,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SignedIn, UserButton, useUser } from '@clerk/nextjs';

interface SidebarProps {
  // Reserved for future props
}

// Lazy initialization helper - reads from localStorage only once on mount
function getInitialCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('xtmate_sidebar_collapsed');
  return saved === 'true';
}

export function Sidebar({}: SidebarProps) {
  const pathname = usePathname();
  // Lazy state initialization - avoids reading localStorage on every render
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const [mounted, setMounted] = useState(false);

  // Handle hydration - only for mounted state now
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('xtmate_sidebar_collapsed', String(newState));
  };

  // Main navigation items
  const mainNavItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: Home,
      show: true
    },
    {
      href: '/dashboard/incoming-requests',
      label: 'Incoming Requests',
      icon: Mail,
      show: true
    },
    {
      href: '/dashboard/estimates',
      label: 'Projects',
      icon: FileText,
      show: true
    },
    {
      href: '/dashboard/portfolio',
      label: 'Portfolio',
      icon: BarChart3,
      show: true
    },
    {
      href: '/dashboard/analytics',
      label: 'Analytics',
      icon: LineChart,
      show: true
    },
  ];

  // Secondary navigation items
  const secondaryNavItems = [
    { href: '/dashboard/settings/integrations', label: 'Settings', icon: Settings, show: true },
    { href: '/dashboard/help', label: 'Help & Support', icon: HelpCircle, show: true },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const visibleMainItems = mainNavItems.filter(item => item.show);
  const visibleSecondaryItems = secondaryNavItems.filter(item => item.show);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40',
        'flex flex-col',
        'bg-white dark:bg-ink-950 border-r border-stone-200 dark:border-ink-800',
        'transition-all duration-300 ease-out-expo',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo Section */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-stone-200 dark:border-ink-800',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/20 group-hover:shadow-gold-500/30 transition-shadow duration-300 flex-shrink-0 overflow-hidden">
            <Image
              src="/paul-davis-logo.png"
              alt="Paul Davis"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="font-display text-lg font-bold text-ink-950 dark:text-white tracking-tight">
                XtMate Pro
              </span>
            </div>
          )}
        </Link>

        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="h-8 w-8 text-stone-500 hover:text-ink-950 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-ink-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* New Project Button */}
      <div className={cn('p-4', collapsed && 'px-3')}>
        <Button
          asChild
          className={cn(
            'w-full btn-gold rounded-xl',
            collapsed ? 'px-0 justify-center' : ''
          )}
        >
          <Link href="/dashboard/estimates/new">
            <Plus className="w-4 h-4" />
            {!collapsed && <span className="ml-2 font-semibold">New Project</span>}
          </Link>
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 scrollbar-thin">
        <div className="space-y-1">
          {visibleMainItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl',
                  'transition-all duration-200 ease-out',
                  active
                    ? 'bg-gold-gradient text-white shadow-md shadow-gold-500/20'
                    : 'text-stone-600 dark:text-stone-400 hover:text-ink-950 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-ink-800',
                  collapsed && 'justify-center px-0'
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors duration-200',
                  active ? 'text-white' : 'text-stone-500 dark:text-stone-500 group-hover:text-ink-950 dark:group-hover:text-white'
                )} />
                {!collapsed && (
                  <span className={cn(
                    'text-sm font-medium',
                    active ? 'text-white' : ''
                  )}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className={cn(
          'my-4 border-t border-stone-200 dark:border-ink-800',
          collapsed && 'mx-2'
        )} />

        {/* Secondary Navigation */}
        <div className="space-y-1">
          {visibleSecondaryItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl',
                  'transition-all duration-200 ease-out',
                  active
                    ? 'bg-stone-100 dark:bg-ink-800 text-ink-950 dark:text-white'
                    : 'text-stone-600 dark:text-stone-400 hover:text-ink-950 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-ink-800',
                  collapsed && 'justify-center px-0'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Collapse Toggle (when collapsed) */}
      {collapsed && (
        <div className="px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="w-full h-10 text-stone-500 hover:text-ink-950 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-ink-800"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* User Section */}
      <div className={cn(
        'border-t border-stone-200 dark:border-ink-800 p-4',
        collapsed && 'px-3'
      )}>
        <div className={cn(
          'flex items-center gap-3',
          collapsed && 'justify-center'
        )}>
          {mounted ? (
            <SignedIn>
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: 'w-9 h-9 ring-2 ring-gold-500/30'
                  }
                }}
              />
              {!collapsed && <UserInfo />}
            </SignedIn>
          ) : (
            <div className="w-9 h-9 rounded-full bg-stone-200 dark:bg-ink-700 flex items-center justify-center">
              <User className="w-5 h-5 text-stone-500 dark:text-stone-400" />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function UserInfo() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-ink-950 dark:text-white truncate">
        {user.firstName} {user.lastName}
      </p>
      <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
        {user.primaryEmailAddress?.emailAddress}
      </p>
    </div>
  );
}
