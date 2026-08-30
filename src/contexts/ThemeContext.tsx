'use client';

/**
 * Appearance state: colour scheme and row density, both persisted per browser.
 *
 * Two deliberate choices carried over from marketing-stats:
 *   * Dark mode is a CLASS on <html>, not a media query — a shared VPN
 *     workstation keeps what the person using it chose, not what the OS says.
 *   * Density drives BOTH the root font-size and a `data-density` attribute.
 *     The attribute is what globals.css's unlayered table rules key off, which
 *     is how one setting re-times every table without touching any page.
 *
 * `mounted` exists to avoid writing localStorage on the first render pass, which
 * would overwrite a stored preference with the default before it was read.
 */

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
export type Density = 'compact' | 'standard' | 'comfortable';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  density: Density;
  setDensity: (d: Density) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const ROOT_FONT_SIZE: Record<Density, string> = {
  compact: '13px',
  standard: '14px',
  comfortable: '16px',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [density, setDensity] = useState<Density>('standard');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('ba.theme') as Theme | null;
    const storedDensity = localStorage.getItem('ba.density') as Density | null;

    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // No stored choice: follow the OS ONCE, then persist whatever the user does.
      setTheme('dark');
    }
    if (storedDensity) setDensity(storedDensity);

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;

    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('ba.theme', theme);

    root.style.fontSize = ROOT_FONT_SIZE[density];
    root.setAttribute('data-density', density);
    localStorage.setItem('ba.density', density);
  }, [theme, density, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, density, setDensity }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside a ThemeProvider');
  return ctx;
}
