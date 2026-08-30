'use client';

/* Origin: bonus-adjustment (96S2), verbatim. */

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, KeyRound, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/cn';
import Avatar from './Avatar';

export type DropdownUser = {
  name: string | null;
  email: string;
  avatarUrl: string | null;
  roleNames: string[];
  departmentCode: string | null;
};

/**
 * The account menu in the topbar. Sign-out posts the real `logout` server
 * action (passed in as `logoutAction`, since this is a client component) —
 * which clears `sessionToken` server-side, so the cookie cannot be replayed.
 */
export default function UserDropdown({
  user,
  logoutAction,
}: {
  user: DropdownUser;
  logoutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const itemClasses =
    'w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left rounded-lg transition-colors text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 p-1 pr-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800',
          open && 'bg-slate-100 dark:bg-slate-800',
        )}
      >
        <Avatar name={user.name} email={user.email} avatarUrl={user.avatarUrl} size="sm" />
        <ChevronDown
          className={cn('w-3.5 h-3.5 text-slate-400 transition-transform', open && 'rotate-180')}
        />
      </button>

      {/* `panel-solid` is `.panel` without the translucency: this floats over
          page content rather than sitting on the gradient ground, so the
          frosted default shows whatever is behind it straight through the
          menu. Shared with the other two header dropdowns. */}
      {open && (
        <div className="absolute right-0 mt-2 w-64 panel panel-solid p-2 z-50">
          <div className="flex items-center gap-3 px-2 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
            <Avatar name={user.name} email={user.email} avatarUrl={user.avatarUrl} size="md" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                {user.name || user.email}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {user.roleNames.join(', ') || 'No role assigned'}
                {user.departmentCode ? ` · ${user.departmentCode}` : ''}
              </p>
            </div>
          </div>

          <Link href="/profile" onClick={() => setOpen(false)} className={itemClasses}>
            <User className="w-3.5 h-3.5 text-slate-400" />
            My profile
          </Link>
          <Link href="/change-password" onClick={() => setOpen(false)} className={itemClasses}>
            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            Change password
          </Link>

          <form action={logoutAction}>
            <button
              type="submit"
              className={cn(
                itemClasses,
                'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40',
              )}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
