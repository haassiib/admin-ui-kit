'use client';

/* Origin: bonus-adjustment (96S2), verbatim. */

import { useRef, useState } from 'react';
import { Moon, Sun, Type, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDismiss } from '@/lib/use-dismiss';
import { useTheme, type Density } from '@/contexts/ThemeContext';

const DENSITIES: readonly Density[] = ['compact', 'standard', 'comfortable'];

export default function ThemeSettings() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme, setTheme, density, setDensity } = useTheme();

  useDismiss(ref, open, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Appearance"
        aria-label="Appearance"
        className={cn(
          'p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
          open && 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200',
        )}
      >
        <SlidersHorizontal className="w-4 h-4" />
      </button>

      {/* `panel-solid` is `.panel` without the translucency: this floats over
          page content rather than sitting on the gradient ground, so the
          frosted default shows whatever is behind it straight through the
          menu. Shared with the other two header dropdowns. */}
      {open && (
        <div className="absolute right-0 mt-2 w-60 panel panel-solid p-3 z-50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Sun className="w-3.5 h-3.5" /> Theme
            </span>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-label="Light theme"
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  theme === 'light'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-500'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200',
                )}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-label="Dark theme"
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  theme === 'dark'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500 dark:text-indigo-300'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200',
                )}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Type className="w-3.5 h-3.5" /> Density
            </span>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              {DENSITIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDensity(d)}
                  className={cn(
                    'px-2 py-1.5 text-[10px] font-medium rounded-md capitalize truncate transition-colors',
                    density === d
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
