'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface IconFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Usually a lucide icon. Sized to 14px for you. */
  iconLeft?: React.ReactNode;
  /** An icon, or a small `<button>` (clear, copy) — buttons stay clickable. */
  iconRight?: React.ReactNode;
  /** Replaces `iconRight` with a spinner and sets `aria-busy` on the input. */
  loading?: boolean;
  /** Classes for the wrapper. `className` goes on the `<input>`, like a plain input. */
  wrapperClassName?: string;
}

/**
 * A `field-input` with an icon inset on either side.
 *
 * The icon slots are `pointer-events-none`, so a click on the glass lands on the
 * input and focuses it — an icon that swallows the click is a dead patch inside
 * the field. A `<button>` placed in a slot opts back in, which is how a clear or
 * reveal button goes in `iconRight` without a second component.
 */
const IconField = forwardRef<HTMLInputElement, IconFieldProps>(function IconField(
  { iconLeft, iconRight, loading = false, wrapperClassName, className, ...rest },
  ref,
) {
  const right = loading ? <Loader2 className="animate-spin" /> : iconRight;
  const slot =
    'pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center text-slate-400 dark:text-slate-500 [&_svg]:h-3.5 [&_svg]:w-3.5 [&_button]:pointer-events-auto';

  return (
    <div className={cn('relative w-full', wrapperClassName)}>
      {!!iconLeft && <span className={cn(slot, 'left-2.5')}>{iconLeft}</span>}
      <input
        ref={ref}
        aria-busy={loading || undefined}
        {...rest}
        className={cn('field-input', !!iconLeft && 'pl-8', !!right && 'pr-8', className)}
      />
      {!!right && <span className={cn(slot, 'right-2.5')}>{right}</span>}
    </div>
  );
});

export default IconField;
