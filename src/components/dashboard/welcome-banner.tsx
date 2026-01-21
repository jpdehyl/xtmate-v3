'use client';

import { useUser } from '@clerk/nextjs';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface WelcomeBannerProps {
  activeClaimsCount?: number;
  className?: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function WelcomeBanner({ activeClaimsCount = 0, className }: WelcomeBannerProps) {
  const [mounted, setMounted] = useState(false);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  const firstName = (mounted && isLoaded && user?.firstName) || 'there';
  const greeting = getGreeting();

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-primary-500/90 via-primary-600/90 to-primary-700/90',
        'p-6 md:p-8',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white/80" />
            <span className="text-sm font-medium text-white/80">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {greeting}, {firstName}!
          </h1>

          {activeClaimsCount > 0 ? (
            <p className="text-white/80">
              You have <span className="font-semibold text-white">{activeClaimsCount} active estimate{activeClaimsCount !== 1 ? 's' : ''}</span> to review today.
            </p>
          ) : (
            <p className="text-white/80">
              Ready to make today productive!
            </p>
          )}
        </div>

        {activeClaimsCount > 0 && (
          <Link
            href="/dashboard?status=in_progress"
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl',
              'bg-white/20 hover:bg-white/30 backdrop-blur-sm',
              'text-white font-medium text-sm',
              'transition-all duration-200',
              'hover:gap-3'
            )}
          >
            View Active Estimates
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
