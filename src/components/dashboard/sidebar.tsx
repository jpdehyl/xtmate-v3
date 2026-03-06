'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  Command,
  Briefcase,
  ShieldCheck,
  BarChart3,
  Users,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SignedIn, UserButton, useUser } from '@clerk/nextjs';
import { NewProjectModal } from '@/components/new-project';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/estimates', label: 'Estimates', icon: FileText },
    { href: '/dashboard/command-center', label: 'Command Center', icon: Command },
    { href: '/dashboard/portfolio', label: 'Portfolio', icon: Briefcase },
    { href: '/dashboard/qa-review', label: 'QA Review', icon: ShieldCheck },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/team', label: 'Team', icon: Users },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-stone-200 bg-white dark:border-ink-800 dark:bg-ink-950 transition-all duration-300',
          collapsed ? 'md:w-[84px]' : 'md:w-[260px]',
          mobileOpen ? 'w-[260px] translate-x-0' : 'w-[260px] -translate-x-full md:translate-x-0'
        )}
      >
        <div className={cn('flex h-16 items-center border-b border-stone-200 px-4 dark:border-ink-800', collapsed ? 'md:justify-center' : 'justify-between')}>
          <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onCloseMobile}>
            <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-pd-gold/40 bg-pd-gold/10">
              <Image src="/paul-davis-logo.png" alt="Paul Davis" fill className="object-contain p-1" priority />
            </div>
            <div className={cn('overflow-hidden', collapsed && 'md:hidden')}>
              <p className="font-semibold text-ink-950 dark:text-white">XtMate</p>
              <p className="text-xs uppercase tracking-wide text-pd-gold">Paul Davis</p>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseMobile}
            className="md:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapsed}
            className="hidden md:inline-flex"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <div className={cn('p-4', collapsed && 'md:px-3')}>
          <Button onClick={() => setIsNewProjectModalOpen(true)} className={cn('w-full bg-pd-gold text-white hover:bg-pd-gold/90', collapsed && 'md:px-0 md:justify-center')}>
            <Plus className="h-4 w-4" />
            <span className={cn('ml-2', collapsed && 'md:hidden')}>New Estimate</span>
          </Button>
        </div>

        <NewProjectModal isOpen={isNewProjectModalOpen} onClose={() => setIsNewProjectModalOpen(false)} />

        <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-pd-gold text-white'
                    : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-ink-800',
                  collapsed && 'md:justify-center md:px-0'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className={cn(collapsed && 'md:hidden')}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={cn('border-t border-stone-200 p-4 dark:border-ink-800', collapsed && 'md:px-3')}>
          <div className={cn('flex items-center gap-3', collapsed && 'md:justify-center')}>
            {mounted ? (
              <SignedIn>
                <UserButton afterSignOutUrl="/sign-in" />
                <UserInfo hide={collapsed} />
              </SignedIn>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-200 dark:bg-ink-700">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function UserInfo({ hide }: { hide: boolean }) {
  const { user } = useUser();
  if (!user || hide) return null;

  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium">{user.firstName} {user.lastName}</p>
      <p className="truncate text-xs text-stone-500">{user.primaryEmailAddress?.emailAddress}</p>
    </div>
  );
}
