import type { Metadata } from 'next';
import { Toaster } from 'sonner';

import ThemeScript from '@/components/layout/ThemeScript';
import DashShell from '@/components/gallery/DashShell';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { buildGalleryMenu } from '@/registry/menu';
import './globals.css';

export const metadata: Metadata = {
  title: 'Admin UI Kit',
  description: '55 React components for admin and dashboard interfaces.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Built here so it crosses the server/client boundary as plain data; the
  // catalog is static, so there is nothing to recompute per navigation.
  const sections = buildGalleryMenu();

  return (
    // suppressHydrationWarning: ThemeScript writes class/style on <html> before
    // React hydrates, so the server-rendered attributes never match by design.
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <ThemeScript />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        {/* ThemeProvider drives the colour scheme and density. SidebarProvider
            is still mounted because the catalogued `Sidebar` demo needs it —
            `Layout` deliberately owns its own open state instead. */}
        <ThemeProvider>
          <SidebarProvider>
            <DashShell sections={sections}>{children}</DashShell>
            <Toaster position="top-right" closeButton toastOptions={{ className: 'text-xs' }} />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
