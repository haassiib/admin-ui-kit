'use client';

/* Origin: bonus-adjustment (96S2), verbatim. */

import { useEffect, useRef } from 'react';

/**
 * Auto-lock: signs the user out after IDLE_LIMIT_MS with no activity. This is a
 * console that moves money, and it runs on shared VPN workstations.
 *
 * The last-activity timestamp lives in localStorage, not a ref, so activity in
 * ANY tab keeps every tab alive — otherwise someone working in one tab gets
 * yanked to /login by an idle one next to it.
 *
 * The check runs on an interval AND on visibilitychange, so a laptop waking from
 * sleep locks immediately instead of waiting for the next tick. It calls the
 * real `logout` server action, which nulls `sessionToken` — this is a genuine
 * revocation, not a client-side redirect.
 */

const IDLE_LIMIT_MS = 15 * 60 * 1000;
const STAMP_THROTTLE_MS = 5_000;
const CHECK_INTERVAL_MS = 30_000;
const STORAGE_KEY = 'ba.lastActivity';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart'] as const;

export default function IdleLogout({ logoutAction }: { logoutAction: () => Promise<void> }) {
  const loggingOut = useRef(false);

  useEffect(() => {
    const stamp = (t: number) => {
      try {
        localStorage.setItem(STORAGE_KEY, String(t));
      } catch {
        // Private mode / storage disabled: fall back to never locking rather
        // than locking on every tick off a value that can't be written.
      }
    };
    stamp(Date.now());

    let last = Date.now();
    const onActivity = () => {
      const now = Date.now();
      if (now - last >= STAMP_THROTTLE_MS) {
        last = now;
        stamp(now);
      }
    };

    const check = async () => {
      if (loggingOut.current) return;
      let stored: number;
      try {
        stored = Number(localStorage.getItem(STORAGE_KEY) ?? '0');
      } catch {
        return;
      }
      if (!stored || Date.now() - stored < IDLE_LIMIT_MS) return;

      loggingOut.current = true;
      try {
        await logoutAction();
      } catch {
        // logout() redirects via NEXT_REDIRECT, which Next handles; anything
        // else still has to get the user off the page.
        window.location.href = '/login';
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void check();
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', onVisibility);
    const timer = setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(timer);
    };
  }, [logoutAction]);

  return null;
}
