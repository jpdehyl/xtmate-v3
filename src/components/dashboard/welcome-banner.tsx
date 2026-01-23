'use client';

import { useUser } from '@clerk/nextjs';
import { Sparkles, ArrowRight, Clock } from 'lucide-react';
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
        'bg-gold-gradient',
        'p-6 md:p-8',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold-400/20 rounded-full blur-3xl" />
        {/* Dots pattern overlay */}
        <div className="absolute inset-0 hero-dots opacity-10" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Clock className="w-4 h-4 text-white/80" />
              <span className="text-sm font-medium text-white/90">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">
            {greeting}, {firstName}!
          </h1>

          {activeClaimsCount > 0 ? (
            <p className="text-lg text-white/85">
              You have <span className="font-bold text-white">{activeClaimsCount} active estimate{activeClaimsCount !== 1 ? 's' : ''}</span> to review today.
            </p>
          ) : (
            <p className="text-lg text-white/85">
              Ready to make today productive!
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {activeClaimsCount > 0 && (
            <Link
              href="/dashboard?status=in_progress"
              className={cn(
                'inline-flex items-center gap-2 px-6 py-3 rounded-xl',
                'bg-white text-gold-700 font-semibold text-sm',
                'shadow-lg hover:shadow-xl',
                'transition-all duration-300 ease-out-expo',
                'hover:-translate-y-0.5 hover:gap-3'
              )}
            >
              View Active Estimates
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link
            href="/dashboard/estimates/new"
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3 rounded-xl',
              'bg-white/15 hover:bg-white/25 backdrop-blur-sm',
              'text-white font-semibold text-sm',
              'border border-white/20',
              'transition-all duration-300',
            )}
          >
            <Sparkles className="w-4 h-4" />
            New Estimate
          </Link>
        </div>
      </div>
    </div>
  );
}
