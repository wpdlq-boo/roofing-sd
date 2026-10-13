"use client";

import { useEffect } from "react";
import { hardNavigate } from "@/lib/admin-client";
import { createClient } from "@/lib/supabase/client";

// Logs the admin out after 60 minutes without activity (AA-07). The last
// activity time is kept in localStorage so it also applies across tabs and
// after the browser is closed and reopened.

const IDLE_LIMIT_MS = 60 * 60 * 1000;
const STORAGE_KEY = "ermies-admin-last-activity";

export function markActivity() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Storage unavailable (private mode); the in-memory timer still works.
  }
}

function lastActivity(): number | null {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function IdleLogout() {
  useEffect(() => {
    let localLast = Date.now();
    let throttle = 0;

    const logOut = async () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      await createClient().auth.signOut();
      hardNavigate("/admin/login?reason=timeout");
    };

    const check = () => {
      const last = Math.max(localLast, lastActivity() ?? 0);
      if (Date.now() - last >= IDLE_LIMIT_MS) void logOut();
    };

    const onActivity = () => {
      const now = Date.now();
      localLast = now;
      if (now - throttle > 30_000) {
        throttle = now;
        markActivity();
      }
    };

    // Reopened after more than 60 minutes away.
    const stored = lastActivity();
    if (stored && Date.now() - stored >= IDLE_LIMIT_MS) {
      void logOut();
      return;
    }
    markActivity();

    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", check);
    const interval = window.setInterval(check, 60_000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", check);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
