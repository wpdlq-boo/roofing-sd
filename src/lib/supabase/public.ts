import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabasePublishableKey, supabaseUrl } from "./env";

// Anonymous, cookie-free client for public pages. Because it never reads the
// request, those pages stay statically rendered and refresh through ISR.
export function createPublicClient() {
  return createSupabaseClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
