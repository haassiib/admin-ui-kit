'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const VARIANT = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
} as const;

const SIZE = {
  sm: 'px-2.5 py-1 text-[11px] gap-1',
  md: 'px-3 py-2 text-xs gap-1.5',
  lg: 'px-4 py-2.5 text-sm gap-2',
} as const;

/**
 * `loading` also disables the button. A spinner on a still-clickable control is
 * how you get two submits, and every caller that remembered the spinner but
 * forgot `disabled` had that bug.
 */
const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: keyof typeof VARIANT;
    size?: keyof typeof SIZE;
    loading?: boolean;
  }
>(function Button({ variant = 'primary', size = 'md', loading = false, className, children, disabled, ...rest }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export default Button;
