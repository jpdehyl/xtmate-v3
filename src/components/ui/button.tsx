import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-250 ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-gold-gradient text-white shadow-lg shadow-gold-500/25 hover:shadow-xl hover:shadow-gold-500/35 hover:-translate-y-0.5',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md',
        outline:
          'border-2 border-stone-200 dark:border-ink-700 bg-transparent hover:bg-stone-100 dark:hover:bg-ink-800 hover:border-gold-400 dark:hover:border-gold-500 text-ink-950 dark:text-white',
        secondary:
          'bg-stone-100 dark:bg-ink-800 text-ink-950 dark:text-white hover:bg-stone-200 dark:hover:bg-ink-700',
        ghost: 'hover:bg-stone-100 dark:hover:bg-ink-800 text-ink-950 dark:text-white',
        link: 'text-gold-600 dark:text-gold-400 underline-offset-4 hover:underline',
        gold: 'btn-gold',
        'gold-outline': 'btn-gold-outline',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 rounded-lg px-4 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        xl: 'h-14 rounded-2xl px-10 text-lg',
        icon: 'h-10 w-10 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
