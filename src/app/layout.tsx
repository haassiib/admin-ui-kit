import type { Metadata } from 'next';
import { Toaster } from 'sonner';

import ThemeScript from '@/components/layout/ThemeScript';
import DashShell from '@/components/gallery/DashShell';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DEMO_USER, NOTIFICATIONS } from '@/registry/fixtures';
import { buildBreadcrumbLabels, buildGalleryMenu } from '@/registry/menu';
import './globals.css';

export const metadata: Metadata = {
  title: '96 Group Components',
  description: 'Shared component library extracted from marketing-stats and bonus-adjustment',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Built here rather than inside the shell so it stays plain data crossing the
  // server/client boundary — the menu is derived from the catalog, which is
  // static, so there is nothing to recompute per navigation.
  const menu = buildGalleryMenu();
  const labels = buildBreadcrumbLabels();

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
        {/* Both providers are bonus-adjustment's, VERBATIM. Before the merge
            this had to be an adapter: two ThemeContexts, one per app, each
            toggling the same `.dark` class from its own state, so mounting both
            meant one silently undoing the other. Merging to a single component
            set left a single context, and the shim went with it. */}
        <ThemeProvider>
          <SidebarProvider>
            <DashShell menu={menu} labels={labels} user={DEMO_USER} notifications={NOTIFICATIONS}>
              {children}
            </DashShell>
            <Toaster position="top-right" closeButton toastOptions={{ className: 'text-xs' }} />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
