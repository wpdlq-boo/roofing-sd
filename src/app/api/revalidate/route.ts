import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/supabase/server";

// Called by the admin pages after each save or delete so the public pages
// show the change right away instead of waiting for the 60-second refresh
// (SC-04, PG-08, PM-09, SM-07, FQ-06, FM-08).
export async function POST() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  // The site is small, so refresh every public page.
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
