"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { compressImage } from "@/lib/image-compress";
import { adminPhotoRules } from "@/lib/validation";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

export const SESSION_ENDED_URL = "/admin/login?reason=session";

// Full page load (not client navigation) so no admin data stays in memory
// after the session ends.
export function hardNavigate(path: string) {
  window.location.href = path;
}

// Ask the server to refresh the public pages after a change (PM-09 etc.).
// A failure here only delays the update until the 60-second refresh.
export async function refreshPublicSite(): Promise<void> {
  try {
    const res = await fetch("/api/revalidate", { method: "POST" });
    if (res.status === 401) hardNavigate(SESSION_ENDED_URL);
  } catch {
    // Ignore; ISR picks the change up within 60 seconds.
  }
}

type DbError = { code?: string; message?: string; status?: number } | null | undefined;

// Expired or missing session: send the admin back to log in (SRS 3.2.6.5).
export function isSessionError(error: DbError): boolean {
  if (!error) return false;
  return (
    error.status === 401 ||
    error.code === "PGRST301" ||
    error.code === "PGRST303" ||
    error.code === "42501" || // RLS rejected: not logged in
    /jwt/i.test(error.message ?? "")
  );
}

export async function requireSession(supabase: SupabaseClient): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    hardNavigate(SESSION_ENDED_URL);
    throw new Error("No session");
  }
  return token;
}

export function checkImageFile(file: File): string | null {
  if (!adminPhotoRules.acceptedTypes.includes(file.type as never)) {
    return `"${file.name}" is not a JPEG, PNG, or WebP photo.`;
  }
  if (file.size > adminPhotoRules.maxBytesEach) {
    return `"${file.name}" is larger than 10 MB.`;
  }
  return null;
}

// Resizes to 2,400 px / 1 MB (DB-07) and uploads straight to Supabase Storage
// with progress reporting (PM-07). Returns the storage path.
export async function uploadImage({
  supabase,
  bucket,
  folder,
  file,
  onProgress,
}: {
  supabase: SupabaseClient;
  bucket: string;
  folder: string;
  file: File;
  onProgress?: (percent: number) => void;
}): Promise<string> {
  const blob = await compressImage(file, {
    maxDimension: adminPhotoRules.maxDimension,
    maxBytes: adminPhotoRules.maxOutputBytes,
  });
  const token = await requireSession(supabase);
  const path = `${folder}/${crypto.randomUUID()}.jpg`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${supabaseUrl}/storage/v1/object/${bucket}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", supabasePublishableKey);
    xhr.setRequestHeader("Content-Type", "image/jpeg");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else if (xhr.status === 401 || xhr.status === 403) {
        hardNavigate(SESSION_ENDED_URL);
        reject(new Error("Session ended"));
      } else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(blob);
  });

  onProgress?.(100);
  return path;
}

export async function removeImages(supabase: SupabaseClient, bucket: string, paths: string[]) {
  if (paths.length === 0) return;
  await supabase.storage.from(bucket).remove(paths);
}

// Move an item up or down in a list.
export function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
