// Public Supabase settings. Both values are safe to expose to the browser;
// Row Level Security decides what each visitor can read or change.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const buckets = {
  serviceImages: "service-images",
  portfolioPhotos: "portfolio-photos",
} as const;

export function publicImageUrl(bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}
