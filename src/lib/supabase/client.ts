"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "./env";

// Browser client for the admin pages. The session lives in cookies so the
// server (proxy, layouts, /api/revalidate) can read it too.
export function createClient() {
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
