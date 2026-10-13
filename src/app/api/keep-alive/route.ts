import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

// Run daily by Vercel Cron (see vercel.json) so a free Supabase project is
// never paused for inactivity (AVL-04).
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { error } = await createPublicClient().from("services").select("id").limit(1);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
